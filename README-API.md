# 🚀 API do Quiz Lift Off

API RESTful para gerenciamento completo de quizzes, usuários e estatísticas, construída com Express.js e Supabase PostgreSQL.

## 📋 Visão Geral

### Arquitetura
- **Backend**: Express.js + TypeScript
- **Database**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth + JWT
- **Deploy**: Vercel Serverless Functions
- **Documentação**: OpenAPI 3.0

### Funcionalidades
- ✅ CRUD completo de quizzes
- ✅ Sistema de autenticação e autorização
- ✅ Gerenciamento de usuários e perfis
- ✅ Estatísticas e analytics
- ✅ Rate limiting e cache
- ✅ Validação de dados
- ✅ Logs estruturados

## 🚀 Executando Localmente

### Pré-requisitos
```bash
# Node.js 18+
node --version

# Dependências instaladas
npm install

# Variáveis de ambiente configuradas
cp .env.example .env
```

### Desenvolvimento
```bash
# Frontend + API (modo completo)
npm run dev:full

# Apenas frontend (porta 5173)
npm run dev

# Apenas API (porta 3001)
npm run api

# API com hot reload
npm run api:dev
```

### Produção
```bash
# Build otimizado
npm run build:prod

# Servidor de produção
npm run start

# Preview do build
npm run preview
```

## 🔗 Base URLs

| Ambiente | URL | Descrição |
|----------|-----|----------|
| **Local** | `http://localhost:3001` | Desenvolvimento local |
| **Staging** | `https://quiz-lift-off-76-git-develop.vercel.app` | Branch de desenvolvimento |
| **Produção** | `https://quiz-lift-off-76.vercel.app` | Aplicação principal |

## 📊 Endpoints da API

### 🔍 Health Check

**GET** `/api/consolidated/health`

Verifica o status da API e conectividade com o banco.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "uptime": 3600
}
```

### 👤 Autenticação

#### Registro de Usuário
**POST** `/api/consolidated/main/auth/register`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### Login
**POST** `/api/consolidated/main/auth/login`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### 📝 Gerenciamento de Quizzes

#### Listar Quizzes
**GET** `/api/consolidated/quizzes`

**Query Parameters:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)
- `search` (string): Busca por título
- `category` (string): Filtro por categoria
- `user_id` (uuid): Filtro por usuário

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
{
  "quizzes": [
    {
      "id": "uuid",
      "title": "Quiz de JavaScript",
      "description": "Teste seus conhecimentos",
      "category": "programming",
      "difficulty": "intermediate",
      "questions_count": 10,
      "created_at": "2024-01-20T10:00:00Z",
      "updated_at": "2024-01-20T10:00:00Z",
      "user": {
        "id": "uuid",
        "name": "Criador do Quiz"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Criar Quiz
**POST** `/api/consolidated/quizzes`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Quiz de JavaScript Avançado",
  "description": "Teste seus conhecimentos em JS",
  "category": "programming",
  "difficulty": "advanced",
  "is_public": true,
  "time_limit": 1800,
  "questions": [
    {
      "question": "O que é closure em JavaScript?",
      "type": "multiple_choice",
      "options": [
        "Uma função dentro de outra função",
        "Um tipo de variável",
        "Um método de array",
        "Uma propriedade de objeto"
      ],
      "correct_answer": 0,
      "explanation": "Closure é quando uma função tem acesso ao escopo da função pai"
    }
  ]
}
```

#### Obter Quiz por ID
**GET** `/api/consolidated/quizzes/{id}`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
{
  "id": "uuid",
  "title": "Quiz de JavaScript",
  "description": "Teste seus conhecimentos",
  "category": "programming",
  "difficulty": "intermediate",
  "is_public": true,
  "time_limit": 1800,
  "questions": [
    {
      "id": "uuid",
      "question": "O que é closure?",
      "type": "multiple_choice",
      "options": ["Opção 1", "Opção 2"],
      "correct_answer": 0,
      "explanation": "Explicação detalhada"
    }
  ],
  "created_at": "2024-01-20T10:00:00Z",
  "user": {
    "id": "uuid",
    "name": "Criador"
  }
}
```

#### Atualizar Quiz
**PUT** `/api/consolidated/quizzes/{id}`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Deletar Quiz
**DELETE** `/api/consolidated/quizzes/{id}`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

### 📊 Respostas e Resultados

#### Submeter Respostas
**POST** `/api/consolidated/quizzes/{id}/submit`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "selected_answer": 0,
      "time_spent": 45
    }
  ],
  "total_time": 300
}
```

**Resposta:**
```json
{
  "result": {
    "score": 85,
    "correct_answers": 17,
    "total_questions": 20,
    "time_spent": 300,
    "percentage": 85.0
  },
  "detailed_results": [
    {
      "question_id": "uuid",
      "correct": true,
      "selected_answer": 0,
      "correct_answer": 0,
      "explanation": "Explicação da resposta"
    }
  ]
}
```

### 👥 Gerenciamento de Usuários

#### Obter Perfil do Usuário
**GET** `/api/consolidated/main/users/profile`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "avatar_url": "https://exemplo.com/avatar.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "stats": {
    "quizzes_created": 5,
    "quizzes_completed": 23,
    "average_score": 78.5
  }
}
```

#### Atualizar Perfil
**PUT** `/api/consolidated/main/users/profile`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Novo Nome",
  "avatar_url": "https://exemplo.com/novo-avatar.jpg"
}
```

