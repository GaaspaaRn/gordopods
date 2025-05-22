import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Usar valores das variáveis de ambiente Vite
// Os valores fallback são os seus valores públicos, o que é OK para anon key e URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qlhlctnewasecayjnitr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGxjdG5ld2FzZWNheWpuaXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNTQ3ODEsImV4cCI6MjA2MjkzMDc4MX0.Dr7WTegg96VpxMKLD3rC5cbhexAGGs3ITyR1T1pxcxA";

// Log para verificar se as variáveis de ambiente estão sendo lidas corretamente no build/runtime
console.log('[SupabaseClient] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('[SupabaseClient] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '****** (presente)' : 'AUSENTE'); // Não logar a chave inteira

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('CRÍTICO: Variáveis de ambiente Supabase (SUPABASE_URL ou SUPABASE_ANON_KEY) não definidas! A aplicação pode não funcionar.');
  // Você pode querer lançar um erro aqui para parar a execução se elas forem absolutamente necessárias
  // throw new Error('Supabase URL and Anon Key must be defined in environment variables.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage, // Padrão, mas explícito é bom
    persistSession: true, // Padrão
    autoRefreshToken: true, // Padrão
  }
});

// Função de utilidade para verificar conexão (MODIFICADA)
export async function checkSupabaseConnection() {
  try {
    console.log('[checkSupabaseConnection] Verificando conexão com Supabase...');
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true }); // <--- SINTAXE CORRIGIDA AQUI

    if (error) {
      console.error('[checkSupabaseConnection] Erro ao verificar conexão (contar produtos):', error);
      // Dependendo de como você usa o retorno desta função em main.tsx,
      // você pode querer retornar false ou relançar o erro.
      // Se a conexão falhar aqui, é um indicativo de problema sério.
      return false; // Ou throw error;
    }

    console.log('[checkSupabaseConnection] Conexão com Supabase estabelecida com sucesso. Contagem de produtos (teste):', count);
    return true;
  } catch (error) { // Captura erros lançados pelo throw error ou outras exceções
    console.error('[checkSupabaseConnection] Falha crítica na verificação de conexão (bloco catch):', error);
    return false;
  }
}
