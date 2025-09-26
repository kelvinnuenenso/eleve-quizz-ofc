// API Consolidada Principal - Versão JavaScript
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulação do UsageTracker
class UsageTracker {
  static async getUserUsage(userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();

      const { data: quizzes, count: quizCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      const { data: responses, count: responseCount } = await supabase
        .from('quiz_results')
        .select('*', { count: 'exact' })
        .in('quiz_id', (quizzes || []).map(q => q.id));

      return {
        plan: profile?.plan || 'free',
        quizzes_created: quizCount || 0,
        responses_received: responseCount || 0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter usage:', error);
      return {
        plan: 'free',
        quizzes_created: 0,
        responses_received: 0,
        last_updated: new Date().toISOString()
      };
    }
  }

  static async getUsageWarnings(userId) {
    // Implementação simplificada
    return [];
  }

  static async checkPermission(userId, action) {
    const usage = await this.getUserUsage(userId);
    const plan = usage.plan;

    const limits = {
      free: { create_quiz: 3, add_question: 50, receive_response: 100 },
      pro: { create_quiz: 50, add_question: 1000, receive_response: 10000 },
      enterprise: { create_quiz: -1, add_question: -1, receive_response: -1 }
    };

    const limit = limits[plan]?.[action];
    if (limit === -1) return { allowed: true }; // Unlimited

    const current = {
      create_quiz: usage.quizzes_created,
      add_question: usage.quizzes_created * 10, // Estimativa
      receive_response: usage.responses_received
    }[action] || 0;

    return {
      allowed: current < limit,
      current,
      limit,
      remaining: Math.max(0, limit - current)
    };
  }
}

// Simulação do SubscriptionManager
class SubscriptionManager {
  static async createSubscription(userId, planType) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      return { success: false, error: error.message };
    }
  }
}

// Handler principal
async function handler(req, res) {
  const { action } = req.query;

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
        const { permission_action } = req.query;
        if (!permission_action) {
          return res.status(400).json({ success: false, error: 'permission_action é obrigatório' });
        }
        const permission = await UsageTracker.checkPermission(user.id, permission_action);
        return res.status(200).json({
          success: true,
          data: permission,
          message: 'Permissão verificada com sucesso'
        });

      // User Profile
      case 'user-profile':
        if (req.method === 'GET') {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          return res.status(200).json({
            success: true,
            data: profile,
            message: 'Perfil obtido com sucesso'
          });
        } else if (req.method === 'PUT') {
          const updates = req.body;
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({
            success: true,
            data: updatedProfile,
            message: 'Perfil atualizado com sucesso'
          });
        }
        return res.status(405).json({ success: false, error: 'Method not allowed' });

      // Subscription Create
      case 'subscription-create':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { plan_type } = req.body;
        if (!plan_type) {
          return res.status(400).json({ success: false, error: 'plan_type é obrigatório' });
        }
        const subscriptionResult = await SubscriptionManager.createSubscription(user.id, plan_type);
        if (subscriptionResult.success) {
          return res.status(201).json({
            success: true,
            data: subscriptionResult.data,
            message: 'Assinatura criada com sucesso'
          });
        } else {
          return res.status(400).json({
            success: false,
            error: subscriptionResult.error
          });
        }

      // Analytics Dashboard
      case 'analytics-dashboard':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: userQuizzes } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            created_at,
            quiz_results (
              id,
              score,
              completed_at
            )
          `)
          .eq('user_id', user.id);

        const analytics = {
          total_quizzes: userQuizzes?.length || 0,
          total_responses: userQuizzes?.reduce((acc, quiz) => acc + (quiz.quiz_results?.length || 0), 0) || 0,
          quizzes: userQuizzes || []
        };

        return res.status(200).json({
          success: true,
          data: analytics,
          message: 'Analytics obtidos com sucesso'
        });

      // Leads Export
      case 'leads-export':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: leads } = await supabase
          .from('quiz_results')
          .select(`
            id,
            user_responder_id,
            respostas_json,
            score,
            completed_at,
            quizzes!inner (
              id,
              title,
              user_id
            )
          `)
          .eq('quizzes.user_id', user.id);

        return res.status(200).json({
          success: true,
          data: leads || [],
          message: 'Leads exportados com sucesso'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Ação não reconhecida',
          available_actions: [
            'usage-stats',
            'usage-check',
            'user-profile',
            'subscription-create',
            'analytics-dashboard',
            'leads-export'
          ]
        });
    }
  } catch (error) {
    console.error('Erro na API consolidada:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

module.exports = handler;