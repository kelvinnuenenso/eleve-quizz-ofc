# 🔧 CORREÇÃO: Erros ao Salvar e Publicar Quizzes

## 📋 PROBLEMA IDENTIFICADO

Você está enfrentando erros ao tentar salvar e publicar quizzes. As causas mais comuns são:

1. ❌ **Tabela `quiz_steps` não existe ou está desatualizada** no Supabase
2. ❌ **Coluna `components` ausente** na tabela quiz_steps
3. ❌ **Coluna `redirect_settings` ausente** na tabela quizzes
4. ❌ **Constraint de tipo desatualizado** (não inclui 'lead_registration')
5. ❌ **UUIDs inválidos** sendo gerados com prefixo "step-"
6. ❌ **Políticas RLS (Row Level Security) mal configuradas**

---

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Executar Script SQL no Supabase

1. **Abra o Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto: `rijvidluwvzvatoarqoe`

2. **Vá para o SQL Editor**
   - No menu lateral esquerdo, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Copie e cole o script completo**
   - Abra o arquivo: [`supabase/CORRECAO_COMPLETA_QUIZ_TABLES.sql`](supabase/CORRECAO_COMPLETA_QUIZ_TABLES.sql)
   - Copie **TODO** o conteúdo do arquivo
   - Cole no SQL Editor do Supabase

4. **Execute o script**
   - Clique em **"Run"** (ou pressione Ctrl+Enter / Cmd+Enter)
   - Aguarde a execução completa
   - Você verá mensagens de sucesso: ✅

5. **Verifique os resultados**
   - O script executará SELECTs automáticos mostrando:
     - ✅ Estrutura da tabela `quizzes`
     - ✅ Estrutura da tabela `quiz_steps`
     - ✅ Políticas RLS configuradas

**IMPORTANTE:** Execute o script COMPLETO de uma vez só. Não execute linha por linha!

---

### PASSO 2: Testar na Aplicação

Após executar o script SQL:

1. **Recarregue a aplicação**
   - Pressione `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
   - Isso limpa o cache do navegador

2. **Acesse o Dashboard**
   - Vá para: http://localhost:8081/app
   - Você deve ver seus quizzes listados

3. **Teste SALVAR um quiz**
   - Abra um quiz existente ou crie um novo
   - Faça alguma alteração (mude o nome, adicione uma pergunta, etc.)
   - Clique em **"Salvar"**
   - Você deve ver: **"✅ Quiz salvo!"**

4. **Teste PUBLICAR um quiz**
   - No editor de quiz, clique em **"Publicar"**
   - Você deve ver: **"🎉 Quiz publicado! Disponível em: ..."**
   - Copie o link e teste acessá-lo

---

## 🔍 VERIFICAÇÕES DE DIAGNÓSTICO

Se ainda houver erros, abra o Console do Navegador (F12) e verifique:

### Erro: "Tabela quiz_steps não encontrada"
```
❌ Tabela quiz_steps não encontrada no banco de dados
```
**Solução:** Você NÃO executou o script SQL corretamente. Volte ao PASSO 1.

### Erro: "Could not find the column 'components'"
```
ERROR: column "components" does not exist
```
**Solução:** A coluna `components` não foi adicionada. Execute o script SQL novamente.

### Erro: "Invalid input syntax for type uuid"
```
invalid input syntax for type uuid: "step-abc123..."
```
**Solução:** ✅ JÁ CORRIGIDO no código! Os UUIDs inválidos agora são detectados e corrigidos automaticamente.

### Erro: "new row violates check constraint"
```
new row violates check constraint "quiz_steps_type_check"
```
**Solução:** O tipo do step não é permitido. Execute o script SQL para atualizar o constraint.

---

## 📊 O QUE FOI CORRIGIDO NO CÓDIGO

### 1. Validação de UUID
**Arquivo:** `src/lib/quizService.ts` e `src/lib/quizOperations.ts`

Adicionada validação que detecta UUIDs inválidos:
```typescript
// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(cleanId)) {
  console.warn(`Invalid UUID detected for step: ${cleanId}, generating new one`);
  cleanId = crypto.randomUUID();
}
```

**Benefício:** Quizzes com IDs malformados agora são salvos corretamente!

### 2. Mensagens de Erro Melhores
Agora você vê exatamente qual é o problema:
- ❌ "Tabela quiz_steps não encontrada" → Execute o script SQL
- ❌ "Invalid UUID" → UUID será corrigido automaticamente
- ❌ "Failed to save steps" → Mostra detalhes do erro

### 3. Tratamento de Erros do Supabase
- Detecta automaticamente se tabelas estão faltando
- Trata problemas de schema cache
- Fornece instruções claras de recuperação

---

## 🎯 CHECKLIST FINAL

Antes de testar, certifique-se de que:

- [ ] ✅ Executei o script SQL **COMPLETO** no Supabase SQL Editor
- [ ] ✅ Vi as mensagens de sucesso no SQL Editor
- [ ] ✅ Recarreguei a aplicação com Ctrl+Shift+R
- [ ] ✅ Estou autenticado (fiz login)
- [ ] ✅ Consigo ver meus quizzes no dashboard

Se TODOS os itens acima estiverem marcados:

- [ ] ✅ Testei SALVAR um quiz → Sucesso!
- [ ] ✅ Testei PUBLICAR um quiz → Sucesso!
- [ ] ✅ Testei acessar o link público → Funciona!

---

## 🆘 AINDA TEM PROBLEMAS?

Se após seguir TODOS os passos acima ainda houver erros:

1. **Abra o Console do Navegador** (F12)
2. **Vá para a aba "Console"**
3. **Copie TODOS os erros em vermelho**
4. **Me envie** os erros completos

Também me envie:
- ✅ Print do resultado do script SQL no Supabase
- ✅ Mensagens de erro exatas que aparecem na aplicação
- ✅ Logs do console (F12)

---

## 📝 RESUMO DAS ALTERAÇÕES

### No Banco de Dados (Supabase)
- ✅ Tabela `quiz_steps` criada/atualizada com coluna `components`
- ✅ Coluna `redirect_settings` adicionada à tabela `quizzes`
- ✅ Constraint de tipo atualizado para incluir 'lead_registration'
- ✅ Índices criados para melhor performance
- ✅ Políticas RLS configuradas corretamente
- ✅ Triggers para `updated_at` criados

### No Código da Aplicação
- ✅ Validação de UUID adicionada
- ✅ Tratamento de erros melhorado
- ✅ Mensagens de erro mais claras
- ✅ Detecção automática de problemas de schema

---

## 🚀 RESULTADO ESPERADO

Após aplicar as correções, você deve conseguir:

1. ✅ **Salvar quizzes** sem erros
2. ✅ **Publicar quizzes** e receber link público
3. ✅ **Acessar quizzes publicados** via link
4. ✅ **Editar steps** com components
5. ✅ **Salvar configurações de redirecionamento**

---

**Última atualização:** 2025-10-24  
**Status:** ✅ Correções aplicadas e prontas para teste
