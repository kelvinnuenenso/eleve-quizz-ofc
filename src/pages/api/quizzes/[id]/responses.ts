import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';
import { UsageTracker } from '@/lib/usageTracker';

interface QuizResponse {
  id: string;
  quiz_id: string;
  user_responder_id?: string;
  session_id?: string;
  respostas_json: Record<string, any>;
  resultado?: Record<string, any>;
  score: number;
  completed_at?: string;
  criado_em: string;
}

interface ResponsesApiResponse {
  success: boolean;
  response?: QuizResponse;
  responses?: QuizResponse[];
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponsesApiResponse>
) {
  const { id: quizId } = req.query;

  if (!quizId || typeof quizId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'ID do quiz é obrigatório'
    });
  }

  switch (req.method) {
    case 'POST':
      return handleCreateResponse(req, res, quizId);
    
    case 'GET':
      return handleGetResponses(req, res, quizId);
    
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
}

// POST /api/quizzes/[id]/responses - Criar nova resposta
async function handleCreateResponse(
  req: NextApiRequest,
  res: NextApiResponse<ResponsesApiResponse>,
  quizId: string
) {
  try {
    const {
      respostas_json,
      session_id,
      user_responder_id,
      score = 0
    } = req.body;

    // Validar dados obrigatórios
    if (!respostas_json || typeof respostas_json !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Respostas são obrigatórias'
      });
    }

    // Verificar se o quiz existe
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, user_id, status')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz não encontrado'
      });
    }

    // Verificar se o quiz está publicado
    if (quiz.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Quiz não está disponível para respostas'
      });
    }

    // Verificar limites de uso se houver usuário autenticado
    if (user_responder_id) {
      const canReceive = await UsageTracker.canReceiveResponse(quiz.user_id);
      if (!canReceive) {
        return res.status(403).json({
          success: false,
          error: 'Limite de respostas atingido para este plano'
        });
      }
    }

    // Calcular resultado baseado nas respostas
    const resultado = await calculateQuizResult(quizId, respostas_json);

    // Criar resposta
    const { data: response, error } = await supabase
      .from('quiz_responses')
      .insert({
        quiz_id: quizId,
        user_responder_id,
        session_id: session_id || generateSessionId(),
        respostas_json,
        resultado,
        score: resultado?.score || score,
        completed_at: new Date().toISOString(),
        criado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar resposta:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar resposta'
      });
    }

    // Incrementar contador de uso
    if (user_responder_id) {
      await UsageTracker.incrementUsage(quiz.user_id, 'responses', 1);
    }

    // Atualizar estatísticas do quiz
    await updateQuizStats(quizId);

    return res.status(201).json({
      success: true,
      response,
      message: 'Resposta salva com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// GET /api/quizzes/[id]/responses - Obter respostas do quiz
async function handleGetResponses(
  req: NextApiRequest,
  res: NextApiResponse<ResponsesApiResponse>,
  quizId: string
) {
  try {
    // Verificar autenticação para acessar respostas
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Verificar se o usuário é o dono do quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('user_id')
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

    // Parâmetros de paginação
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Filtros opcionais
    const { 
      start_date, 
      end_date, 
      min_score, 
      max_score,
      session_id 
    } = req.query;

    let query = supabase
      .from('quiz_responses')
      .select('*', { count: 'exact' })
      .eq('quiz_id', quizId)
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (start_date) {
      query = query.gte('criado_em', start_date);
    }
    if (end_date) {
      query = query.lte('criado_em', end_date);
    }
    if (min_score) {
      query = query.gte('score', parseInt(min_score as string));
    }
    if (max_score) {
      query = query.lte('score', parseInt(max_score as string));
    }
    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    const { data: responses, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar respostas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar respostas'
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return res.status(200).json({
      success: true,
      responses: responses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      message: 'Respostas obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Função auxiliar para calcular resultado do quiz
async function calculateQuizResult(quizId: string, respostas: Record<string, any>) {
  try {
    // Buscar questões e opções corretas do quiz
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        tipo,
        options (
          id,
          texto,
          correta
        )
      `)
      .eq('quiz_id', quizId)
      .order('ordem');

    if (error || !questions) {
      return { score: 0, total: 0, correct: 0 };
    }

    let correct = 0;
    let total = 0;
    const detalhes: Record<string, any> = {};

    for (const question of questions) {
      const questionId = question.id;
      const userAnswer = respostas[questionId];
      
      if (!userAnswer) continue;

      total++;

      switch (question.tipo) {
        case 'single_choice':
        case 'multiple_choice':
          const correctOptions = question.options?.filter(opt => opt.correta) || [];
          const correctIds = correctOptions.map(opt => opt.id);
          
          if (question.tipo === 'single_choice') {
            if (correctIds.includes(userAnswer)) {
              correct++;
              detalhes[questionId] = { correct: true, answer: userAnswer };
            } else {
              detalhes[questionId] = { correct: false, answer: userAnswer, correctAnswer: correctIds[0] };
            }
          } else {
            // multiple_choice
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
            const isCorrect = correctIds.length === userAnswers.length && 
                            correctIds.every(id => userAnswers.includes(id));
            
            if (isCorrect) {
              correct++;
              detalhes[questionId] = { correct: true, answer: userAnswers };
            } else {
              detalhes[questionId] = { correct: false, answer: userAnswers, correctAnswer: correctIds };
            }
          }
          break;

        case 'boolean':
          const correctOption = question.options?.find(opt => opt.correta);
          const isCorrect = correctOption && correctOption.texto.toLowerCase() === userAnswer.toLowerCase();
          
          if (isCorrect) {
            correct++;
            detalhes[questionId] = { correct: true, answer: userAnswer };
          } else {
            detalhes[questionId] = { correct: false, answer: userAnswer, correctAnswer: correctOption?.texto };
          }
          break;

        case 'text':
          // Para questões de texto, consideramos sempre corretas (ou implementar lógica específica)
          correct++;
          detalhes[questionId] = { correct: true, answer: userAnswer };
          break;

        case 'rating':
          // Para questões de rating, consideramos sempre corretas
          correct++;
          detalhes[questionId] = { correct: true, answer: userAnswer };
          break;
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      score,
      total,
      correct,
      percentage: score,
      detalhes,
      completedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro ao calcular resultado:', error);
    return { score: 0, total: 0, correct: 0 };
  }
}

// Função auxiliar para atualizar estatísticas do quiz
async function updateQuizStats(quizId: string) {
  try {
    // Calcular estatísticas atualizadas
    const { data: responses } = await supabase
      .from('quiz_responses')
      .select('score')
      .eq('quiz_id', quizId);

    if (!responses || responses.length === 0) return;

    const scores = responses.map(r => r.score);
    const totalResponses = scores.length;
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalResponses;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Atualizar ou inserir estatísticas
    await supabase
      .from('quiz_stats')
      .upsert({
        quiz_id: quizId,
        total_responses: totalResponses,
        average_score: Math.round(averageScore * 100) / 100,
        max_score: maxScore,
        min_score: minScore,
        updated_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}

// Função auxiliar para gerar session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default withErrorHandling(handler);