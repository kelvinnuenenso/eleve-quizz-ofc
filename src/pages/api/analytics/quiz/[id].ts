import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';

interface QuizAnalytics {
  overview: {
    totalResponses: number;
    averageScore: number;
    maxScore: number;
    minScore: number;
    completionRate: number;
    averageTimeSpent?: number;
  };
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  responsesTrend: Array<{
    date: string;
    count: number;
    averageScore: number;
  }>;
  questionAnalysis: Array<{
    questionId: string;
    questionText: string;
    type: string;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracyRate: number;
    averageTime?: number;
    options?: Array<{
      optionId: string;
      text: string;
      selectedCount: number;
      percentage: number;
      isCorrect: boolean;
    }>;
  }>;
  demographics: {
    byDevice?: Array<{ device: string; count: number }>;
    byLocation?: Array<{ location: string; count: number }>;
    byTimeOfDay?: Array<{ hour: number; count: number }>;
  };
  recentResponses: Array<{
    id: string;
    score: number;
    completedAt: string;
    timeSpent?: number;
    userAgent?: string;
  }>;
}

interface QuizAnalyticsApiResponse {
  success: boolean;
  analytics?: QuizAnalytics;
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
  res: NextApiResponse<QuizAnalyticsApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  const { id: quizId } = req.query;

