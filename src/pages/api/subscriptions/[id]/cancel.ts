import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import { withErrorHandling } from '@/lib/errorHandling';

interface CancelSubscriptionApiRequest extends NextApiRequest {
  query: {
    id: string;
  };
}

interface CancelSubscriptionApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

async function handler(
  req: CancelSubscriptionApiRequest,
  res: NextApiResponse<CancelSubscriptionApiResponse>
) {
  if (req.method !== 'DELETE') {
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

    // Verificar se a assinatura pode ser cancelada
    if (existingSubscription.status === 'canceled') {
      return res.status(400).json({
        success: false,
        error: 'Assinatura já está cancelada'
      });
    }

    // Cancelar assinatura
    await SubscriptionManager.cancelSubscription(subscriptionId);

    return res.status(200).json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);