# Guia de Persistência de Dados do Usuário no Deploy

## Como Garantir que os Dados do Usuário Sejam Sempre Salvos

### 1. Configuração Atual de Persistência

O sistema já está configurado para persistir dados do usuário através de múltiplas camadas:

#### ✅ Supabase (Banco de Dados Principal)
- **Autenticação**: Gerenciada pelo Supabase Auth
- **Perfis**: Tabela `user_profiles` com dados do usuário
- **Quizzes**: Tabela `quizzes` vinculada ao `user_id`
- **Respostas**: Tabela `quiz_responses` com histórico completo

#### ✅ LocalStorage (Backup Offline)
- **Sessão**: Tokens de autenticação persistidos automaticamente
- **Perfil**: Cópia local para acesso offline
- **Dados temporários**: Quizzes em edição salvos localmente

### 2. Configurações Críticas para Persistência

#### A. Cliente Supabase (src/integrations/supabase/client.ts)
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,        // ✅ Mantém sessão ativa
    autoRefreshToken: true,      // ✅ Renova token automaticamente
    detectSessionInUrl: true     // ✅ Detecta sessão em URLs de redirect
  }
});
```

#### B. Hook de Autenticação (src/hooks/useAuth.tsx)
- **Sincronização automática**: Perfil sincronizado entre Supabase e localStorage
- **Fallback offline**: Se Supabase falhar, usa dados locais
- **Criação automática**: Perfil criado automaticamente no primeiro login

### 3. Variáveis de Ambiente Essenciais

#### No Vercel (Painel de Configuração):
```bash
# Frontend - Expostas publicamente
VITE_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js compatibility
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend - PRIVADA (não expor no frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configurações de produção
NODE_ENV=production
VITE_USE_LOCAL_API=false
```

### 4. Fluxo de Persistência de Dados

#### Quando o usuário faz login:
1. **Supabase Auth** autentica e cria sessão
2. **useAuth hook** detecta mudança de estado
3. **syncUserProfile()** busca/cria perfil no Supabase
4. **localStorage** recebe cópia para backup offline
5. **Sessão persistida** no navegador automaticamente

#### Quando o usuário cria um quiz:
1. **Dashboard** envia dados para `/api/consolidated/quizzes`
2. **consolidated-server.cjs** processa com autenticação
3. **Supabase** salva quiz vinculado ao `user_id`
4. **Resposta** confirma salvamento
5. **Frontend** atualiza interface

### 5. Verificações de Persistência

#### A. Teste de Sessão Persistente
```javascript
// No console do navegador
console.log('Sessão ativa:', await supabase.auth.getSession());
console.log('Usuário atual:', await supabase.auth.getUser());
```

#### B. Teste de Dados do Usuário
```javascript
// Verificar perfil no Supabase
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
console.log('Perfil no Supabase:', profile);
```

#### C. Teste de Quizzes Salvos
```javascript
// Verificar quizzes do usuário
const { data: quizzes } = await supabase
  .from('quizzes')
  .select('*')
  .eq('user_id', user.id);
console.log('Quizzes salvos:', quizzes);
```

### 6. Problemas Comuns e Soluções

#### ❌ Problema: "Usuário perde dados após refresh"
**Causa**: Variáveis de ambiente não configuradas no Vercel
**Solução**: 
1. Verificar todas as variáveis no painel Vercel
2. Fazer redeploy após adicionar variáveis
3. Testar com `https://seu-app.vercel.app/api/consolidated/health`

#### ❌ Problema: "Quizzes não aparecem após login"
**Causa**: API não consegue acessar Supabase
**Solução**:
1. Verificar `SUPABASE_SERVICE_ROLE_KEY` no Vercel
2. Confirmar CORS configurado para seu domínio
3. Verificar logs da função no painel Vercel

#### ❌ Problema: "Sessão expira muito rápido"
**Causa**: Configuração de refresh token
**Solução**: Já configurado com `autoRefreshToken: true`

### 7. Monitoramento de Persistência

#### A. Logs de Produção
- **Vercel Functions**: Painel > Functions > consolidated-server.cjs > Logs
- **Supabase**: Dashboard > Logs > API Logs
- **Browser**: DevTools > Application > Local Storage

#### B. Métricas Importantes
- Taxa de retenção de sessão
- Tempo de resposta das APIs
- Erros de sincronização

### 8. Backup e Recuperação

#### A. Backup Automático
- **Supabase**: Backup automático diário
- **localStorage**: Sincronização contínua
- **Export**: Função de exportar dados do usuário

#### B. Recuperação de Dados
```javascript
// Em caso de perda de dados locais
const { data: userData } = await supabase.auth.getUser();
if (userData.user) {
  await syncUserProfile(userData.user);
}
```

### 9. Checklist de Deploy para Persistência

- [ ] ✅ Variáveis de ambiente configuradas no Vercel
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` configurada (privada)
- [ ] ✅ CORS configurado para domínio de produção
- [ ] ✅ Health check respondendo: `/api/consolidated/health`
- [ ] ✅ Teste de login/logout funcionando
- [ ] ✅ Teste de criação de quiz funcionando
- [ ] ✅ Dados persistindo após refresh da página
- [ ] ✅ Sessão mantida entre visitas

### 10. Comandos de Verificação

```bash
# Testar health check
curl https://seu-app.vercel.app/api/consolidated/health

# Verificar build local
npm run build:prod

# Deploy manual (se necessário)
vercel --prod
```

## Conclusão

O sistema está **completamente configurado** para persistir dados do usuário. A arquitetura usa:

1. **Supabase** como fonte principal de dados
2. **localStorage** como backup offline
3. **Sessões persistentes** com refresh automático
4. **Sincronização automática** entre camadas

Se os dados não estão persistindo, o problema geralmente está nas **variáveis de ambiente do Vercel** ou na **configuração de CORS**. Siga o checklist acima para garantir que tudo esteja configurado corretamente.