  if (!quizId || typeof quizId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'ID do quiz é obrigatório'
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
    // Verificar se o quiz pertence ao usuário
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, user_id, titulo')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz não encontrado'
      });
    }

    if (quiz.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    // Buscar analytics do quiz
    const overview = await getQuizOverview(quizId);
    const scoreDistribution = await getScoreDistribution(quizId);
    const responsesTrend = await getResponsesTrend(quizId);
    const questionAnalysis = await getQuestionAnalysis(quizId);
    const demographics = await getDemographics(quizId);
    const recentResponses = await getRecentResponses(quizId);

    const analytics: QuizAnalytics = {
      overview,
      scoreDistribution,
      responsesTrend,
      questionAnalysis,
      demographics,
      recentResponses
    };

    return res.status(200).json({
      success: true,
      analytics,
      message: 'Analytics do quiz obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar analytics do quiz:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Função para buscar overview do quiz
async function getQuizOverview(quizId: string) {
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('score, completed_at, criado_em')
    .eq('quiz_id', quizId);

  if (!responses || responses.length === 0) {
    return {
      totalResponses: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      completionRate: 0
    };
  }

  const scores = responses.map(r => r.score);
  const totalResponses = responses.length;
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalResponses;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  // Calcular taxa de conclusão (assumindo que respostas completas têm completed_at)
  const completedResponses = responses.filter(r => r.completed_at).length;
  const completionRate = (completedResponses / totalResponses) * 100;

  return {
    totalResponses,
    averageScore: Math.round(averageScore * 100) / 100,
    maxScore,
    minScore,
    completionRate: Math.round(completionRate * 100) / 100
  };
}

// Função para buscar distribuição de scores
async function getScoreDistribution(quizId: string) {
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('score')
    .eq('quiz_id', quizId);

  if (!responses || responses.length === 0) {
    return [];
  }

  const ranges = [
    { min: 0, max: 20, label: '0-20%' },
    { min: 21, max: 40, label: '21-40%' },
    { min: 41, max: 60, label: '41-60%' },
    { min: 61, max: 80, label: '61-80%' },
    { min: 81, max: 100, label: '81-100%' }
  ];

  const distribution = ranges.map(range => {
    const count = responses.filter(r => r.score >= range.min && r.score <= range.max).length;
    const percentage = (count / responses.length) * 100;
    
    return {
      range: range.label,
      count,
      percentage: Math.round(percentage * 100) / 100
    };
  });

  return distribution;
}

// Função para buscar tendência de respostas
async function getResponsesTrend(quizId: string, days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('score, criado_em')
    .eq('quiz_id', quizId)
    .gte('criado_em', startDate.toISOString())
    .order('criado_em');

  if (!responses || responses.length === 0) {
    return [];
  }

  // Agrupar por dia
  const dailyData: { [key: string]: { scores: number[], count: number } } = {};

  responses.forEach(response => {
    const date = new Date(response.criado_em).toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { scores: [], count: 0 };
    }
    dailyData[date].scores.push(response.score);
    dailyData[date].count++;
  });

  // Converter para array
  const trend = Object.entries(dailyData).map(([date, data]) => {
    const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
    
    return {
      date,
      count: data.count,
      averageScore: Math.round(averageScore * 100) / 100
    };
  });

  return trend.sort((a, b) => a.date.localeCompare(b.date));
}

// Função para análise de questões
async function getQuestionAnalysis(quizId: string) {
  const { data: questions } = await supabase
    .from('questions')
    .select(`
      id,
      enunciado,
      tipo,
      options (
        id,
        texto,
        correta
      )
    `)
    .eq('quiz_id', quizId)
    .order('ordem');

  if (!questions || questions.length === 0) {
    return [];
  }

  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('respostas_json, resultado')
    .eq('quiz_id', quizId);

  const analysis = questions.map(question => {
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const optionCounts: { [key: string]: number } = {};

    // Inicializar contadores de opções
    question.options?.forEach(option => {
      optionCounts[option.id] = 0;
    });

    // Analisar respostas
    responses?.forEach(response => {
      const userAnswer = response.respostas_json?.[question.id];
      const questionResult = response.resultado?.detalhes?.[question.id];

      if (userAnswer) {
        // Contar respostas corretas/incorretas
        if (questionResult?.correct) {
          correctAnswers++;
        } else {
          incorrectAnswers++;
        }

        // Contar seleções de opções
        if (Array.isArray(userAnswer)) {
          userAnswer.forEach(answerId => {
            if (optionCounts.hasOwnProperty(answerId)) {
              optionCounts[answerId]++;
            }
          });
        } else if (typeof userAnswer === 'string' && optionCounts.hasOwnProperty(userAnswer)) {
          optionCounts[userAnswer]++;
        }
      }
    });

    const totalAnswers = correctAnswers + incorrectAnswers;
    const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    // Preparar análise de opções
    const optionsAnalysis = question.options?.map(option => {
      const selectedCount = optionCounts[option.id] || 0;
      const percentage = totalAnswers > 0 ? (selectedCount / totalAnswers) * 100 : 0;

      return {
        optionId: option.id,
        text: option.texto,
        selectedCount,
        percentage: Math.round(percentage * 100) / 100,
        isCorrect: option.correta
      };
    }) || [];

    return {
      questionId: question.id,
      questionText: question.enunciado,
      type: question.tipo,
      correctAnswers,
      incorrectAnswers,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      options: optionsAnalysis
    };
  });

  return analysis;
}

// Função para buscar dados demográficos (simulados)
async function getDemographics(quizId: string) {
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('criado_em')
    .eq('quiz_id', quizId);

  if (!responses || responses.length === 0) {
    return {
      byTimeOfDay: []
    };
  }

  // Análise por hora do dia
  const hourCounts: { [key: number]: number } = {};
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  responses.forEach(response => {
    const hour = new Date(response.criado_em).getHours();
    hourCounts[hour]++;
  });

  const byTimeOfDay = Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour),
    count
  }));

  return {
    byTimeOfDay
  };
}

// Função para buscar respostas recentes
async function getRecentResponses(quizId: string, limit = 10) {
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('id, score, completed_at, criado_em')
    .eq('quiz_id', quizId)
    .order('criado_em', { ascending: false })
    .limit(limit);

  return responses?.map(response => ({
    id: response.id,
    score: response.score,
    completedAt: response.completed_at || response.criado_em
  })) || [];
}

export default withErrorHandling(handler);