## 🔒 Autenticação e Autorização

### JWT Token
Todos os endpoints protegidos requerem um JWT token válido no header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Níveis de Acesso
- **Público**: Endpoints de health check
- **Autenticado**: CRUD de quizzes próprios, submissão de respostas
- **Admin**: Gerenciamento de todos os quizzes e usuários

## 📈 Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|---------|
| `/api/consolidated/health` | 100 req | 1 min |
| `/api/consolidated/main/auth/*` | 10 req | 15 min |
| `/api/consolidated/quizzes` | 60 req | 1 min |
| `/api/consolidated/quizzes/*/submit` | 5 req | 1 min |

## 🐛 Códigos de Erro

| Código | Descrição | Exemplo |
|--------|-----------|----------|
| `400` | Bad Request | Dados inválidos |
| `401` | Unauthorized | Token inválido |
| `403` | Forbidden | Sem permissão |
| `404` | Not Found | Recurso não encontrado |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Erro interno |

### Formato de Erro
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "field": "email",
      "issue": "Formato de email inválido"
    }
  }
}
```

## 🧪 Testando a API

### Usando cURL
```bash
# Health check
curl -X GET http://localhost:3001/api/consolidated/health

# Login
curl -X POST http://localhost:3001/api/consolidated/main/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Listar quizzes
curl -X GET http://localhost:3001/api/consolidated/quizzes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Usando Postman
1. Importe a collection: `postman/Quiz-API.postman_collection.json`
2. Configure as variáveis de ambiente
3. Execute os requests

### Scripts de Teste
```bash
# Testes unitários
npm run test:api

# Testes de integração
npm run test:integration

# Teste de carga
npm run test:load
```

## 📚 Recursos Adicionais

- **Swagger UI**: `/api/docs` (em desenvolvimento)
- **Postman Collection**: `./postman/`
- **Logs**: Vercel Dashboard ou logs locais
- **Monitoramento**: Supabase Dashboard

## 🤝 Contribuindo

1. Siga os padrões de código estabelecidos
2. Adicione testes para novos endpoints
3. Atualize a documentação
4. Teste localmente antes do PR

---

**Versão da API**: 1.0.0  
**Última atualização**: Janeiro 2024
  "respostas": {
    "pergunta1": "resposta1",
    "pergunta2": "resposta2"
  },
  "pontuacao": 85 // opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "id": 1,
  "message": "Resposta salva com sucesso"
}
```

### 3. Obter Estatísticas
**GET** `/api/quiz/resultados`

Retorna estatísticas gerais ou de um quiz específico.

**Parâmetros de Query:**
- `quiz_id` (opcional): ID do quiz específico

**Exemplos:**
```
GET /api/quiz/resultados
GET /api/quiz/resultados?quiz_id=quiz-123
```

**Resposta:**
```json
{
  "success": true,
  "resultados": [
    {
      "quiz_id": "quiz-123",
      "total_tentativas": 50,
      "pontuacao_media": 78.5,
      "pontuacao_maxima": 100,
      "pontuacao_minima": 45
    }
  ]
}
```

### 4. Buscar Respostas Detalhadas
**GET** `/api/quiz/respostas/:quiz_id`

Busca respostas detalhadas de um quiz específico.

**Parâmetros de Query:**
- `limit` (padrão: 10): Número máximo de resultados
- `offset` (padrão: 0): Número de resultados para pular

**Exemplo:**
```
GET /api/quiz/respostas/quiz-123?limit=5&offset=10
```

**Resposta:**
```json
{
  "success": true,
  "respostas": [
    {
      "id": 1,
      "quiz_id": "quiz-123",
      "usuario_id": "user-456",
      "respostas": {
        "pergunta1": "resposta1",
        "pergunta2": "resposta2"
      },
      "pontuacao": 85,
      "data_criacao": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 🗄️ Banco de Dados

A API utiliza SQLite como banco de dados padrão, criando automaticamente as seguintes tabelas:

### quiz_respostas
- `id`: Chave primária
- `quiz_id`: ID do quiz
- `usuario_id`: ID do usuário (opcional)
- `respostas`: JSON com as respostas
- `pontuacao`: Pontuação obtida
- `data_criacao`: Data de criação

### quiz_estatisticas
- `id`: Chave primária
- `quiz_id`: ID do quiz
- `total_tentativas`: Total de tentativas
- `pontuacao_media`: Pontuação média
- `data_atualizacao`: Data da última atualização

## 🔧 Cliente da API

Use o cliente TypeScript incluído no projeto:

```typescript
import { apiClient } from '@/lib/apiClient';

// Salvar respostas
await apiClient.salvarRespostas({
  quiz_id: 'quiz-123',
  respostas: { pergunta1: 'resposta1' },
  pontuacao: 85
});

// Obter estatísticas
const stats = await apiClient.obterResultados('quiz-123');

// Verificar saúde da API
const health = await apiClient.healthCheck();
```

## 🌐 Configuração para Produção

A API está configurada para funcionar tanto em desenvolvimento quanto em produção:

- **Desenvolvimento**: API roda na porta 3001
- **Produção**: Integrada com o servidor Vite preview

O arquivo `quiz.db` será criado automaticamente na raiz do projeto.