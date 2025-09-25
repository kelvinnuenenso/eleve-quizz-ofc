import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionManager, UpdateSubscriptionRequest } from '@/lib/subscriptionManager';
import { PlanType } from '@/lib/planManager';
import { withErrorHandling } from '@/lib/errorHandling';

interface UpdateSubscriptionApiRequest extends NextApiRequest {
  query: {
    id: string;
  };
  body: {
    planType?: PlanType;
    status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  };
}

interface UpdateSubscriptionApiResponse {
  success: boolean;
  subscription?: any;
  message?: string;
  error?: string;
}

async function handler(
  req: UpdateSubscriptionApiRequest,
  res: NextApiResponse<UpdateSubscriptionApiResponse>
) {
  if (req.method !== 'PUT') {
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

  const { id: subscriptionId } = req.query;
  const { planType, status } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({
      success: false,
      error: 'ID da assinatura é obrigatório'
    });
  }

  try {
    // Verificar se a assinatura pertence ao usuário
    const existingSubscription = await SubscriptionManager.getUserSubscription(user.id);
    if (!existingSubscription || existingSubscription.id !== subscriptionId) {
      return res.status(404).json({
        success: false,
        error: 'Assinatura não encontrada'
      });
    }

    // Validações
    if (planType && !['starter', 'pro', 'premium'].includes(planType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de plano inválido'
      });
    }

    if (status && !['active', 'canceled', 'past_due', 'unpaid', 'trialing'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }

    // Atualizar assinatura
    const updateRequest: UpdateSubscriptionRequest = {
      subscriptionId,
      planType,
      status
    };

    const updatedSubscription = await SubscriptionManager.updateSubscription(updateRequest);

    return res.status(200).json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        planType: updatedSubscription.planType,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd
      },
      message: 'Assinatura atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);