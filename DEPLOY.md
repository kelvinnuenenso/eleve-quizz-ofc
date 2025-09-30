# 🚀 Guia de Deploy - Quiz Lift Off 76

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Repositório no GitHub

## 🔧 Configuração do Supabase

### 1. Configurar Variáveis de Ambiente

No painel do Supabase, vá em **Settings > API** e copie:

- **Project URL**: `https://rijvidluwvzvatoarqoe.supabase.co`
- **Anon Key**: Chave pública para autenticação
- **Service Role Key**: Chave privada (apenas para backend)

### 2. Configurar Domínios Permitidos

Em **Authentication > URL Configuration**, adicione:

- Site URL: `https://quiz-lift-off-76.vercel.app`
- Redirect URLs: `https://quiz-lift-off-76.vercel.app/auth/callback`

## 🌐 Deploy na Vercel

### 1. Conectar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"New Project"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `quiz-lift-off-76`

### 2. Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

```bash
# Frontend (Public)
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
NEXT_PUBLIC_SITE_URL=https://quiz-lift-off-76.vercel.app
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_DEBUG_MODE=false

# Vite (Compatibility)
VITE_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_USE_LOCAL_API=false

# Backend (Private)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Production Settings
NODE_ENV=production
ALLOWED_ORIGINS=https://quiz-lift-off-76.vercel.app
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
CACHE_TTL=3600
```

### 3. Configurações de Build

O projeto já está configurado com:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (≈ 2-3 minutos)
3. Acesse sua aplicação no domínio fornecido

## 🔒 Configurações de Segurança

O projeto inclui:

- **Headers de Segurança**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Cache Otimizado**: Assets com cache de 1 ano, HTML sem cache
- **CORS Configurado**: Apenas domínios permitidos
- **Rate Limiting**: Proteção contra abuso de API

## 📊 Monitoramento

### Vercel Analytics

1. Vá em **Analytics** no dashboard da Vercel
2. Ative o **Web Analytics**
3. Configure **Speed Insights** para monitoramento de performance

### Supabase Monitoring

1. Monitore uso em **Settings > Usage**
2. Configure alertas em **Settings > Billing**
3. Verifique logs em **Logs > API**

## 🚨 Troubleshooting

### Build Falha

```bash
# Verificar dependências
npm ci
npm run build

# Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL
```

### Erro de Autenticação

1. Verificar se as URLs estão corretas no Supabase
2. Confirmar se as chaves de API estão válidas
3. Verificar se o domínio está na lista de permitidos

### Performance Issues

1. Verificar **Web Vitals** no Vercel
2. Analisar bundle size com `npm run build:analyze`
3. Otimizar imagens e assets

## 📝 Comandos Úteis

```bash
# Build local
npm run build

# Preview local
npm run preview

# Análise de bundle
npm run build:analyze

# Lint e fix
npm run lint:fix

# Desenvolvimento
npm run dev
```

## 🔄 Atualizações

Para atualizar a aplicação:

1. Faça push das alterações para o GitHub
2. A Vercel fará deploy automático
3. Verifique o status no dashboard

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Issues**: https://github.com/kelvinnuenenso/quiz-lift-off-76/issues

---

✅ **Deploy configurado com sucesso!**

Sua aplicação está otimizada para produção com:
- ⚡ Performance máxima
- 🔒 Segurança robusta
- 📊 Analytics integrado
- 🚀 Deploy automático