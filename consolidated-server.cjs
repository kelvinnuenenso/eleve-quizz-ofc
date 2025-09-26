// Servidor Express para APIs consolidadas
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || process.env.CONSOLIDATED_PORT || 3002;

// Validação de ambiente
function validateEnvironment() {
  const required = {
    VITE_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  };
  
  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não configuradas:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }
  
  return required;
}

const env = validateEnvironment();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Configuração de CORS melhorada
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://quiz-lift-off-76.vercel.app',
  /\.vercel\.app$/,
  ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de tratamento de erro global
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Middleware para logs em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}
app.use(express.json());

// Função para carregar e executar APIs consolidadas
function loadConsolidatedAPI(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Simular ambiente Next.js
    const mockNextApi = {
      NextApiRequest: class {},
      NextApiResponse: class {}
    };
    
    // Criar contexto para executar o código
    const context = {
      require,
      module: { exports: {} },
      exports: {},
      console,
      process,
      Buffer,
      __dirname: path.dirname(filePath),
      __filename: filePath,
      supabase
    };
    
    // Executar o código da API
    const vm = require('vm');
    const script = new vm.Script(`
      const { NextApiRequest, NextApiResponse } = arguments[0];
      ${content}
      if (typeof handler === 'function') {
        module.exports = handler;
      } else if (typeof exports.default === 'function') {
        module.exports = exports.default;
      }
    `);
    
    script.runInNewContext(context, { filename: filePath });
    return context.module.exports;
  } catch (error) {
    console.error(`Erro ao carregar API ${filePath}:`, error);
    return null;
  }
}

// Carregar APIs consolidadas
const consolidatedAPIs = {
  main: require('./api-consolidated-main.cjs'),
  quizzes: require('./api-consolidated-quizzes.cjs'),
  // 'webhooks-auth': loadConsolidatedAPI(path.join(__dirname, 'src/pages/api/consolidated/webhooks-auth.ts'))
};

console.log('✅ APIs consolidadas carregadas:', Object.keys(consolidatedAPIs).filter(k => consolidatedAPIs[k]));

// Middleware para simular NextApiRequest e NextApiResponse
function createNextApiHandler(handler) {
  return async (req, res) => {
    // Simular NextApiRequest
    const nextReq = {
      ...req,
      query: { ...req.query, ...req.params },
      cookies: req.cookies || {},
      headers: req.headers
    };
    
    // Simular NextApiResponse
    const nextRes = {
      status: (code) => {
        res.status(code);
        return nextRes;
      },
      json: (data) => {
        res.json(data);
        return nextRes;
      },
      send: (data) => {
        res.send(data);
        return nextRes;
      },
      end: (data) => {
        res.end(data);
        return nextRes;
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
        return nextRes;
      }
    };
    
    try {
      await handler(nextReq, nextRes);
    } catch (error) {
      console.error('Erro na API consolidada:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  };
}

// Rotas para APIs consolidadas
Object.keys(consolidatedAPIs).forEach(apiName => {
  const handler = consolidatedAPIs[apiName];
  if (handler) {
    app.all(`/api/consolidated/${apiName}`, createNextApiHandler(handler));
    console.log(`✅ API consolidada carregada: /api/consolidated/${apiName}`);
  } else {
    console.log(`❌ Falha ao carregar API: /api/consolidated/${apiName}`);
  }
});

// Rota direta para compatibilidade com Next.js
if (consolidatedAPIs.quizzes) {
  app.all('/api/quizzes', createNextApiHandler(consolidatedAPIs.quizzes));
  console.log('✅ Rota de compatibilidade criada: /api/quizzes');
}

// Health check
app.get('/api/consolidated/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    apis: Object.keys(consolidatedAPIs).filter(name => consolidatedAPIs[name] !== null)
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: Object.keys(consolidatedAPIs)
      .filter(name => consolidatedAPIs[name] !== null)
      .map(name => `ALL /api/consolidated/${name}`)
      .concat(['GET /api/consolidated/health'])
  });
});

// Iniciar servidor (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de APIs consolidadas rodando na porta ${PORT}`);
    console.log(`📊 Endpoints disponíveis:`);
    Object.keys(consolidatedAPIs).forEach(name => {
      if (consolidatedAPIs[name]) {
        console.log(`   ALL /api/consolidated/${name}`);
      }
    });
    console.log(`   GET /api/consolidated/health`);
    console.log(`🔗 Conectado ao Supabase: ${supabaseUrl}`);
  });
}

// Iniciar servidor apenas se não estiver sendo importado (desenvolvimento local)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de APIs consolidadas rodando na porta ${PORT}`);
    console.log('📊 Endpoints disponíveis:');
    console.log('   ALL /api/consolidated/main');
    console.log('   ALL /api/consolidated/quizzes');
    console.log('   GET /api/health');
    console.log(`🔗 Conectado ao Supabase: ${env.VITE_SUPABASE_URL}`);
  });
}

// Exportar para Vercel
module.exports = app;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor de APIs consolidadas...');
  console.log('✅ Servidor encerrado com sucesso.');
  process.exit(0);
});

// Tratamento de erros
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});