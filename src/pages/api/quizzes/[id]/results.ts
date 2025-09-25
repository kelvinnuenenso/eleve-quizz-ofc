import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

interface QuizStats {
  quiz_id: string;
  quiz_title: string;
  total_responses: number;
  average_score: number;
  completion_rate: number;
  average_completion_time: number;
  responses_by_date: Array<{
    date: string;
    count: number;
  }>;
  score_distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  question_analytics: Array<{
    question_id: string;
    question_text: string;
    correct_answers: number;
    total_answers: number;
    accuracy_rate: number;
  }>;
  recent_responses: Array<{
    id: string;
    respondent_name?: string;
    score: number;
    completion_time?: number;
    submitted_at: string;
  }>;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: QuizStats;
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

// Verificar se o usuário é dono do quiz
async function verifyQuizOwnership(quizId: string, userId: string): Promise<Record<string, unknown> | null> {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('user_id', userId)
    .single();

  if (error || !quiz) return null;
  return quiz;
}

// Calcular distribuição de pontuação
function calculateScoreDistribution(responses: Array<{ score: number; [key: string]: unknown }>): Array<{ range: string; count: number; percentage: number }> {
  const ranges = [
    { min: 0, max: 20, label: '0-20%' },
    { min: 21, max: 40, label: '21-40%' },
    { min: 41, max: 60, label: '41-60%' },
    { min: 61, max: 80, label: '61-80%' },
    { min: 81, max: 100, label: '81-100%' }
  ];

  const total = responses.length;
  
  return ranges.map(range => {
    const count = responses.filter(r => 
      r.score >= range.min && r.score <= range.max
    ).length;
    
    return {
      range: range.label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
  });
}

// Analisar perguntas
function analyzeQuestions(
  responses: Array<{ 
    answers?: Array<{ 
      questionId: string; 
      isCorrect?: boolean; 
      [key: string]: unknown 
    }>; 
    [key: string]: unknown 
  }>, 
  questions: Array<{ 
    id: string; 
    question?: string; 
    title?: string; 
    [key: string]: unknown 
  }>
): Array<{
  question_id: string;
  question_text: string;
  correct_answers: number;
  total_answers: number;
  accuracy_rate: number;
}> {
  if (!questions || questions.length === 0) return [];

  return questions.map(question => {
    let correctAnswers = 0;
    let totalAnswers = 0;

    responses.forEach(response => {
      const answer = response.answers?.find((a) => a.questionId === question.id);
      if (answer) {
        totalAnswers++;
        if (answer.isCorrect) {
          correctAnswers++;
        }
      }
    });

    return {
      question_id: question.id,
      question_text: question.question || question.title || 'Pergunta sem título',
      correct_answers: correctAnswers,
      total_answers: totalAnswers,
      accuracy_rate: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0
    };
  });
}

// Agrupar respostas por data
function groupResponsesByDate(responses: Array<{ submitted_at: string; [key: string]: unknown }>): Array<{ date: string; count: number }> {
  const grouped: { [key: string]: number } = {};

  responses.forEach(response => {
    const date = new Date(response.submitted_at).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      error: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'ID do quiz é obrigatório',
        error: 'MISSING_QUIZ_ID'
      });
    }

    // Autenticar usuário
    const auth = await authenticate(req);
    if (!auth) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso inválido ou expirado',
        error: 'UNAUTHORIZED'
      });
    }

    const { user } = auth;

    // Verificar se o usuário é dono do quiz
    const quiz = await verifyQuizOwnership(id, user.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz não encontrado ou você não tem permissão para acessá-lo',
        error: 'QUIZ_NOT_FOUND'
      });
    }

    // Buscar todas as respostas do quiz
    const { data: responses, error: responsesError } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('quiz_id', id)
      .order('submitted_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching quiz responses:', responsesError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar respostas do quiz',
        error: 'DATABASE_ERROR'
      });
    }

    const totalResponses = responses?.length || 0;

    // Calcular estatísticas básicas
    let averageScore = 0;
    let averageCompletionTime = 0;
    const completionRate = 100; // Assumindo que todas as respostas foram completadas

    if (totalResponses > 0) {
      const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0);
      averageScore = Math.round(totalScore / totalResponses);

      const responsesWithTime = responses.filter(r => r.completion_time);
      if (responsesWithTime.length > 0) {
        const totalTime = responsesWithTime.reduce((sum, r) => sum + r.completion_time, 0);
        averageCompletionTime = Math.round(totalTime / responsesWithTime.length);
      }
    }

    // Preparar estatísticas
    const stats: QuizStats = {
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      total_responses: totalResponses,
      average_score: averageScore,
      completion_rate: completionRate,
      average_completion_time: averageCompletionTime,
      responses_by_date: groupResponsesByDate(responses || []),
      score_distribution: calculateScoreDistribution(responses || []),
      question_analytics: analyzeQuestions(responses || [], quiz.questions || []),
      recent_responses: (responses || [])
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          respondent_name: r.respondent_name,
          score: r.score || 0,
          completion_time: r.completion_time,
          submitted_at: r.submitted_at
        }))
    };

    return res.status(200).json({
      success: true,
      message: 'Estatísticas do quiz obtidas com sucesso',
      data: stats
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}