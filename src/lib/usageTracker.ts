import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanManager, PlanType } from './planManager';
import { errorHandler } from './errorHandling';

export interface UsageStats {
  quizzes: {
    current: number;
    limit: number;
    percentage: number;
  };
  storage: {
    current: number;
    limit: number;
    percentage: number;
  };
  responses: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export interface UsageWarning {
  type: 'warning' | 'error';
  message: string;
}

export class UsageTracker {
  static async getUserPlan(userId: string): Promise<PlanType> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return (profile?.plan_type as PlanType) || 'free';
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.getUserPlan',
        userId
      });
      return 'free';
    }
  }

  static async getUserUsage(userId: string): Promise<UsageStats> {
    try {
      const [planType, quizCount, storageUsed, responseCount] = await Promise.all([
        this.getUserPlan(userId),
        this.getQuizCount(userId),
        this.getStorageUsed(userId),
        this.getResponseCount(userId)
      ]);

      const plan = PlanManager.getPlan(planType);
      const limits = plan.limits;

      return {
        quizzes: {
          current: quizCount,
          limit: limits.maxQuizzes,
          percentage: limits.maxQuizzes === -1 ? 0 : Math.round((quizCount / limits.maxQuizzes) * 100)
        },
        storage: {
          current: storageUsed,
          limit: limits.maxStorage,
          percentage: limits.maxStorage === -1 ? 0 : Math.round((storageUsed / limits.maxStorage) * 100)
        },
        responses: {
          current: responseCount,
          limit: limits.maxResponsesPerMonth,
          percentage: limits.maxResponsesPerMonth === -1 ? 0 : Math.round((responseCount / limits.maxResponsesPerMonth) * 100)
        }
      };
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.getUserUsage',
        userId
      });
      
      // Return default values on error
      return {
        quizzes: { current: 0, limit: 3, percentage: 0 },
        storage: { current: 0, limit: 50 * 1024 * 1024, percentage: 0 },
        responses: { current: 0, limit: 100, percentage: 0 }
      };
    }
  }

  static async getUsageWarnings(userId: string): Promise<UsageWarning[]> {
    try {
      const usage = await this.getUserUsage(userId);
      const warnings: UsageWarning[] = [];

      // Check quiz limits
      if (usage.quizzes.percentage >= 90) {
        warnings.push({
          type: 'error',
          message: `Limite de quizzes quase atingido (${usage.quizzes.current}/${usage.quizzes.limit})`
        });
      } else if (usage.quizzes.percentage >= 75) {
        warnings.push({
          type: 'warning',
          message: `Você está próximo do limite de quizzes (${usage.quizzes.current}/${usage.quizzes.limit})`
        });
      }

      // Check storage limits
      if (usage.storage.percentage >= 90) {
        warnings.push({
          type: 'error',
          message: 'Limite de armazenamento quase atingido'
        });
      } else if (usage.storage.percentage >= 75) {
        warnings.push({
          type: 'warning',
          message: 'Você está próximo do limite de armazenamento'
        });
      }

      // Check response limits
      if (usage.responses.percentage >= 90) {
        warnings.push({
          type: 'error',
          message: 'Limite de respostas mensais quase atingido'
        });
      } else if (usage.responses.percentage >= 75) {
        warnings.push({
          type: 'warning',
          message: 'Você está próximo do limite de respostas mensais'
        });
      }

      return warnings;
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.getUsageWarnings',
        userId
      });
      return [];
    }
  }

  static async canCreateQuiz(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const usage = await this.getUserUsage(userId);
      
      if (usage.quizzes.limit === -1) {
        return { allowed: true };
      }

      if (usage.quizzes.current >= usage.quizzes.limit) {
        return {
          allowed: false,
          reason: `Limite de quizzes atingido (${usage.quizzes.current}/${usage.quizzes.limit})`
        };
      }

      return { allowed: true };
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.canCreateQuiz',
        userId
      });
      return { allowed: false, reason: 'Erro ao verificar limites' };
    }
  }

  static async canAddQuestion(userId: string, currentQuestionCount: number): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const planType = await this.getUserPlan(userId);
      const plan = PlanManager.getPlan(planType);
      
      if (plan.limits.maxQuestionsPerQuiz === -1) {
        return { allowed: true };
      }

      if (currentQuestionCount >= plan.limits.maxQuestionsPerQuiz) {
        return {
          allowed: false,
          reason: `Limite de perguntas por quiz atingido (${currentQuestionCount}/${plan.limits.maxQuestionsPerQuiz})`
        };
      }

      return { allowed: true };
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.canAddQuestion',
        userId
      });
      return { allowed: false, reason: 'Erro ao verificar limites' };
    }
  }

  static async canReceiveResponse(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const usage = await this.getUserUsage(userId);
      
      if (usage.responses.limit === -1) {
        return { allowed: true };
      }

      if (usage.responses.current >= usage.responses.limit) {
        return {
          allowed: false,
          reason: `Limite de respostas mensais atingido (${usage.responses.current}/${usage.responses.limit})`
        };
      }

      return { allowed: true };
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.canReceiveResponse',
        userId
      });
      return { allowed: false, reason: 'Erro ao verificar limites' };
    }
  }

  static async hasFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const planType = await this.getUserPlan(userId);
      return PlanManager.hasFeature(planType, feature);
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.hasFeature',
        userId,
        feature
      });
      return false;
    }
  }

  static async incrementUsage(userId: string, type: 'quiz' | 'response' | 'storage', amount: number = 1): Promise<void> {
    try {
      // This would typically update usage counters in the database
      // For now, we'll just log the increment
      console.log(`Incrementing ${type} usage for user ${userId} by ${amount}`);
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'UsageTracker.incrementUsage',
        userId,
        type,
        amount
      });
    }
  }

  static getPlanRecommendation(usage: UsageStats): string | null {
    // Check if user is hitting limits
    const highUsage = [usage.quizzes, usage.storage, usage.responses]
      .some(metric => metric.limit !== -1 && metric.percentage >= 80);

    if (highUsage) {
      return 'Considere fazer upgrade do seu plano';
    }

    return null;
  }

  private static async getQuizCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  private static async getStorageUsed(userId: string): Promise<number> {
    // This would calculate actual storage usage
    // For now, return a mock value
    return 0;
  }

  private static async getResponseCount(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('quiz_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;
    return count || 0;
  }
}

// React hook for usage tracking
export function useUsageTracker(userId?: string) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [warnings, setWarnings] = useState<UsageWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadUsage = async () => {
      try {
        setLoading(true);
        const [usageData, warningsData] = await Promise.all([
          UsageTracker.getUserUsage(userId),
          UsageTracker.getUsageWarnings(userId)
        ]);
        
        setUsage(usageData);
        setWarnings(warningsData);
      } catch (error) {
        errorHandler.handleError(error, {
          context: 'useUsageTracker',
          userId
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [userId]);

  return {
    usage,
    warnings,
    loading,
    canCreateQuiz: userId ? () => UsageTracker.canCreateQuiz(userId) : null,
    canAddQuestion: userId ? (count: number) => UsageTracker.canAddQuestion(userId, count) : null,
    canReceiveResponse: userId ? () => UsageTracker.canReceiveResponse(userId) : null,
    hasFeature: userId ? (feature: string) => UsageTracker.hasFeature(userId, feature) : null,
    incrementUsage: userId ? (type: 'quiz' | 'response' | 'storage', amount?: number) => 
      UsageTracker.incrementUsage(userId, type, amount) : null
  };
}