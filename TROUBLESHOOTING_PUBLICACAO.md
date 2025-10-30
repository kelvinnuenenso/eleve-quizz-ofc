# 🔧 Troubleshooting - Problemas de Publicação e Carregamento

**Data:** 22/10/2025  
**Status:** EM INVESTIGAÇÃO

---

## 🎯 **SINTOMAS RELATADOS**

1. ❌ Quiz não publica
2. ❌ Quiz não carrega

---

## 🔍 **DIAGNÓSTICO RÁPIDO**

### **1. Abra o Console do Navegador (F12)**

Pressione `F12` e vá para a aba **Console**.

Procure por erros em vermelho. Os mais comuns são:

#### **A. Erro de UUID inválido**
```
invalid input syntax for type uuid: "step-xxxxx"
```
**Solução:** Já corrigido! Recarregue a página com `Ctrl+Shift+F5`

#### **B. Erro de tabela não encontrada**
```
Could not find the table 'public.quiz_steps'
```
**Solução:** Execute o script `supabase/FIX_QUIZ_STEPS_TABLE.sql` no Supabase

#### **C. Erro de autenticação**
```
JWT expired / Not authenticated
```
**Solução:** Faça logout e login novamente

#### **D. Erro de rede**
```
Failed to fetch / Network error
```
**Solução:** Verifique sua conexão com internet e o Supabase

---

## 🧪 **TESTES PASSO A PASSO**

### **Teste 1: Verificar se o usuário está logado**

1. Abra o console (F12)
2. Cole este código:
```javascript
console.log('User:', window.localStorage.getItem('supabase.auth.token'));
```
3. Deve mostrar um token

**Se não mostrar:** Faça login novamente

---

### **Teste 2: Verificar se a tabela quiz_steps existe**

1. Vá para: https://supabase.com/dashboard/project/rijvidluwvzvatoarqoe
2. Clique em **"SQL Editor"**
3. Execute:
```sql
SELECT COUNT(*) FROM quiz_steps;
```

**Se der erro:** A tabela não existe. Execute `FIX_QUIZ_STEPS_TABLE.sql`

---

### **Teste 3: Tentar salvar um quiz manualmente**

1. No console do navegador (F12), cole:
```javascript
// Substitua USER_ID pelo seu ID de usuário
const testQuiz = {
  id: crypto.randomUUID(),
  name: 'Quiz Teste',
  status: 'draft',
  questions: [],
  theme: {},
  settings: {}
};

// Importar a função (se disponível)
// await quizService.saveQuiz(testQuiz, 'USER_ID');
```

---

### **Teste 4: Verificar logs do salvamento**

Quando você clica em "Salvar", deve aparecer no console:

✅ **Logs esperados:**
```
💾 Iniciando salvamento do quiz: xxxxx
📊 Dados do quiz: {id: "xxx", name: "xxx", ...}
Saving steps to Supabase: 3
✅ Quiz salvo com sucesso!
```

❌ **Se aparecer:**
```
❌ Erro ao salvar quiz: [mensagem de erro]
```
**→ Copie a mensagem completa e me mostre!**

---

## 🔧 **SOLUÇÕES RÁPIDAS**

### **Solução 1: Limpar cache e recarregar**

```
1. Ctrl + Shift + Delete
2. Marcar "Cache" e "Cookies"
3. Clicar em "Limpar dados"
4. Fechar TODAS as abas
5. Abrir novamente
6. Fazer login
```

---

### **Solução 2: Verificar variáveis de ambiente**

Abra o arquivo `.env` e confirme:

```env
VITE_SUPABASE_URL="https://rijvidluwvzvatoarqoe.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGc..."
```

**Se estiverem vazias ou erradas:** Corrija e reinicie o servidor (`npm run dev`)

---

### **Solução 3: Recriar a tabela quiz_steps**

Execute este SQL no Supabase:

```sql
-- Verificar se existe
SELECT COUNT(*) FROM quiz_steps;

-- Se não existir, executar
-- (Conteúdo do arquivo FIX_QUIZ_STEPS_TABLE.sql)
```

---

### **Solução 4: Resetar estado do AuthProvider**

Se o app estiver em loop ou não carregar:

1. Abra o console (F12)
2. Cole:
```javascript
localStorage.clear();
location.reload();
```
3. Faça login novamente

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

Antes de reportar o problema, verifique:

- [ ] Estou logado?
- [ ] A tabela `quiz_steps` existe no Supabase?
- [ ] O console mostra algum erro em vermelho?
- [ ] Já tentei limpar o cache?
- [ ] Já tentei fazer logout/login?
- [ ] A internet está funcionando?
- [ ] O Supabase está online? (https://status.supabase.com)

---

## 🆘 **COMO REPORTAR O ERRO**

Se nenhuma solução acima funcionou, me forneça:

1. **Print ou cópia do erro no console** (F12)
2. **Qual ação você estava fazendo** (salvar, publicar, editar, etc.)
3. **O que aconteceu** vs **O que deveria acontecer**
4. **Resultados dos testes** acima (quais funcionaram, quais não)

---

## 📞 **INFORMAÇÕES DO SISTEMA**

- **Projeto Supabase:** rijvidluwvzvatoarqoe
- **Porta dev:** 8080
- **Comando start:** `npm run dev`
- **Browser recomendado:** Chrome/Edge (mais recente)

---

**Última atualização:** 22/10/2025
