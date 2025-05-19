# Instruções de Deploy para Hostinger

## Pré-requisitos
- Conta na Hostinger com plano que suporte Node.js
- Projeto Supabase configurado com tabelas e políticas RLS

## Passos para Deploy

### 1. Preparar o Projeto
1. Crie o arquivo `.env` na raiz do projeto com as variáveis necessárias
2. Execute `npm run build:production` para gerar os arquivos otimizados
3. O resultado estará na pasta `dist/`

### 2. Configurar Hostinger
1. Acesse o painel da Hostinger
2. Vá para "Websites" > gordopods.com > "Gerenciar"
3. Acesse "Avançado" > "Node.js"
4. Ative o suporte a Node.js
5. Configure o diretório raiz para a pasta `dist/`
6. Configure o arquivo de entrada como `server.js` (se aplicável)

### 3. Fazer Upload dos Arquivos
1. Use o Gerenciador de Arquivos da Hostinger ou FTP
2. Faça upload de todo o conteúdo da pasta `dist/`
3. Faça upload do arquivo `.env` na raiz

### 4. Configurar Domínio
1. No painel da Hostinger, vá para "Domínios"
2. Configure seu domínio gordopods.com para apontar para o diretório do site

### 5. Configurar CORS no Supabase
1. Acesse o painel do Supabase > Project Settings > API
2. Adicione seu domínio (https://gordopods.com ) às configurações de CORS
