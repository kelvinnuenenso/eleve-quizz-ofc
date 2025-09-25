// API consolidada para quizzes - versão JavaScript
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulação do PlanManager
class PlanManager {
  static getPlan(planType) {
    const plans = {
      starter: { name: 'Starter', limits: { maxQuizzes: 3, maxQuestionsPerQuiz: 10 } },
      pro: { name: 'Pro', limits: { maxQuizzes: 50, maxQuestionsPerQuiz: 50 } },
      enterprise: { name: 'Enterprise', limits: { maxQuizzes: -1, maxQuestionsPerQuiz: -1 } }
    };
    return plans[planType] || plans.starter;
  }

  static canCreateQuiz(planType, currentCount) {
    const plan = this.getPlan(planType);
    return plan.limits.maxQuizzes === -1 || currentCount < plan.limits.maxQuizzes;
  }

  static canAddQuestion(planType, questionCount) {
    const plan = this.getPlan(planType);
    return plan.limits.maxQuestionsPerQuiz === -1 || questionCount < plan.limits.maxQuestionsPerQuiz;
  }
}

// Middleware para autenticação
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
    return null;
  }
}

// Handler principal
async function handler(req, res) {
  try {
    // Autenticar usuário
    const auth = await authenticate(req);
    if (!auth) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso inválido ou expirado',
        error: 'UNAUTHORIZED'
      });
    }

    const { user, profile } = auth;
    const userPlan = profile?.plan || 'starter';

    if (req.method === 'GET') {
      // Listar quizzes do usuário
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { data: quizzes, error: quizzesError, count } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (quizzesError) {
        console.error('Error fetching quizzes:', quizzesError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar quizzes',
          error: 'DATABASE_ERROR'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quizzes encontrados com sucesso',
        data: quizzes || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });

    } else if (req.method === 'POST') {
      // Criar novo quiz
      const { title, description, settings, questions } = req.body;

      // Validação básica
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Título do quiz é obrigatório',
          error: 'MISSING_TITLE'
        });
      }

      // Verificar limites do plano
      const { data: existingQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', user.id);

      const currentQuizCount = existingQuizzes?.length || 0;
      
      if (!PlanManager.canCreateQuiz(userPlan, currentQuizCount)) {
        const plan = PlanManager.getPlan(userPlan);
        return res.status(403).json({
          success: false,
          message: `Limite de ${plan.limits.maxQuizzes} quizzes atingido para o plano ${plan.name}`,
          error: 'PLAN_LIMIT_EXCEEDED'
        });
      }

      // Validar número de perguntas se fornecidas
      if (questions && questions.length > 0) {
        if (!PlanManager.canAddQuestion(userPlan, questions.length - 1)) {
          const plan = PlanManager.getPlan(userPlan);
          return res.status(403).json({
            success: false,
            message: `Limite de ${plan.limits.maxQuestionsPerQuiz} perguntas por quiz atingido para o plano ${plan.name}`,
            error: 'QUESTION_LIMIT_EXCEEDED'
          });
        }
      }

      // Criar quiz
      const newQuiz = {
        title: title.trim(),
        description: description?.trim() || null,
        settings: settings || {
          theme: 'default',
          showProgressBar: true,
          allowRetake: false,
          showResults: true,
          collectEmail: false,
          requireName: false,
        },
        questions: questions || [],
        is_published: false,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert(newQuiz)
        .select()
        .single();

      if (createError) {
        console.error('Error creating quiz:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar quiz',
          error: 'DATABASE_ERROR'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Quiz criado com sucesso',
        data: createdQuiz
      });

    } else {
      return res.status(405).json({
        success: false,
        message: 'Método não permitido',
        error: 'METHOD_NOT_ALLOWED'
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

module.exports = handler;