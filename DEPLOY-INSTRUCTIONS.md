# 🚀 Deploy no Vercel - Guia Completo

## ✅ Status Atual
- ✅ Repositório GitHub: https://github.com/kelvinnuenenso/quiz-lift-off-76.git
- ✅ .gitignore protegendo arquivos sensíveis
- ✅ vercel.json configurado corretamente
- ✅ Build local testado e funcionando (44.63s)
- ✅ Todas as dependências instaladas

## 🌐 MÉTODO RECOMENDADO: Deploy via Interface Web

### 1️⃣ Conectar Repositório
1. Acesse: https://vercel.com/new
2. Conecte sua conta GitHub
3. Selecione o repositório: `kelvinnuenenso/quiz-lift-off-76`
4. Clique em "Import"

### 2️⃣ Configurar Projeto
- **Project Name**: `quiz-lift-off-76`
- **Framework Preset**: Vite
- **Root Directory**: `./` (raiz)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3️⃣ Configurar Variáveis de Ambiente

Em **Environment Variables**, adicione:

#### 🔑 Variáveis Públicas (Production)
```
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Njc0MTAsImV4cCI6MjA3MTE0MzQxMH0.Wm2aXhLV6ZO8ZeSpWwzdskisV_VIQbQvaHmHk0CLVTg
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_SITE_URL=https://quiz-lift-off-76.vercel.app
```

#### 🔒 Variáveis Privadas (Marcar como "Secret")
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NzQxMCwiZXhwIjoyMDcxMTQzNDEwfQ.Fc4_rKTUmQuFW5CBQJeGFXTnzr0Bwp1wqzFewthD1Lg
```

#### 🔧 Variáveis de Sistema
```
NODE_ENV=production
VITE_USE_LOCAL_API=false
ALLOWED_ORIGINS=https://quiz-lift-off-76.vercel.app
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
CACHE_TTL=3600
```

#### 🔄 Variáveis Vite (Compatibilidade)
```
VITE_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Njc0MTAsImV4cCI6MjA3MTE0MzQxMH0.Wm2aXhLV6ZO8ZeSpWwzdskisV_VIQbQvaHmHk0CLVTg
```

### 4️⃣ Deploy
1. Clique em "Deploy"
2. Aguarde o build (aproximadamente 45-60 segundos)
3. Obtenha a URL pública: `https://quiz-lift-off-76.vercel.app`

## 🔧 Configuração Supabase

### Atualizar URLs de Redirect
No painel do Supabase (Authentication > URL Configuration):

```
Site URL: https://quiz-lift-off-76.vercel.app
Redirect URLs:
- https://quiz-lift-off-76.vercel.app
- https://quiz-lift-off-76.vercel.app/auth/callback
- https://quiz-lift-off-76.vercel.app/**
```

## 🧪 Testes Pós-Deploy

Após o deploy, teste estas funcionalidades:

### ✅ Checklist de Testes
- [ ] **Acesso à URL**: https://quiz-lift-off-76.vercel.app
- [ ] **Login real** com Supabase (criar conta/fazer login)
- [ ] **Modo DEMO** no login (botão "Continuar sem cadastro")
- [ ] **Dashboard** carregando sem erros
- [ ] **Criar novo quiz** funcionando
- [ ] **Salvar quiz** no Supabase
- [ ] **Publicar quiz** e obter link público
- [ ] **Analytics** capturando dados reais
- [ ] **Responsividade** em mobile

### 🔍 Debug de Problemas

#### Erro 404 em rotas
- Verificar se `vercel.json` está na raiz
- Confirmar configuração de SPA

#### Erro de CORS
- Verificar `ALLOWED_ORIGINS` no Vercel
- Atualizar URLs no Supabase

#### Erro de Autenticação
- Verificar `NEXT_PUBLIC_SITE_URL`
- Confirmar redirect URLs no Supabase
- Verificar se as chaves Supabase estão corretas

#### Build Errors
- Verificar se todas as env vars estão configuradas
- Confirmar que não há referências a arquivos locais
- Verificar logs de build no Vercel

## 📊 Monitoramento

Após o deploy:
1. **Vercel Analytics**: Monitore performance
2. **Supabase Logs**: Verifique queries e erros
3. **Browser Console**: Confirme ausência de erros JS

## 🚀 Deploy Automático

O Vercel fará deploy automático a cada push para `main`:
- Commits → Build automático → Deploy
- Preview deployments para PRs
- Rollback instantâneo se necessário

---

## 📋 Resumo das Configurações

| Configuração | Valor |
|--------------|-------|
| **Repositório** | https://github.com/kelvinnuenenso/quiz-lift-off-76.git |
| **Framework** | Vite + React + TypeScript |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **URL Esperada** | https://quiz-lift-off-76.vercel.app |
| **Supabase Project** | rijvidluwvzvatoarqoe |

**Status**: ✅ Pronto para deploy!

---

**Próximo passo**: Acesse https://vercel.com/new e siga o guia acima!