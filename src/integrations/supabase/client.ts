
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Usar valores das variáveis de ambiente Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qlhlctnewasecayjnitr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGxjdG5ld2FzZWNheWpuaXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNTQ3ODEsImV4cCI6MjA2MjkzMDc4MX0.Dr7WTegg96VpxMKLD3rC5cbhexAGGs3ITyR1T1pxcxA";

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Variáveis de ambiente Supabase não definidas!');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Função de utilidade para verificar conexão
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('products').select('count()', { count: 'exact' });
    if (error) throw error;
    console.log('Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao conectar com Supabase:', error);
    return false;
  }
}
