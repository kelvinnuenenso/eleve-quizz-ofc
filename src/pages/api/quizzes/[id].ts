import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { PlanManager, PlanType } from '@/lib/planManager';
import { v4 as uuidv4 } from 'uuid';

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

interface UpdateQuizRequest {
  title?: string;
  description?: string;
  settings?: Record<string, unknown>;
  questions?: Array<{
    id: string;
    type: string;
    title: string;
    options?: Array<{ id: string; text: string; value?: string | number | boolean }>;
    [key: string]: unknown;
  }>;
  is_published?: boolean;
}

interface QuizResponse {
  success: boolean;
  message: string;
  data?: Quiz;
  error?: string;
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

// Verificar se o usuário é dono do quiz
async function verifyQuizOwnership(quizId: string, userId: string): Promise<Quiz | null> {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('user_id', userId)
    .single();

  if (error || !quiz) return null;
  return quiz;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuizResponse>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'ID do quiz é obrigatório',
        error: 'MISSING_QUIZ_ID'
      });
    }

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
      // Buscar quiz específico
      const quiz = await verifyQuizOwnership(id, user.id);
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz não encontrado ou você não tem permissão para acessá-lo',
          error: 'QUIZ_NOT_FOUND'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz encontrado com sucesso',
        data: quiz
      });

    } else if (req.method === 'PUT') {
      // Atualizar quiz
      const quiz = await verifyQuizOwnership(id, user.id);
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz não encontrado ou você não tem permissão para editá-lo',
          error: 'QUIZ_NOT_FOUND'
        });
      }

      const { title, description, settings, questions, is_published }: UpdateQuizRequest = req.body;

      // Validar título se fornecido
      if (title !== undefined && (!title || title.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Título do quiz não pode estar vazio',
          error: 'INVALID_TITLE'
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

      // Preparar dados para atualização
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (settings !== undefined) updateData.settings = settings;
      if (questions !== undefined) updateData.questions = questions;
      if (is_published !== undefined) {
        updateData.is_published = is_published;
        // Gerar public_id se estiver publicando pela primeira vez
        if (is_published && !quiz.public_id) {
          updateData.public_id = uuidv4();
        }
      }

      const { data: updatedQuiz, error: updateError } = await supabase
        .from('quizzes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating quiz:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar quiz',
          error: 'DATABASE_ERROR'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz atualizado com sucesso',
        data: updatedQuiz
      });

    } else if (req.method === 'DELETE') {
      // Deletar quiz
      const quiz = await verifyQuizOwnership(id, user.id);
      
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz não encontrado ou você não tem permissão para deletá-lo',
          error: 'QUIZ_NOT_FOUND'
        });
      }

      // Deletar respostas relacionadas primeiro (se existirem)
      await supabase
        .from('quiz_responses')
        .delete()
        .eq('quiz_id', id);

      // Deletar o quiz
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting quiz:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao deletar quiz',
          error: 'DATABASE_ERROR'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz deletado com sucesso'
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