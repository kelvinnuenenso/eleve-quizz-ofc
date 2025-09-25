import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionManager, CreateSubscriptionRequest } from '@/lib/subscriptionManager';
import { PlanType } from '@/lib/planManager';
import { withErrorHandling } from '@/lib/errorHandling';

interface CreateSubscriptionApiRequest extends NextApiRequest {
  body: {
    planType: PlanType;
    billingCycle: 'monthly' | 'yearly';
    paymentMethodId?: string;
  };
}

interface CreateSubscriptionApiResponse {
  success: boolean;
  subscription?: any;
  message?: string;
  error?: string;
}

async function handler(
  req: CreateSubscriptionApiRequest,
  res: NextApiResponse<CreateSubscriptionApiResponse>
) {
  if (req.method !== 'POST') {
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

  const { planType, billingCycle, paymentMethodId } = req.body;

  // Validações
  if (!planType || !['pro', 'premium'].includes(planType)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de plano inválido'
    });
  }

  if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
    return res.status(400).json({
      success: false,
      error: 'Ciclo de cobrança inválido'
    });
  }

  try {
    // Verificar se já existe assinatura ativa
    const existingSubscription = await SubscriptionManager.getUserSubscription(user.id);
    if (existingSubscription?.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Usuário já possui uma assinatura ativa'
      });
    }

    // Criar assinatura
    const subscriptionRequest: CreateSubscriptionRequest = {
      userId: user.id,
      planType,
      billingCycle,
      paymentMethodId
    };

    const subscription = await SubscriptionManager.createSubscription(subscriptionRequest);

    // Em uma implementação real com Stripe, aqui seria criada a subscription no Stripe
    // e o webhook do Stripe atualizaria os dados no banco

    return res.status(201).json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      },
      message: 'Assinatura criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);