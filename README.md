# Quiz Lift Off 76

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Um sistema completo de quiz interativo com autenticação robusta, criação de quizzes personalizados e análise detalhada de resultados. Desenvolvido com as mais modernas tecnologias web para oferecer uma experiência fluida e responsiva.

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Usuários
- **Registro e Login** com validação completa
- **Autenticação OAuth** (Google, GitHub)
- **Recuperação de senha** via email
- **Perfis de usuário** personalizáveis
- **Sistema de planos** (Free, Pro, Enterprise)
- **Gerenciamento de sessões** seguro

### 📝 Criação de Quizzes
- **Editor visual** com drag-and-drop
- **Múltiplos tipos de questão** (múltipla escolha, verdadeiro/falso, texto)
- **Templates pré-definidos** para início rápido
- **Configurações avançadas** (tempo limite, pontuação personalizada)
- **Preview em tempo real** do quiz
- **Importação/Exportação** de quizzes

### 📊 Análise e Resultados
- **Dashboard analítico** com métricas detalhadas
- **Relatórios de desempenho** por usuário
- **Estatísticas em tempo real** de participação
- **Exportação de dados** em múltiplos formatos
- **Gráficos interativos** com Chart.js
- **Histórico completo** de tentativas

### 🎨 Interface e Experiência
- **Design responsivo** para todos os dispositivos
- **Tema claro/escuro** personalizável
- **Animações suaves** e transições
- **Componentes acessíveis** (WCAG 2.1)
- **PWA** com suporte offline
- **Otimização mobile** com gestos touch

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Biblioteca principal com Hooks e Concurrent Features
- **TypeScript 5** - Tipagem estática para maior robustez
- **Vite 5** - Build tool ultra-rápido com HMR
- **React Router 6** - Roteamento client-side

### UI/UX
- **shadcn/ui** - Componentes modernos e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Primitivos de UI headless
- **Lucide React** - Ícones SVG otimizados
- **Framer Motion** - Animações fluidas

### Backend & Database
- **Supabase** - Backend-as-a-Service completo
- **PostgreSQL** - Banco de dados relacional robusto
- **Supabase Auth** - Autenticação e autorização
- **Row Level Security** - Segurança a nível de linha
- **Real-time subscriptions** - Atualizações em tempo real

### DevOps & Deploy
- **Vercel** - Plataforma de deploy otimizada
- **GitHub Actions** - CI/CD automatizado
- **ESLint** - Linting de código
- **Prettier** - Formatação consistente
- **PostCSS** - Processamento de CSS

## 🚀 Demo e Screenshots

