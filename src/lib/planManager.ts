export type PlanType = 'starter' | 'pro' | 'premium';

export interface PlanLimits {
  maxQuizzes: number;
  maxQuestionsPerQuiz: number;
  maxResponsesPerMonth: number;
  customBranding: boolean;
  analytics: boolean;
  webhooks: boolean;
  pixelTracking: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  customDomains: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: PlanLimits;
  features: string[];
}

export const PLANS: Record<PlanType, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfeito para começar',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      maxQuizzes: 3,
      maxQuestionsPerQuiz: 10,
      maxResponsesPerMonth: 100,
      customBranding: false,
      analytics: false,
      webhooks: false,
      pixelTracking: false,
      exportData: false,
      prioritySupport: false,
      customDomains: false,
    },
    features: [
      'Até 3 quizzes',
      'Até 10 perguntas por quiz',
      '100 respostas por mês',
      'Templates básicos',
      'Suporte por email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais e pequenas empresas',
    price: {
      monthly: 29,
      yearly: 290, // 2 meses grátis
    },
    limits: {
      maxQuizzes: 25,
      maxQuestionsPerQuiz: 50,
      maxResponsesPerMonth: 2500,
      customBranding: true,
      analytics: true,
      webhooks: true,
      pixelTracking: true,
      exportData: true,
      prioritySupport: false,
      customDomains: false,
    },
    features: [
      'Até 25 quizzes',
      'Até 50 perguntas por quiz',
      '2.500 respostas por mês',
      'Analytics avançados',
      'Branding personalizado',
      'Webhooks',
      'Pixel tracking',
      'Exportar dados',
      'Templates premium',
    ],
    },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Para empresas e agências',
    price: {
      monthly: 99,
      yearly: 990, // 2 meses grátis
    },
    limits: {
      maxQuizzes: -1, // Ilimitado
      maxQuestionsPerQuiz: -1, // Ilimitado
      maxResponsesPerMonth: -1, // Ilimitado
      customBranding: true,
      analytics: true,
      webhooks: true,
      pixelTracking: true,
      exportData: true,
      prioritySupport: true,
      customDomains: true,
    },
    features: [
      'Quizzes ilimitados',
      'Perguntas ilimitadas',
      'Respostas ilimitadas',
      'Analytics avançados',
      'Branding personalizado',
      'Webhooks avançados',
      'Pixel tracking',
      'Exportar dados',
      'Suporte prioritário',
      'Domínios personalizados',
      'API completa',
      'Integrações avançadas',
    ],
  },
};

export class PlanManager {
  static getPlan(planType: PlanType): Plan {
    return PLANS[planType];
  }

  static canCreateQuiz(currentPlan: PlanType, currentQuizCount: number): boolean {
    const plan = this.getPlan(currentPlan);
    return plan.limits.maxQuizzes === -1 || currentQuizCount < plan.limits.maxQuizzes;
  }

  static canAddQuestion(currentPlan: PlanType, currentQuestionCount: number): boolean {
    const plan = this.getPlan(currentPlan);
    return plan.limits.maxQuestionsPerQuiz === -1 || currentQuestionCount < plan.limits.maxQuestionsPerQuiz;
  }

  static canReceiveResponse(currentPlan: PlanType, monthlyResponseCount: number): boolean {
    const plan = this.getPlan(currentPlan);
    return plan.limits.maxResponsesPerMonth === -1 || monthlyResponseCount < plan.limits.maxResponsesPerMonth;
  }

  static hasFeature(currentPlan: PlanType, feature: keyof PlanLimits): boolean {
    const plan = this.getPlan(currentPlan);
    return plan.limits[feature] === true;
  }

  static getUsagePercentage(currentPlan: PlanType, currentUsage: number, limitType: 'quizzes' | 'questions' | 'responses'): number {
    const plan = this.getPlan(currentPlan);
    let limit: number;

    switch (limitType) {
      case 'quizzes':
        limit = plan.limits.maxQuizzes;
        break;
      case 'questions':
        limit = plan.limits.maxQuestionsPerQuiz;
        break;
      case 'responses':
        limit = plan.limits.maxResponsesPerMonth;
        break;
      default:
        return 0;
    }

    if (limit === -1) return 0; // Ilimitado
    return Math.min((currentUsage / limit) * 100, 100);
  }

  static getNextPlan(currentPlan: PlanType): PlanType | null {
    switch (currentPlan) {
      case 'starter':
        return 'pro';
      case 'pro':
        return 'premium';
      case 'premium':
        return null; // Já é o plano mais alto
      default:
        return null;
    }
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  static calculateYearlySavings(planType: PlanType): number {
    const plan = this.getPlan(planType);
    const monthlyTotal = plan.price.monthly * 12;
    return monthlyTotal - plan.price.yearly;
  }
}

// Hook para usar o sistema de planos
export const usePlanManager = () => {
  return {
    PLANS,
    PlanManager,
  };
};
