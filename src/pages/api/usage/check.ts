import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { UsageTracker } from '@/lib/usageTracker';
import { withErrorHandling } from '@/lib/errorHandling';

interface UsageCheckApiRequest extends NextApiRequest {
  query: {
    action: 'create_quiz' | 'add_question' | 'receive_response';
    questionCount?: string;
  };
}

interface UsageCheckApiResponse {
  success: boolean;
  allowed?: boolean;
  reason?: string;
  message?: string;
  error?: string;
}

async function handler(
  req: UsageCheckApiRequest,
  res: NextApiResponse<UsageCheckApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Verificar autenticação
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso requerido'
    });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  const { action, questionCount } = req.query;

  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Ação é obrigatória'
    });
  }

  try {
    let result: { allowed: boolean; reason?: string };

    switch (action) {
      case 'create_quiz':
        result = await UsageTracker.canCreateQuiz(user.id);
        break;

      case 'add_question':
        if (!questionCount) {
          return res.status(400).json({
            success: false,
            error: 'Número de perguntas é obrigatório para esta ação'
          });
        }
        const currentQuestionCount = parseInt(questionCount, 10);
        if (isNaN(currentQuestionCount)) {
          return res.status(400).json({
            success: false,
            error: 'Número de perguntas deve ser um número válido'
          });
        }
        result = await UsageTracker.canAddQuestion(user.id, currentQuestionCount);
        break;

      case 'receive_response':
        result = await UsageTracker.canReceiveResponse(user.id);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Ação não reconhecida'
        });
    }

    return res.status(200).json({
      success: true,
      allowed: result.allowed,
      reason: result.reason,
      message: result.allowed ? 'Ação permitida' : 'Ação não permitida'
    });

  } catch (error) {
    console.error('Erro ao verificar limites de uso:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);