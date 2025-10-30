# 🔧 SOLUÇÃO: Erro "Could not find the table 'public.quiz_steps'"

## 🎯 Problema Identificado

A tabela `quiz_steps` **não existe no seu banco de dados Supabase**. As migrações locais não foram aplicadas no banco remoto.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### **Passo 1: Acessar o Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `rijvidluwvzvatoarqoe`

---

### **Passo 2: Abrir o SQL Editor**

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** (ou **"+ New Query"**)

---

### **Passo 3: Executar o Script de Correção**

1. Abra o arquivo: `supabase/FIX_QUIZ_STEPS_TABLE.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **"RUN"** (ou pressione `Ctrl+Enter`)

---

### **Passo 4: Verificar se deu certo**

Execute este comando no SQL Editor:

```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'quiz_steps' 
ORDER BY ordinal_position;
```

**Resultado esperado:** Você deve ver estas colunas:
- ✅ `id` (uuid)
- ✅ `quiz_id` (uuid)
- ✅ `type` (text)
- ✅ `name` (text)
- ✅ `title` (text)
- ✅ `data` (jsonb)
- ✅ `components` (jsonb)
- ✅ `order` (integer)
- ✅ `created_at` (timestamp with time zone)
- ✅ `updated_at` (timestamp with time zone)

---

### **Passo 5: Testar no seu app**

1. Volte para o seu aplicativo
2. Recarregue a página (`Ctrl+F5`)
3. Abra um quiz
4. Faça uma alteração
5. Clique em **"Salvar"**
6. ✅ **Deve funcionar agora!**

---

## 🔍 O que o script faz?

O arquivo `FIX_QUIZ_STEPS_TABLE.sql` executa:

1. ✅ Cria a tabela `quiz_steps` se não existir
2. ✅ Adiciona a coluna `components` se estiver faltando
3. ✅ Atualiza o constraint de tipo para incluir `lead_registration`
4. ✅ Cria índices para melhor performance
5. ✅ Configura Row Level Security (RLS) com políticas corretas
6. ✅ Cria triggers para atualização automática de `updated_at`
7. ✅ Adiciona coluna `redirect_settings` na tabela `quizzes` se não existir

---

## 🚨 Se o erro persistir

### **Opção A: Verificar permissões**

Execute no SQL Editor:

```sql
-- Verificar se você tem permissões
SELECT * FROM pg_tables WHERE tablename = 'quiz_steps';
```

Se retornar vazio, você não tem permissões. Entre em contato com o admin do projeto.

---

### **Opção B: Recriar completamente**

Se a tabela existe mas está com problemas:

```sql
-- ⚠️ ATENÇÃO: Isso vai deletar todos os steps existentes!
DROP TABLE IF EXISTS public.quiz_steps CASCADE;
```

Depois execute o script `FIX_QUIZ_STEPS_TABLE.sql` novamente.

---

### **Opção C: Usar Supabase CLI (Avançado)**

Se você tem o Supabase CLI instalado:

```bash
# No terminal, na pasta do projeto
cd c:\Users\kel02\eleve-quizz-ofc-4

# Aplicar todas as migrações
npx supabase db push

# Ou aplicar uma migração específica
npx supabase migration up
```

---

## 📊 Melhorias Implementadas no Código

Além do script SQL, também melhorei o código para **detectar automaticamente** quando a tabela não existe:

### **Antes:**
```
❌ Erro genérico: "Failed to delete existing steps: Could not find the table..."
```

### **Agora:**
```
✅ Mensagem clara: 
"❌ Tabela quiz_steps não encontrada no banco de dados. 
Execute o script FIX_QUIZ_STEPS_TABLE.sql no SQL Editor do Supabase primeiro!"
```

---

## 🎯 Próximos Passos

Após executar o script:

1. ✅ Teste salvar um quiz
2. ✅ Teste sincronizar perguntas
3. ✅ Teste modificar cores/tema
4. ✅ Teste publicar um quiz
5. ✅ Verifique se os steps são preservados ao recarregar

---

## 📝 Notas Importantes

### **Por que isso aconteceu?**

As migrações SQL no seu projeto (`supabase/migrations/`) **não são aplicadas automaticamente** no banco de dados remoto. Você precisa:

- **Manualmente:** Copiar e executar o SQL no dashboard do Supabase
- **Com CLI:** Usar `supabase db push` para sincronizar
- **CI/CD:** Configurar deploy automático das migrações

### **Como evitar no futuro?**

1. **Use Supabase CLI** para gerenciar migrações
2. **Configure git hooks** para lembrar de aplicar migrações
3. **Documente** sempre que criar uma nova migração

---

## 🆘 Precisa de Ajuda?

Se ainda tiver problemas:

1. 📸 Tire um print do erro no console (F12)
2. 📋 Copie o resultado da query de verificação
3. 🔍 Verifique se você está usando o projeto Supabase correto
4. 🔑 Confirme que o arquivo `.env` tem as credenciais corretas

---

**Última atualização:** 22/10/2025  
**Arquivo de correção:** `supabase/FIX_QUIZ_STEPS_TABLE.sql`  
**Status:** ✅ PRONTO PARA EXECUTAR
