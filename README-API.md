# API Interna do Quiz

Esta API foi criada para gerenciar respostas e estatísticas dos quizzes da aplicação.

## 🚀 Como executar

### Desenvolvimento
```bash
# Executar apenas o frontend
npm run dev

# Executar apenas a API
npm run api

# Executar frontend + API simultaneamente
npm run dev:full
```

### Produção
```bash
# Build da aplicação
npm run build

# Executar em produção
npm run start
```

## 📊 Endpoints Disponíveis

### 1. Health Check
**GET** `/api/health`

Verifica se a API está funcionando.

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "SQLite conectado"
}
```

### 2. Salvar Respostas
**POST** `/api/quiz/respostas`

Salva as respostas de um quiz no banco de dados.

**Body:**
```json
{
  "quiz_id": "quiz-123",
  "usuario_id": "user-456", // opcional
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