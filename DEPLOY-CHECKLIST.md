# 🚀 Checklist de Deploy - SaaS Quizz Elevado

## ✅ Preparação Concluída

### 1. Migração SQLite → Supabase
- [x] **server.cjs** migrado para usar Supabase
- [x] Dependência `sqlite3` removida do package.json
- [x] Endpoints mapeados para tabelas Supabase:
  - `quiz_respostas` → `quiz_results`
  - `quiz_estatisticas` → calculado dinamicamente
  - Analytics integrado com `analytics_events`

### 2. Configurações de Build
- [x] **vite.config.ts** otimizado para produção
- [x] **vercel.json** criado com configurações serverless
- [x] **package.json** atualizado com scripts de build
- [x] **.env.example** criado com todas as variáveis necessárias

### 3. CORS e Domínios
- [x] CORS configurado no server.cjs para Vercel
- [x] Headers CORS no vercel.json
- [x] Suporte a domínios personalizados preparado

---

## 🔧 Configuração na Vercel

### Passo 1: Variáveis de Ambiente
Configure estas variáveis no painel da Vercel:

```bash
# Obrigatórias
NEXT_PUBLIC_SUPABASE_URL=https://rijvidluwvzvatoarqoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key-aqui
NODE_ENV=production

# Opcionais (mas recomendadas)
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
FIRECRAWL_API_KEY=seu-firecrawl-key
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_TEST_MODE=false
```

### Passo 2: Configurações de Build
```bash
# Build Command
npm run build

# Output Directory
dist

# Install Command
npm install

# Node.js Version
18.x
```

### Passo 3: Domínios
1. **Domínio Vercel**: `https://seu-projeto.vercel.app`
2. **Domínio Personalizado**: Configure no painel da Vercel
3. **Atualizar CORS**: Adicione novos domínios no `server.cjs`

---

## 🗄️ Configuração do Supabase

### Verificar Tabelas Necessárias
```sql
-- Principais tabelas que devem existir:
- quizzes
- quiz_results
- quiz_leads
- analytics_events
- analytics_sessions
- user_profiles
- quiz_webhooks
- webhook_logs
```

### RLS (Row Level Security)
- [x] Políticas configuradas para todas as tabelas
- [x] Autenticação integrada
- [x] Permissões de usuário definidas

### Auth Settings
No painel do Supabase (Authentication > Settings):
```
Site URL: https://seu-projeto.vercel.app
Redirect URLs: 
  - https://seu-projeto.vercel.app/**
  - http://localhost:3000/** (para desenvolvimento)
```

---

## 🚀 Processo de Deploy

### Método 1: GitHub Integration (Recomendado)
1. Conecte seu repositório ao GitHub
2. Conecte o GitHub à Vercel
3. Configure as variáveis de ambiente
4. Deploy automático a cada push

### Método 2: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Método 3: Deploy Manual
1. Build local: `npm run build`
2. Upload da pasta `dist` via painel Vercel

---

## ⚠️ Possíveis Erros e Soluções

### Erro: "Module not found: @supabase/supabase-js"
**Solução**: Verificar se a dependência está no package.json
```bash
npm install @supabase/supabase-js
```

### Erro: "Environment variables not defined"
**Solução**: Configurar variáveis no painel Vercel
- Ir em Settings > Environment Variables
- Adicionar todas as variáveis do .env.example

### Erro: "CORS policy blocked"
**Solução**: Atualizar domínios permitidos
1. No `server.cjs` (linha 21-27)
2. No `vercel.json` (headers CORS)
3. No Supabase Auth Settings

### Erro: "Database connection failed"
**Solução**: Verificar credenciais Supabase
- URL do projeto correto
- Anon key válido
- Projeto ativo no Supabase

### Erro: "Build failed - TypeScript errors"
**Solução**: Corrigir erros de tipo
```bash
# Verificar localmente
npm run build

# Ou ignorar temporariamente
# No tsconfig.json: "skipLibCheck": true
```

### Erro: "API routes not working"
**Solução**: Verificar estrutura de pastas
- APIs devem estar em `src/pages/api/`
- Ou usar o server.cjs como fallback

---

## 🧪 Testes Pré-Deploy

### Teste Local
```bash
# Build de produção
npm run build:prod

# Preview local
npm run preview

# Testar em http://localhost:3000
```

### Checklist de Funcionalidades
- [ ] Criação de quiz funciona
- [ ] Responder quiz funciona
- [ ] Resultados são salvos
- [ ] Analytics funcionam
- [ ] Autenticação funciona
- [ ] Integração Supabase OK
- [ ] APIs respondem corretamente

---

## 📊 Monitoramento Pós-Deploy

### Logs da Vercel
- Functions logs para APIs
- Build logs para erros de build
- Runtime logs para erros em produção

### Supabase Dashboard
- Monitorar queries
- Verificar uso de recursos
- Logs de autenticação

### Health Check
Endpoint: `https://seu-projeto.vercel.app/api/health`

---

## 🔄 Atualizações de Domínio

### Para Domínio Personalizado
1. **Comprar domínio** (ex: meuquiz.com)
2. **Configurar DNS**:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
3. **Adicionar na Vercel**: Settings > Domains
4. **Atualizar CORS** em 3 locais:
   - `server.cjs` (origins array)
   - `vercel.json` (headers)
   - Supabase Auth Settings

### Exemplo de Atualização CORS
```javascript
// server.cjs
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://seu-projeto.vercel.app',
    'https://meuquiz.com',  // ← Adicionar aqui
    /\.vercel\.app$/
  ],
  credentials: true
}));
```

---

## 📋 Resumo Final

### ✅ O que foi alterado:
1. **server.cjs**: Migrado de SQLite para Supabase
2. **package.json**: Removido sqlite3, adicionado scripts
3. **vite.config.ts**: Otimizado para produção
4. **vercel.json**: Configuração serverless
5. **apiClient.ts**: Flexibilidade dev/prod
6. **.env.example**: Template completo

### 🎯 Benefícios:
- ✅ 100% serverless (sem SQLite local)
- ✅ Escalabilidade automática
- ✅ Backup automático (Supabase)
- ✅ Analytics em tempo real
- ✅ Deploy contínuo
- ✅ HTTPS automático

### ⚡ Próximos Passos:
1. Fazer push do código
2. Configurar variáveis na Vercel
3. Fazer primeiro deploy
4. Testar todas as funcionalidades
5. Configurar domínio personalizado (opcional)

---

**🚀 Projeto pronto para produção na Vercel!**