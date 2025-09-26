# Configuração do Supabase para Produção

## URLs de Redirecionamento

Para que o sistema de autenticação funcione corretamente em produção, é necessário configurar as URLs de redirecionamento no painel do Supabase.

### Passo a Passo

1. **Acesse o painel do Supabase**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione o projeto "ELEVEDO QUIZZ"

2. **Navegue para Authentication > URL Configuration**
   - No menu lateral, clique em "Authentication"
   - Clique em "URL Configuration"

3. **Configure o Site URL**
   ```
   https://quiz-lift-off-76.vercel.app
   ```
   
4. **Adicione as URLs de Redirecionamento**
   Na seção "Additional Redirect URLs", adicione:
   ```
   https://quiz-lift-off-76.vercel.app/app
   https://quiz-lift-off-76.vercel.app/app/**
   ```

5. **Salve as configurações**
   - Clique em "Save" para aplicar as mudanças

## Configurações Atuais

### Desenvolvimento (Local)
- Site URL: `http://localhost:8080`
- Redirect URLs: 
  - `http://localhost:8080/app`
  - `http://localhost:8080/app/**`

### Produção (Vercel)
- Site URL: `https://quiz-lift-off-76.vercel.app`
- Redirect URLs:
  - `https://quiz-lift-off-76.vercel.app/app`
  - `https://quiz-lift-off-76.vercel.app/app/**`

## Por que isso é necessário?

O Supabase Auth usa essas URLs para:
1. **Validar redirecionamentos**: Após confirmação de email, o usuário é redirecionado para `/app`
2. **Segurança**: Previne ataques de redirecionamento malicioso
3. **Funcionamento correto**: Sem essas URLs, o signup/login falhará silenciosamente

## Verificação

Após configurar, teste:
1. Criar uma nova conta em produção
2. Verificar se o email de confirmação é recebido
3. Clicar no link de confirmação
4. Verificar se o redirecionamento para `/app` funciona

## Troubleshooting

### Erro: "Invalid redirect URL"
- Verifique se a URL está exatamente como configurada no Supabase
- Certifique-se de que não há espaços ou caracteres extras

### Email de confirmação não funciona
- Verifique se o Site URL está correto
- Confirme que as Additional Redirect URLs incluem `/app`

### Redirecionamento após login falha
- Verifique se `https://quiz-lift-off-76.vercel.app/app/**` está nas URLs permitidas
- Confirme que o código está usando `${window.location.origin}/app` como `emailRedirectTo`

## Configuração Atual do Código

O código em `src/hooks/useAuth.tsx` está configurado para usar:
```typescript
emailRedirectTo: `${window.location.origin}/app`
```

Em produção, isso resolve para:
```
https://quiz-lift-off-76.vercel.app/app
```

Em desenvolvimento:
```
http://localhost:8080/app
```

## Próximos Passos

1. ✅ Configurar URLs no Supabase (seguir este guia)
2. ⏳ Fazer deploy no Vercel
3. ⏳ Testar signup/login em produção
4. ⏳ Verificar se email de confirmação funciona