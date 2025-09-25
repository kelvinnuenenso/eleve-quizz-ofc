import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';
import Stripe from 'stripe';

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Erro na verificação do webhook:', err.message);
    return res.status(400).json({
      success: false,
      error: `Webhook signature verification failed: ${err.message}`
    });
  }

  try {
    // Processar evento baseado no tipo
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Processar criação de assinatura
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processando criação de assinatura:', subscription.id);

  try {
    // Buscar customer no Stripe para obter metadata
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (!customer || customer.deleted) {
      throw new Error('Customer não encontrado');
    }

    const userId = customer.metadata?.user_id;
    if (!userId) {
      throw new Error('User ID não encontrado no customer metadata');
    }

    // Determinar plano baseado no price_id
    const priceId = subscription.items.data[0]?.price.id;
    let planType = 'free';
    
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
      planType = 'pro';
    } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
      planType = 'premium';
    }

    // Criar registro de assinatura
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData);

    if (error) {
      throw error;
    }

    // Atualizar plano do usuário
    await supabase
      .from('user_profiles')
      .update({ 
        plano: planType,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    console.log('Assinatura criada com sucesso:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar criação de assinatura:', error);
    throw error;
  }
}

// Processar atualização de assinatura
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processando atualização de assinatura:', subscription.id);

  try {
    // Determinar plano baseado no price_id
    const priceId = subscription.items.data[0]?.price.id;
    let planType = 'free';
    
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
      planType = 'pro';
    } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
      planType = 'premium';
    }

    // Atualizar registro de assinatura
    const updateData = {
      status: subscription.status,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    };

    const { data: subscriptionRecord, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id)
      .select('user_id')
      .single();

    if (error || !subscriptionRecord) {
      throw new Error('Assinatura não encontrada no banco de dados');
    }

    // Atualizar plano do usuário
    await supabase
      .from('user_profiles')
      .update({ 
        plano: planType,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', subscriptionRecord.user_id);

    console.log('Assinatura atualizada com sucesso:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar atualização de assinatura:', error);
    throw error;
  }
}

// Processar cancelamento de assinatura
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processando cancelamento de assinatura:', subscription.id);

  try {
    // Atualizar registro de assinatura
    const { data: subscriptionRecord, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select('user_id')
      .single();

    if (error || !subscriptionRecord) {
      throw new Error('Assinatura não encontrada no banco de dados');
    }

    // Reverter usuário para plano gratuito
    await supabase
      .from('user_profiles')
      .update({ 
        plano: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', subscriptionRecord.user_id);

    console.log('Assinatura cancelada com sucesso:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    throw error;
  }
}

// Processar pagamento bem-sucedido
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processando pagamento bem-sucedido:', invoice.id);

  try {
    if (!invoice.subscription) return;

    // Atualizar status da assinatura
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      throw error;
    }

    console.log('Pagamento processado com sucesso:', invoice.id);

  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error);
    throw error;
  }
}

// Processar falha no pagamento
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processando falha no pagamento:', invoice.id);

  try {
    if (!invoice.subscription) return;

    // Atualizar status da assinatura
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      throw error;
    }

    console.log('Falha no pagamento processada:', invoice.id);

  } catch (error) {
    console.error('Erro ao processar falha no pagamento:', error);
    throw error;
  }
}

// Processar fim do período de teste
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Processando fim do período de teste:', subscription.id);

  try {
    // Aqui você pode implementar lógica para notificar o usuário
    // sobre o fim do período de teste, como enviar email
    
    console.log('Período de teste terminando em:', new Date(subscription.trial_end! * 1000));

  } catch (error) {
    console.error('Erro ao processar fim do período de teste:', error);
    throw error;
  }
}

// Configuração especial para webhooks (raw body)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default withErrorHandling(handler);