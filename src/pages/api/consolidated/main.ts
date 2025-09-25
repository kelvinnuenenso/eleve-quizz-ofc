import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { UsageTracker, UsageStats, UsageWarning } from '@/lib/usageTracker';
import { withErrorHandling } from '@/lib/errorHandling';
import { SubscriptionManager } from '@/lib/subscriptionManager';

interface ConsolidatedApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConsolidatedApiResponse>
) {
  const { action } = req.query;

  // Verificar autenticação para todas as ações
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

  try {
    switch (action) {
      // Usage Stats
      case 'usage-stats':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const usage = await UsageTracker.getUserUsage(user.id);
        const warnings = await UsageTracker.getUsageWarnings(user.id);
        return res.status(200).json({
          success: true,
          data: { usage, warnings },
          message: 'Estatísticas de uso obtidas com sucesso'
        });

      // Usage Check
      case 'usage-check':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { checkAction, questionCount } = req.query;
        let canPerform = false;
        
        switch (checkAction) {
          case 'create_quiz':
            canPerform = await UsageTracker.canCreateQuiz(user.id);
            break;
          case 'add_question':
            const count = parseInt(questionCount as string) || 1;
            canPerform = await UsageTracker.canAddQuestion(user.id, count);
            break;
          case 'receive_response':
            canPerform = await UsageTracker.canReceiveResponse(user.id);
            break;
        }
        
        return res.status(200).json({
          success: true,
          data: { canPerform },
          message: 'Verificação de uso realizada com sucesso'
        });

      // User Profile
      case 'user-profile':
        if (req.method === 'GET') {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) throw error;

          return res.status(200).json({
            success: true,
            data: profile,
            message: 'Perfil obtido com sucesso'
          });
        } else if (req.method === 'PUT') {
          const updates = req.body;
          const { data: profile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          return res.status(200).json({
            success: true,
            data: profile,
            message: 'Perfil atualizado com sucesso'
          });
        }
        break;

      // Subscription Management
      case 'subscription-create':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const createRequest = req.body;
        const subscription = await SubscriptionManager.createSubscription({
          ...createRequest,
          userId: user.id
        });
        return res.status(200).json({
          success: true,
          data: subscription,
          message: 'Assinatura criada com sucesso'
        });

      // Analytics Dashboard
      case 'analytics-dashboard':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id, titulo, created_at')
          .eq('user_id', user.id);

        if (quizzesError) throw quizzesError;

        const { data: responses, error: responsesError } = await supabase
          .from('quiz_responses')
          .select('quiz_id, created_at')
          .in('quiz_id', quizzes.map(q => q.id));

        if (responsesError) throw responsesError;

        return res.status(200).json({
          success: true,
          data: { quizzes, responses },
          message: 'Dashboard analytics obtido com sucesso'
        });

      // Lead Export
      case 'leads-export':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);

        if (leadsError) throw leadsError;

        return res.status(200).json({
          success: true,
          data: leads,
          message: 'Leads exportados com sucesso'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Ação não reconhecida'
        });
    }
  } catch (error) {
    console.error('Erro na API consolidada:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);