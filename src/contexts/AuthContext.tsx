// src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as AppUser } from '../types'; // Seu tipo de usuário da aplicação
import { Session, User as SupabaseUser } from '@supabase/supabase-js'; // Tipos do Supabase
import { toast } from 'sonner';
import { supabase, } from '../integrations/supabase/client'; // Seu cliente Supabase inicializado

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para mapear o SupabaseUser para o seu tipo AppUser
// Ajuste esta função conforme a estrutura do seu tipo AppUser e onde você armazena
// os metadados do usuário no Supabase (geralmente em supabaseUser.user_metadata).
const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): AppUser => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '', // Garante que email é sempre string
    name: supabaseUser.user_metadata?.full_name || // Tenta pegar de user_metadata.full_name
          supabaseUser.email?.split('@')[0] ||   // Fallback para a parte local do email
          'Usuário',                             // Fallback final
    // Adicione outros campos que seu AppUser possa ter, buscando de user_metadata
    // Ex: avatar_url: supabaseUser.user_metadata?.avatar_url,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Começa como true

  useEffect(() => {
    console.log("AuthProvider: Montado, verificando sessão inicial...");
    setIsLoading(true);

    // 1. Tenta obter a sessão do Supabase ao carregar
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ? mapSupabaseUserToAppUser(currentSession.user) : null);
      setIsLoading(false);
      console.log("AuthProvider: Sessão inicial carregada do getSession():", currentSession);
    }).catch(error => {
      console.error("AuthProvider: Erro ao obter sessão inicial via getSession():", error);
      setIsLoading(false); // Garante que loading para em caso de erro
    });

    // 2. Ouve mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // O onAuthStateChange pode ser chamado múltiplas vezes na inicialização.
        // O setIsLoading(true) aqui pode causar um piscar extra se não for cuidadoso.
        // Se getSession() já setou isLoading para false, talvez não precise setar para true aqui novamente
        // a menos que seja um evento de logout/login que realmente altere o estado de carregamento.
        console.log("AuthProvider: Evento AuthStateChange disparado:", event, currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ? mapSupabaseUserToAppUser(currentSession.user) : null);
        
        // Garanta que isLoading só seja false após a primeira determinação de estado
        if (isLoading && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')) {
            setIsLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
      console.log("AuthProvider: Listener de AuthStateChange removido.");
    };
  }, []); // Array de dependências vazio para rodar apenas uma vez na montagem

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) {
        console.error("AuthProvider: Erro no login com Supabase:", error);
        toast.error(error.message || 'Falha no login.');
        setIsLoading(false);
        return false;
      }

      // O listener onAuthStateChange já deve ter atualizado user e session.
      // Se data.session e data.user existirem, o evento SIGNED_IN foi bem-sucedido.
      if (data.session && data.user) {
        toast.success('Login bem-sucedido!');
        // setIsLoading(false) será tratado pelo onAuthStateChange
        return true;
      }
      
      // Caso inesperado: sem erro, mas sem sessão/usuário.
      toast.error('Falha no login. Resposta inesperada do servidor.');
      setIsLoading(false);
      return false;

    } catch (error) {
      console.error("AuthProvider: Erro capturado no login:", error);
      toast.error('Erro inesperado ao fazer login.');
      setIsLoading(false);
      return false;
    }
    // Não precisa de finally setIsLoading(false) aqui se onAuthStateChange já faz
  };

  const logout = async () => {
    setIsLoading(true); // Opcional: feedback de loading para logout
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("AuthProvider: Erro no logout com Supabase:", error);
      toast.error(error.message || 'Falha no logout.');
    } else {
      // O listener onAuthStateChange cuidará de limpar user e session.
      toast.success('Logout realizado');
    }
    // setIsLoading(false) será tratado pelo onAuthStateChange (evento SIGNED_OUT)
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user && !!session,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
