# 🚀 Deploy no Vercel - Quiz Lift Off

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com/)
- Projeto Supabase configurado
- Repositório GitHub conectado
- Domínio personalizado (opcional)

## ⚙️ Configuração das Variáveis de Ambiente

### 🔐 Variáveis Obrigatórias

No painel do Vercel (`Settings > Environment Variables`), configure:

```bash
# 🔑 Supabase - Frontend (Públicas)
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_supabase

# 🔒 Supabase - Backend (PRIVADA - NUNCA EXPOR)
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_supabase

# 🌐 Configurações de Produção
NODE_ENV=production
VITE_USE_LOCAL_API=false
VITE_APP_URL=https://seu-dominio.vercel.app

# 🛡️ Segurança e CORS
ALLOWED_ORIGINS=https://seu-dominio.vercel.app,https://seu-dominio-preview.vercel.app

# ⚡ Performance e Cache
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
CACHE_TTL=3600

# 📊 Analytics (Opcional)
VITE_ANALYTICS_ENABLED=true
VITE_DEBUG_MODE=false
```

### 🔍 Como Obter as Chaves do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para `Settings > API`
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API Key (anon/public)** → `VITE_SUPABASE_ANON_KEY`
   - **Project API Key (service_role)** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **IMPORTANTE**: Nunca commite a `service_role_key` no código!

## 🏗️ Configuração do Build

### Arquitetura do Deploy

- **Frontend**: SPA React + Vite → Build estático (`dist/`)
- **Backend**: Express.js → Serverless Functions (`api/`)
- **Database**: Supabase PostgreSQL
- **Storage**: Vercel Edge Network

### Estrutura de APIs

| Endpoint | Descrição | Método |
|----------|-----------|--------|
| `/api/consolidated/health` | Health check do sistema | GET |
| `/api/consolidated/quizzes` | CRUD de quizzes | GET, POST, PUT, DELETE |
| `/api/consolidated/main` | APIs principais (usuários, auth) | GET, POST |

## 🚀 Processo de Deploy

### 1. Deploy Automático (Recomendado)

```bash
# 1. Commit suas mudanças
git add .
git commit -m "feat: nova funcionalidade"

# 2. Push para main (deploy automático)
git push origin main
```

### 2. Deploy Manual

```bash
# Build local para teste
npm run build:prod

# Deploy via Vercel CLI
npx vercel --prod
```

## ✅ Verificação Pós-Deploy

### Checklist de Validação

- [ ] **Health Check**: `https://seu-dominio.vercel.app/api/consolidated/health`
- [ ] **Frontend**: Página inicial carrega sem erros
- [ ] **Autenticação**: Login/logout funcionando
- [ ] **Google OAuth**: Login social funcionando
- [ ] **Criação de Quiz**: Fluxo completo funcional
- [ ] **Responsividade**: Layout mobile/desktop
- [ ] **Performance**: Lighthouse Score > 90

## 🔧 Configuração do Supabase

### URLs de Autenticação

No [Supabase Dashboard](https://app.supabase.com/) → `Authentication` → `URL Configuration`:

```bash
# Site URL
https://seu-dominio.vercel.app

# Redirect URLs
https://seu-dominio.vercel.app/auth/callback
https://seu-dominio.vercel.app/app
https://seu-dominio.vercel.app/app/**

# Para previews do Vercel
https://*.vercel.app/auth/callback
```

### Configuração OAuth (Google)

1. Acesse `Authentication` → `Providers` → `Google`
2. Configure:
   - **Client ID**: Seu Google Client ID
   - **Client Secret**: Seu Google Client Secret
   - **Redirect URL**: `https://SEU_PROJETO.supabase.co/auth/v1/callback`

## 🐛 Troubleshooting

### ❌ Erro 404 nas APIs

**Causa**: Configuração incorreta do `vercel.json`

**Solução**:
```bash
# Verifique se existe o arquivo vercel.json na raiz
cat vercel.json

# Deve conter as rotas das APIs
```

### ❌ Erro de CORS

**Causa**: Domínio não autorizado

**Solução**:
```bash
# Adicione seu domínio em ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://seu-dominio.vercel.app,https://seu-dominio-preview.vercel.app
```

### ❌ Erro de Autenticação

**Causa**: Chaves do Supabase incorretas ou URLs não configuradas

**Solução**:
1. Verifique as variáveis de ambiente no Vercel
2. Confirme as URLs de redirecionamento no Supabase
3. Teste as chaves localmente primeiro

### ❌ Build Falha

**Causa**: Dependências ou TypeScript errors

**Solução**:
```bash
# Teste o build localmente
npm run build:prod

# Verifique erros de TypeScript
npm run type-check

# Limpe cache se necessário
npm run clean && npm install
```

## 📊 Monitoramento

### Logs e Analytics

- **Vercel Dashboard**: Logs de deploy e runtime
- **Supabase Dashboard**: Logs de database e auth
- **Browser DevTools**: Erros de frontend

### Performance

- **Vercel Analytics**: Métricas de performance
- **Lighthouse**: Auditoria de qualidade
- **Supabase Metrics**: Performance do database
- Verifique se o domínio da produção está na lista de URLs permitidas

### 8. Logs de Debug

Para debug em produção, os logs estão disponíveis no painel do Vercel em:
- **Functions** > **consolidated-server.cjs** > **View Function Logs**

## Diferenças entre Local e Produção

| Aspecto | Local | Produção |
|---------|-------|----------|
| Frontend | `localhost:8080` | Domínio Vercel |
| Backend | `localhost:3002` | Função Serverless |
| APIs | Proxy Vite | Roteamento Vercel |
| Variáveis | `.env` | Painel Vercel |
| Logs | Terminal | Painel Vercel |