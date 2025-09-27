// Vercel Serverless Function for Consolidated APIs
const { createClient } = require('@supabase/supabase-js');

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Authentication middleware
async function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { user, profile };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Health check handler
function handleHealth(req, res) {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supabase: {
      url: supabaseUrl ? 'configured' : 'missing',
      key: supabaseAnonKey ? 'configured' : 'missing',
      serviceKey: supabaseServiceKey ? 'configured' : 'missing'
    }
  });
}

// User creation handler
async function handleUserCreation(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email e senha são obrigatórios'
    });
  }

  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({
        success: false,
        error: `Erro na criação do usuário: ${authError.message}`
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Falha na criação do usuário'
      });
    }

    // O perfil será criado automaticamente pelo trigger handle_new_user
    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database error save new user'
    });
  }
}

// Quiz handlers
async function handleQuizzes(req, res) {
  const auth = await authenticate(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso inválido ou expirado'
    });
  }

  const { user, profile } = auth;
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        // Listar quizzes do usuário
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quiz_quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('atualizado_em', { ascending: false });

        if (quizzesError) {
          console.error('Error fetching quizzes:', quizzesError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar quizzes'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Quizzes encontrados com sucesso',
          data: quizzes || []
        });
      
      case 'POST':
        // Criar novo quiz
        const { title, description, settings, questions } = req.body;

        if (!title || title.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Título do quiz é obrigatório'
          });
        }

        // Criar quiz com campos corretos
        const newQuizData = {
          titulo: title.trim(),
          descricao: description?.trim() || null,
          tema: settings?.theme || 'default',
          status: 'draft',
          user_id: user.id,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };

        const { data: createdQuiz, error: createError } = await supabase
          .from('quiz_quizzes')
          .insert(newQuizData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating quiz:', createError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao criar quiz'
          });
        }

        // Criar perguntas se fornecidas
        if (questions && questions.length > 0) {
          const questionsToInsert = questions.map((q, index) => ({
            quiz_id: createdQuiz.id,
            enunciado: q.question_text || q.enunciado,
            tipo: q.question_type || q.tipo || 'multiple_choice',
            ordem: index + 1,
            created_at: new Date().toISOString()
          }));

          const { data: createdQuestions, error: questionsError } = await supabase
            .from('quiz_questions')
            .insert(questionsToInsert)
            .select();

          if (questionsError) {
            console.error('Error creating questions:', questionsError);
          }

          // Criar opções para cada pergunta
          if (createdQuestions) {
            for (let i = 0; i < createdQuestions.length; i++) {
              const question = createdQuestions[i];
              const originalQuestion = questions[i];
              
              if (originalQuestion.options && originalQuestion.options.length > 0) {
                const optionsToInsert = originalQuestion.options.map((opt, optIndex) => ({
                  question_id: question.id,
                  texto: opt.option_text || opt.texto,
                  is_correct: opt.is_correct || false,
                  ordem: optIndex + 1,
                  created_at: new Date().toISOString()
                }));

                await supabase
                  .from('quiz_options')
                  .insert(optionsToInsert);
              }
            }
          }
        }

        return res.status(201).json({
          success: true,
          message: 'Quiz criado com sucesso',
          data: createdQuiz
        });
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Quiz API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Main handler function
module.exports = async function handler(req, res) {
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
    
    if (url.includes('/api/users') || url.includes('/user')) {
      return handleUserCreation(req, res);
    }
    
    if (url.includes('/api/quiz') || url.includes('/quizzes')) {
      return handleQuizzes(req, res);
    }
    
    if (url.includes('/api/consolidated')) {
      return res.status(200).json({
        message: 'Consolidated API endpoint',
        url,
        method: req.method,
        timestamp: new Date().toISOString(),
        supabaseConnected: !!supabase
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