# Deploy no Vercel - Quiz Lift Off

## Configurações Necessárias

### 1. Variáveis de Ambiente no Vercel

No painel do Vercel, configure as seguintes variáveis de ambiente:

```bash
# Frontend (Vite)
VITE_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Njc0MTAsImV4cCI6MjA3MTE0MzQxMH0.Wm2aXhLV6ZO8ZeSpWwzdskisV_VIQbQvaHmHk0CLVTg

# Next.js compatibility
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Njc0MTAsImV4cCI6MjA3MTE0MzQxMH0.Wm2aXhLV6ZO8ZeSpWwzdskisV_VIQbQvaHmHk0CLVTg

# Backend/API (PRIVADA - não expor)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NzQxMCwiZXhwIjoyMDcxMTQzNDEwfQ.Fc4_rKTUmQuFW5CBQJeGFXTnzr0Bwp1wqzFewthD1Lg

# Configurações de produção
NODE_ENV=production
VITE_USE_LOCAL_API=false
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_DEBUG_MODE=false

# CORS
ALLOWED_ORIGINS=https://quiz-lift-off-76.vercel.app

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Cache
CACHE_TTL=3600
```

### 2. Configuração do Build

O projeto está configurado para:
- **Frontend**: Build estático com Vite (pasta `dist`)
- **Backend**: Servidor Express como função serverless (`consolidated-server.cjs`)

### 3. Estrutura de APIs

As APIs estão disponíveis em:
- `/api/consolidated/quizzes` - Gerenciamento de quizzes
- `/api/consolidated/main` - APIs principais
- `/api/consolidated/health` - Health check

### 4. Comandos de Deploy

```bash
# Build de produção
npm run build:prod

# Deploy automático via Git
git push origin main
```

### 5. Verificação do Deploy

Após o deploy, verifique:
1. **Health Check**: `https://seu-dominio.vercel.app/api/consolidated/health`
2. **Frontend**: Carregamento da página principal
3. **Autenticação**: Login/logout funcionando
4. **Criação de Quiz**: Botão "Criar Quiz" funcionando

### 6. Configuração do Supabase para Produção

#### URLs de Redirecionamento
No painel do Supabase (Authentication > URL Configuration), configure:

**Site URL:**
```
https://quiz-lift-off-76.vercel.app
```

**Additional Redirect URLs:**
```
https://quiz-lift-off-76.vercel.app/app
https://quiz-lift-off-76.vercel.app/app/**
```

> ⚠️ **IMPORTANTE**: Sem essas URLs configuradas, o signup/login não funcionará em produção!

### 7. Troubleshooting

#### Erro 404 nas APIs
- Verifique se o `vercel.json` está correto
- Confirme que as variáveis de ambiente estão configuradas

#### Erro de CORS
- Adicione seu domínio em `ALLOWED_ORIGINS`
- Verifique se o domínio está correto no `consolidated-server.cjs`

#### Erro de Autenticação
- Confirme as chaves do Supabase
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- **Verifique as URLs de redirecionamento no Supabase**

#### Erro no Signup/Login em Produção
- Confirme que as URLs de redirecionamento estão configuradas no Supabase
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