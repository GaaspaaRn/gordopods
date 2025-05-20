import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as AppUser } from '../types'; // Renomeie para evitar conflito com User do Supabase
import { Session, User as SupabaseUser } from '@supabase/supabase-js'; // Importe tipos do Supabase
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client'; // Importe seu cliente Supabase

interface AuthContextType {
  user: AppUser | null; // Use seu tipo AppUser aqui
  session: Session | null; // Adicione a sessão do Supabase
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; // Logout agora pode ser assíncrono
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// REMOVA MOCK_USER e MOCK_PASSWORD - Não serão mais necessários

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Tenta obter a sessão do Supabase ao carregar
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      // Mapeie o SupabaseUser para seu AppUser se necessário, ou use SupabaseUser diretamente
      // Este é um exemplo simples de mapeamento, ajuste conforme seu tipo AppUser
      setUser(currentSession?.user ? mapSupabaseUserToAppUser(currentSession.user) : null);
      setIsLoading(false);
      console.log("AuthProvider: Sessão inicial carregada:", currentSession);
    }).catch(error => {
      console.error("AuthProvider: Erro ao obter sessão inicial:", error);
      setIsLoading(false);
    });

    // Ouve mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("AuthProvider: Evento AuthStateChange:", event, currentSession);
        setSession(currentSession);
        // Mapeie o SupabaseUser para seu AppUser
        setUser(currentSession?.user ? mapSupabaseUserToAppUser(currentSession.user) : null);
        setIsLoading(false);

        // Removido o _saveSession e _removeSession explícitos, pois o cliente Supabase
        // com persistSession=true já gerencia o localStorage.
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Função para mapear SupabaseUser para seu tipo AppUser
  // Ajuste isso conforme a estrutura do seu tipo AppUser em ../types
  const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): AppUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '', // SupabaseUser.email pode ser undefined
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário', // Exemplo
      // Adicione outros campos que seu AppUser possa ter, buscando de user_metadata
    };
  };

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) {
        console.error("AuthProvider: Supabase login error:", error);
        toast.error(error.message || 'Falha no login.');
        setIsLoading(false);
        return false;
      }

      // onAuthStateChange já vai atualizar user e session
      if (data.session && data.user) {
        toast.success('Login bem-sucedido!');
        setIsLoading(false);
        return true;
      }
      
      // Caso inesperado onde não há erro mas também não há sessão/usuário
      toast.error('Falha no login. Resposta inesperada do servidor.');
      setIsLoading(false);
      return false;

    } catch (error) {
      console.error("AuthProvider: Login catch error:", error);
      toast.error('Erro inesperado ao fazer login.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthProvider: Supabase logout error:", error);
      toast.error(error.message || 'Falha no logout.');
    } else {
      // onAuthStateChange já vai limpar user e session
      toast.success('Logout realizado');
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session, // Exponha a sessão se precisar dela em outros lugares
        isAuthenticated: !!user && !!session, // Autenticado se tiver usuário E sessão
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
