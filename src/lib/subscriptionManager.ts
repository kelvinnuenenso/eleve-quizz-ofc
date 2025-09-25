import { supabase } from '@/integrations/supabase/client';
import { PlanType } from './planManager';
import { AppError, ErrorType } from './errorHandling';

export interface SubscriptionData {
  id: string;
  userId: string;
  planType: PlanType;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionRequest {
  userId: string;
  planType: PlanType;
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  planType?: PlanType;
  status?: SubscriptionData['status'];
}

export class SubscriptionManager {
  private static readonly STRIPE_PRICE_IDS = {
    pro: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    },
    premium: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID,
    }
  };

  static async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const { data, error } = await supabase
        .from('trainer_subscriptions')
        .select('*')
        .eq('trainer_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new AppError(
          'Erro ao buscar assinatura',
          ErrorType.DATABASE_ERROR,
          { userId, error: error.message }
        );
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.trainer_id,
        planType: (data.plan_type as PlanType) || 'starter',
        status: data.status as SubscriptionData['status'],
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Erro interno ao buscar assinatura',
        ErrorType.INTERNAL_ERROR,
        { userId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionData> {
    try {
      // Verificar se já existe uma assinatura ativa
      const existingSubscription = await this.getUserSubscription(request.userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        throw new AppError(
          'Usuário já possui uma assinatura ativa',
          ErrorType.VALIDATION_ERROR,
          { userId: request.userId }
        );
      }

      // Calcular datas do período
      const now = new Date();
      const periodEnd = new Date(now);
      
      if (request.billingCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Criar assinatura no banco
      const { data, error } = await supabase
        .from('trainer_subscriptions')
        .insert({
          trainer_id: request.userId,
          plan_type: request.planType,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new AppError(
          'Erro ao criar assinatura',
          ErrorType.DATABASE_ERROR,
          { request, error: error.message }
        );
      }

      // Atualizar plano do usuário
      await this.updateUserPlan(request.userId, request.planType);

      return {
        id: data.id,
        userId: data.trainer_id,
        planType: data.plan_type as PlanType,
        status: data.status as SubscriptionData['status'],
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Erro interno ao criar assinatura',
        ErrorType.INTERNAL_ERROR,
        { request, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async updateSubscription(request: UpdateSubscriptionRequest): Promise<SubscriptionData> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (request.planType) {
        updateData.plan_type = request.planType;
      }

      if (request.status) {
        updateData.status = request.status;
      }

      const { data, error } = await supabase
        .from('trainer_subscriptions')
        .update(updateData)
        .eq('id', request.subscriptionId)
        .select()
        .single();

      if (error) {
        throw new AppError(
          'Erro ao atualizar assinatura',
          ErrorType.DATABASE_ERROR,
          { request, error: error.message }
        );
      }

      // Se o plano foi alterado, atualizar o plano do usuário
      if (request.planType) {
        await this.updateUserPlan(data.trainer_id, request.planType);
      }

      return {
        id: data.id,
        userId: data.trainer_id,
        planType: data.plan_type as PlanType,
        status: data.status as SubscriptionData['status'],
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Erro interno ao atualizar assinatura',
        ErrorType.INTERNAL_ERROR,
        { request, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trainer_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) {
        throw new AppError(
          'Erro ao cancelar assinatura',
          ErrorType.DATABASE_ERROR,
          { subscriptionId, error: error.message }
        );
      }

      // Buscar dados da assinatura para atualizar o plano do usuário
      const { data: subscription } = await supabase
        .from('trainer_subscriptions')
        .select('trainer_id')
        .eq('id', subscriptionId)
        .single();

      if (subscription) {
        // Voltar para o plano gratuito
        await this.updateUserPlan(subscription.trainer_id, 'starter');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Erro interno ao cancelar assinatura',
        ErrorType.INTERNAL_ERROR,
        { subscriptionId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  private static async updateUserPlan(userId: string, planType: PlanType): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ plano: planType })
      .eq('user_id', userId);

    if (error) {
      throw new AppError(
        'Erro ao atualizar plano do usuário',
        ErrorType.DATABASE_ERROR,
        { userId, planType, error: error.message }
      );
    }
  }

  static async getStripePriceId(planType: PlanType, billingCycle: 'monthly' | 'yearly'): Promise<string> {
    if (planType === 'starter') {
      throw new AppError(
        'Plano starter é gratuito',
        ErrorType.VALIDATION_ERROR,
        { planType, billingCycle }
      );
    }

    const priceId = this.STRIPE_PRICE_IDS[planType]?.[billingCycle];
    
    if (!priceId) {
      throw new AppError(
        'Price ID do Stripe não configurado',
        ErrorType.CONFIGURATION_ERROR,
        { planType, billingCycle }
      );
    }

    return priceId;
  }

  static async isSubscriptionActive(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      return subscription?.status === 'active' && 
             subscription.currentPeriodEnd > new Date();
    } catch (error) {
      return false;
    }
  }

  static async getSubscriptionStatus(userId: string): Promise<{
    hasActiveSubscription: boolean;
    planType: PlanType;
    status?: SubscriptionData['status'];
    daysUntilExpiry?: number;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return {
          hasActiveSubscription: false,
          planType: 'starter'
        };
      }

      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        hasActiveSubscription: subscription.status === 'active' && subscription.currentPeriodEnd > now,
        planType: subscription.planType,
        status: subscription.status,
        daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0
      };
    } catch (error) {
      return {
        hasActiveSubscription: false,
        planType: 'starter'
      };
    }
  }
}

// Hook para usar o gerenciamento de assinaturas
export const useSubscriptionManager = () => {
  return {
    SubscriptionManager,
  };
};