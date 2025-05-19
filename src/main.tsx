import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { checkSupabaseConnection } from './integrations/supabase/client';

// Verificar variáveis de ambiente críticas
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
 );

if (missingEnvVars.length > 0) {
  console.error(
    `Erro: Variáveis de ambiente necessárias não encontradas: ${missingEnvVars.join(', ')}\n` +
    'Verifique se o arquivo .env foi configurado corretamente.'
  );
}

// Verificar conexão com Supabase ao iniciar
checkSupabaseConnection()
  .then(isConnected => {
    if (!isConnected && import.meta.env.PROD) {
      console.error('Aviso: Não foi possível conectar ao Supabase. Algumas funcionalidades podem não funcionar corretamente.');
    }
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