### 🌐 Demo Online
> **[Acesse a demonstração ao vivo](https://quiz-lift-off-76.vercel.app)**

### 📱 Principais Telas
- **Dashboard**: Visão geral dos quizzes e estatísticas
- **Editor de Quiz**: Interface drag-and-drop para criação
- **Player de Quiz**: Experiência otimizada para responder
- **Análise de Resultados**: Relatórios detalhados e gráficos
- **Configurações**: Personalização de perfil e preferências

## 📦 Instalação e Desenvolvimento

### 📋 Pré-requisitos
- **Node.js** 18.18+ ([Download](https://nodejs.org/))
- **npm** ou **yarn** (incluído com Node.js)
- **Conta Supabase** ([Criar conta gratuita](https://supabase.com/))
- **Git** para controle de versão

### ⚡ Início Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/kelvinnuenenso/quiz-lift-off-76.git
cd quiz-lift-off-76

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Configure seu projeto Supabase
# Edite o arquivo .env com suas credenciais:
# VITE_SUPABASE_URL=sua_url_do_supabase
# VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# 5. Execute as migrações do banco de dados
npm run db:migrate

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

### 🔧 Configuração Avançada

#### Supabase Setup
1. Crie um novo projeto no [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **Settings > API** e copie:
   - Project URL
   - Project API Key (anon/public)
3. Configure as URLs de redirecionamento em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:8080`
   - Redirect URLs: `http://localhost:8080/auth/callback`

#### Variáveis de Ambiente
```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Aplicação
VITE_APP_URL=http://localhost:8080
NODE_ENV=development

# OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=seu_google_client_id
VITE_GITHUB_CLIENT_ID=seu_github_client_id
```

## 📁 Estrutura do Projeto

```
quiz-lift-off-76/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e configurações
│   └── types/              # Definições de tipos TypeScript
├── public/                 # Arquivos estáticos
├── supabase/              # Configurações do Supabase
├── dist/                  # Build de produção
└── docs/                  # Documentação
```

## 🔧 Scripts Disponíveis

### 🚀 Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento (http://localhost:8080)
npm run dev:full     # Dev server + API server simultaneamente
npm run api          # Apenas o servidor da API (http://localhost:3001)
```

### 🏗️ Build e Deploy
```bash
npm run build        # Build de produção otimizado
npm run build:dev    # Build de desenvolvimento
npm run build:prod   # Build de produção com otimizações
npm run build:analyze # Build + análise de bundle
npm run preview      # Preview do build local
npm run start        # Inicia servidor de produção
```

### 🧹 Qualidade de Código
```bash
npm run lint         # Executa ESLint
npm run lint:fix     # Corrige problemas do ESLint automaticamente
npm run type-check   # Verifica tipos TypeScript
npm run test         # Executa testes unitários
npm run test:e2e     # Executa testes end-to-end
npm run clean        # Limpa cache e builds
```

### 🗄️ Database
```bash
npm run db:migrate   # Executa migrações do Supabase
npm run db:reset     # Reseta o banco de dados
npm run db:seed      # Popula com dados de exemplo
```

## 🚀 Deploy

### Deploy para Vercel

1. **Configure as variáveis de ambiente no Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://seu-dominio.vercel.app`

2. **Configure URLs de redirecionamento no Supabase:**
   - Site URL: `https://seu-dominio.vercel.app`
   - Additional Redirect URLs: `https://seu-dominio.vercel.app/app`

3. **Deploy automático:**
   ```bash
   git push origin main
   ```

Para mais detalhes, consulte [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) e [SUPABASE-PRODUCTION-CONFIG.md](./SUPABASE-PRODUCTION-CONFIG.md).

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Erro de Conexão com Supabase
```bash
# Verifique se as variáveis de ambiente estão corretas
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Teste a conexão
npm run test:connection
```

#### ❌ Erro de Build
```bash
# Limpe o cache e reinstale dependências
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### ❌ Problemas de Autenticação
1. Verifique as URLs de redirecionamento no Supabase
2. Confirme se o OAuth está configurado corretamente
3. Verifique se as políticas RLS estão ativas

#### ❌ Erro de Migração
```bash
# Reset e reaplique as migrações
npm run db:reset
npm run db:migrate
```

### 🆘 FAQ

**Q: Como alterar a porta do servidor de desenvolvimento?**
A: Edite o `vite.config.ts` ou use `npm run dev -- --port 3000`

**Q: Como habilitar o modo debug?**
A: Adicione `VITE_DEBUG=true` no seu `.env`

**Q: Como configurar um domínio customizado?**
A: Consulte o [guia de deploy](./DEPLOY-VERCEL.md) para configuração completa

## 📚 Documentação

### 📖 Guias Principais
- [🚀 Deploy para Vercel](./DEPLOY-VERCEL.md)
- [⚙️ Configuração do Supabase](./SUPABASE-PRODUCTION-CONFIG.md)
- [📡 API Documentation](./README-API.md)
- [✅ Checklist de Deploy](./DEPLOY-CHECKLIST.md)

### 📋 Documentação Técnica
- [🔐 Configuração de Autenticação](./SUPABASE_AUTH_CONFIG.md)
- [💾 Persistência de Usuário](./PERSISTENCIA-USUARIO.md)
- [🐛 Correções de Deploy](./VERCEL-DEPLOY-FIX.md)
- [⚡ Otimizações de Runtime](./VERCEL-RUNTIME-FIX.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
