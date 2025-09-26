// Vercel Serverless Function para APIs consolidadas
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

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
    throw new Error('Missing environment variables');
  }
  
  return required;
}

let supabase;
try {
  const env = validateEnvironment();
  supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true'
};

// Health check handler
function handleHealth(req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: process.env.npm_package_version || '1.0.0'
  });
}

// Quiz handlers
function handleQuizzes(req, res) {
  const { method } = req;
  
  switch (method) {
    case 'GET':
      return res.status(200).json({
        message: 'Quizzes API endpoint',
        method: 'GET',
        timestamp: new Date().toISOString()
      });
    
    case 'POST':
      return res.status(200).json({
        message: 'Quiz created',
        method: 'POST',
        body: req.body,
        timestamp: new Date().toISOString()
      });
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Main handler function
export default function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  
  try {
    // Route handling
    if (url === '/api/health' || url.includes('/health')) {
      return handleHealth(req, res);
    }
    
    if (url.includes('/api/quiz') || url.includes('/quizzes')) {
      return handleQuizzes(req, res);
    }
    
    if (url.includes('/api/consolidated')) {
      return res.status(200).json({
        message: 'Consolidated API endpoint',
        url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    
    // Default API response
    return res.status(200).json({
      message: 'API is working',
      url,
      method: req.method,
      timestamp: new Date().toISOString(),
      supabaseConnected: !!supabase
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}