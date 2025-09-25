import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { PlanManager, PlanType } from '@/lib/planManager';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  settings: Record<string, unknown>;
  questions: Array<{
    id: string;
    type: string;
    title: string;
    options?: Array<{ id: string; text: string; value?: string | number | boolean }>;
    [key: string]: unknown;
  }>;
  is_published: boolean;
  public_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface CreateQuizRequest {
  title: string;
  description?: string;
  settings?: Record<string, unknown>;
  questions?: Array<{
    id: string;
    type: string;
    title: string;
    options?: Array<{ id: string; text: string; value?: string | number | boolean }>;
    [key: string]: unknown;
  }>;
}

interface QuizzesResponse {
  success: boolean;
  message: string;
  data?: Quiz[] | Quiz;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Middleware para autenticação
async function authenticate(req: NextApiRequest): Promise<{ user: Record<string, unknown>; profile: Record<string, unknown> } | null> {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuizzesResponse>
) {
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
    const userPlan: PlanType = profile?.plan || 'starter';

    if (req.method === 'GET') {
      // Listar quizzes do usuário
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
      const { title, description, settings, questions }: CreateQuizRequest = req.body;

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