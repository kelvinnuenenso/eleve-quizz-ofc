# Configuração de Autenticação Supabase

## URLs de Redirecionamento Necessárias

Para que o sistema de autenticação funcione corretamente tanto em desenvolvimento quanto em produção, é necessário configurar as seguintes URLs no painel do Supabase.

### Como Configurar no Supabase Dashboard

1. **Acesse o painel do Supabase**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione o projeto "ELEVEDO QUIZZ"

2. **Navegue para Authentication > URL Configuration**
   - No menu lateral, clique em "Authentication"
   - Clique em "URL Configuration"

### URLs para Desenvolvimento (Local)

**Site URL:**
```
http://localhost:8080
```

**Redirect URLs:**
```
http://localhost:8080/auth/callback
http://localhost:8080/dashboard
http://localhost:8080/app
```

### URLs para Produção (Vercel)

**Site URL:**
```
https://quiz-lift-off-76.vercel.app
```

**Redirect URLs:**
```
https://quiz-lift-off-76.vercel.app/auth/callback
https://quiz-lift-off-76.vercel.app/dashboard
https://quiz-lift-off-76.vercel.app/app
```

## Variáveis de Ambiente Necessárias

### Desenvolvimento (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # APENAS BACKEND

# Site URL for authentication redirects
NEXT_PUBLIC_SITE_URL=http://localhost:8080
```

### Produção (.env.production)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # APENAS BACKEND

# Site URL for authentication redirects
NEXT_PUBLIC_SITE_URL=https://quiz-lift-off-76.vercel.app
```

## Fluxo de Autenticação

### Login com Email/Senha
1. Usuário faz login em `/auth`
2. Após sucesso, redireciona para `/dashboard`
3. Sessão é persistida automaticamente

### Login com Google OAuth
1. Usuário clica em "Continuar com Google" em `/auth`
2. Redireciona para Google OAuth
3. Google redireciona para `/auth/callback`
4. Callback processa a sessão e redireciona para `/dashboard`

### Cadastro com Email
1. Usuário se cadastra em `/auth`
2. Email de confirmação é enviado
3. Usuário clica no link do email
4. Redireciona para `/dashboard` após confirmação

## Segurança

⚠️ **IMPORTANTE**: 
- `SUPABASE_SERVICE_ROLE_KEY` deve ser usada APENAS no backend
- Nunca exponha a service role key no frontend
- Use apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY` no frontend

## Configuração do Cliente Supabase

O cliente está configurado com:
- **Persistência de sessão**: `persistSession: true`
- **Auto refresh de token**: `autoRefreshToken: true`
- **Detecção de sessão na URL**: `detectSessionInUrl: true`
- **Fluxo PKCE**: `flowType: 'pkce'` (mais seguro)
- **Storage**: `localStorage` (apenas no browser)

## Troubleshooting

### Problema: Login funciona localmente mas não em produção
**Solução**: Verifique se as URLs de redirecionamento estão configuradas corretamente no Supabase Dashboard

### Problema: Sessão não persiste após refresh
**Solução**: Verifique se `persistSession: true` está configurado no cliente Supabase

### Problema: OAuth não funciona
**Solução**: 
1. Verifique se `/auth/callback` está implementado
2. Confirme se a URL de callback está registrada no Supabase
3. Verifique se `NEXT_PUBLIC_SITE_URL` está definida corretamente

### Problema: Redirecionamento incorreto após login
**Solução**: Verifique se as rotas `/dashboard` e `/app` estão funcionando e protegidas pelo `ProtectedRoute`