import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';
import { UsageTracker } from '@/lib/usageTracker';

interface DashboardStats {
  overview: {
    totalQuizzes: number;
    totalResponses: number;
    totalViews: number;
    averageScore: number;
  };
  quizzes: {
    published: number;
    draft: number;
    archived: number;
  };
  responses: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number; // percentual de crescimento
  };
  topQuizzes: Array<{
    id: string;
    titulo: string;
    responses: number;
    averageScore: number;
    views: number;
  }>;
  recentActivity: Array<{
    type: 'quiz_created' | 'response_received' | 'quiz_published';
    quizId: string;
    quizTitle: string;
    timestamp: string;
    details?: any;
  }>;
  usage: {
    current: any;
    warnings: any[];
    planRecommendation?: string;
  };
}

interface DashboardApiResponse {
  success: boolean;
  stats?: DashboardStats;
  message?: string;
  error?: string;
}

// Middleware para autenticação
async function authenticate(req: NextApiRequest): Promise<{ user: Record<string, unknown>; profile: Record<string, unknown> } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { user, profile };
  } catch (error) {
    return null;
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  // Verificar autenticação
  const auth = await authenticate(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso inválido ou expirado'
    });
  }

  const { user } = auth;

  try {
    // Buscar estatísticas gerais
    const overview = await getOverviewStats(user.id as string);
    
    // Buscar estatísticas de quizzes por status
    const quizzes = await getQuizzesStats(user.id as string);
    
    // Buscar estatísticas de respostas
    const responses = await getResponsesStats(user.id as string);
    
    // Buscar top quizzes
    const topQuizzes = await getTopQuizzes(user.id as string);
    
    // Buscar atividade recente
    const recentActivity = await getRecentActivity(user.id as string);
    
    // Buscar dados de uso
    const usage = await getUsageStats(user.id as string);

    const stats: DashboardStats = {
      overview,
      quizzes,
      responses,
      topQuizzes,
      recentActivity,
      usage
    };

    return res.status(200).json({
      success: true,
      stats,
      message: 'Estatísticas do dashboard obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Função para buscar estatísticas gerais
async function getOverviewStats(userId: string) {
  // Total de quizzes
  const { count: totalQuizzes } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Total de respostas
  const { data: responsesData } = await supabase
    .from('quiz_responses')
    .select('score')
    .in('quiz_id', 
      supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', userId)
    );

  const totalResponses = responsesData?.length || 0;
  const averageScore = totalResponses > 0 
    ? responsesData!.reduce((sum, r) => sum + r.score, 0) / totalResponses 
    : 0;

  // Total de visualizações (simulado - implementar tracking real depois)
  const totalViews = totalResponses * 1.5; // Estimativa

  return {
    totalQuizzes: totalQuizzes || 0,
    totalResponses,
    totalViews: Math.round(totalViews),
    averageScore: Math.round(averageScore * 100) / 100
  };
}

// Função para buscar estatísticas de quizzes por status
async function getQuizzesStats(userId: string) {
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('status')
    .eq('user_id', userId);

  const stats = {
    published: 0,
    draft: 0,
    archived: 0
  };

  quizzes?.forEach(quiz => {
    stats[quiz.status as keyof typeof stats]++;
  });

  return stats;
}

// Função para buscar estatísticas de respostas
async function getResponsesStats(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Buscar IDs dos quizzes do usuário
  const { data: userQuizzes } = await supabase
    .from('quizzes')
    .select('id')
    .eq('user_id', userId);

  const quizIds = userQuizzes?.map(q => q.id) || [];

  if (quizIds.length === 0) {
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      growth: 0
    };
  }

  // Respostas de hoje
  const { count: todayCount } = await supabase
    .from('quiz_responses')
    .select('*', { count: 'exact', head: true })
    .in('quiz_id', quizIds)
    .gte('criado_em', today.toISOString());

  // Respostas desta semana
  const { count: weekCount } = await supabase
    .from('quiz_responses')
    .select('*', { count: 'exact', head: true })
    .in('quiz_id', quizIds)
    .gte('criado_em', weekAgo.toISOString());

  // Respostas deste mês
  const { count: monthCount } = await supabase
    .from('quiz_responses')
    .select('*', { count: 'exact', head: true })
    .in('quiz_id', quizIds)
    .gte('criado_em', monthAgo.toISOString());

  // Respostas do mês anterior (para calcular crescimento)
  const { count: lastMonthCount } = await supabase
    .from('quiz_responses')
    .select('*', { count: 'exact', head: true })
    .in('quiz_id', quizIds)
    .gte('criado_em', lastMonth.toISOString())
    .lt('criado_em', monthAgo.toISOString());

  // Calcular crescimento
  const growth = lastMonthCount && lastMonthCount > 0 
    ? ((monthCount || 0) - lastMonthCount) / lastMonthCount * 100 
    : 0;

  return {
    today: todayCount || 0,
    thisWeek: weekCount || 0,
    thisMonth: monthCount || 0,
    growth: Math.round(growth * 100) / 100
  };
}

// Função para buscar top quizzes
async function getTopQuizzes(userId: string, limit = 5) {
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      id,
      titulo,
      quiz_responses (
        id,
        score
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'published');

  const topQuizzes = quizzes?.map(quiz => {
    const responses = quiz.quiz_responses || [];
    const responseCount = responses.length;
    const averageScore = responseCount > 0 
      ? responses.reduce((sum: number, r: any) => sum + r.score, 0) / responseCount 
      : 0;
    
    return {
      id: quiz.id,
      titulo: quiz.titulo,
      responses: responseCount,
      averageScore: Math.round(averageScore * 100) / 100,
      views: Math.round(responseCount * 1.5) // Estimativa
    };
  }) || [];

  // Ordenar por número de respostas
  topQuizzes.sort((a, b) => b.responses - a.responses);

  return topQuizzes.slice(0, limit);
}

// Função para buscar atividade recente
async function getRecentActivity(userId: string, limit = 10) {
  const activities: any[] = [];

  // Quizzes criados recentemente
  const { data: recentQuizzes } = await supabase
    .from('quizzes')
    .select('id, titulo, criado_em, status')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })
    .limit(5);

  recentQuizzes?.forEach(quiz => {
    activities.push({
      type: quiz.status === 'published' ? 'quiz_published' : 'quiz_created',
      quizId: quiz.id,
      quizTitle: quiz.titulo,
      timestamp: quiz.criado_em
    });
  });

  // Respostas recentes
  const { data: userQuizzes } = await supabase
    .from('quizzes')
    .select('id, titulo')
    .eq('user_id', userId);

  const quizIds = userQuizzes?.map(q => q.id) || [];

  if (quizIds.length > 0) {
    const { data: recentResponses } = await supabase
      .from('quiz_responses')
      .select('quiz_id, criado_em, score')
      .in('quiz_id', quizIds)
      .order('criado_em', { ascending: false })
      .limit(5);

    recentResponses?.forEach(response => {
      const quiz = userQuizzes?.find(q => q.id === response.quiz_id);
      if (quiz) {
        activities.push({
          type: 'response_received',
          quizId: response.quiz_id,
          quizTitle: quiz.titulo,
          timestamp: response.criado_em,
          details: { score: response.score }
        });
      }
    });
  }

  // Ordenar por timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities.slice(0, limit);
}

// Função para buscar estatísticas de uso
async function getUsageStats(userId: string) {
  try {
    const current = await UsageTracker.getUserUsage(userId);
    const warnings = await UsageTracker.getUsageWarnings(userId);
    const planRecommendation = await UsageTracker.getPlanRecommendation(userId);

    return {
      current,
      warnings,
      planRecommendation
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso:', error);
    return {
      current: null,
      warnings: [],
      planRecommendation: null
    };
  }
}

export default withErrorHandling(handler);