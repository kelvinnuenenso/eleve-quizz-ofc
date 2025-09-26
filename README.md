# Quiz Lift Off 76

Um sistema completo de quiz interativo com autenticação, criação de quizzes personalizados e análise de resultados.

## 🚀 Funcionalidades

- **Autenticação completa** com Supabase (registro, login, recuperação de senha)
- **Criação de quizzes** com editor visual de fluxo
- **Sistema de pontuação** e análise de resultados
- **Interface moderna** com shadcn/ui e Tailwind CSS
- **API consolidada** para gerenciamento de dados
- **Deploy otimizado** para Vercel

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, Supabase
- **Banco de dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth
- **Deploy**: Vercel
- **Ferramentas**: ESLint, PostCSS, Terser

## 📦 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18.18+ 
- npm ou yarn
- Conta no Supabase

### Configuração Local

```bash
# 1. Clone o repositório
git clone https://github.com/kelvinnuenenso/quiz-lift-off-76.git
cd quiz-lift-off-76

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
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

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Gera build de produção
npm run preview      # Preview do build de produção
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
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

## 📚 Documentação

- [Deploy para Vercel](./DEPLOY-VERCEL.md)
- [Configuração do Supabase](./SUPABASE-PRODUCTION-CONFIG.md)
- [API Documentation](./README-API.md)
- [Checklist de Deploy](./DEPLOY-CHECKLIST.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
