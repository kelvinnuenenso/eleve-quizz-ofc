import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface QuizAnswer {
  questionId: string;
  answer: string | number | boolean | string[];
  isCorrect?: boolean;
  timeSpent?: number;
}

interface RespondQuizRequest {
  respondent_name?: string;
  respondent_email?: string;
  answers: QuizAnswer[];
  completion_time?: number;
  user_agent?: string;
  ip_address?: string;
}

interface QuizResponseData {
  id: string;
  quiz_id: string;
  respondent_name?: string;
  respondent_email?: string;
  answers: QuizAnswer[];
  score?: number;
  completion_time?: number;
  submitted_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: QuizResponseData;
  error?: string;
}

// Função para calcular pontuação
function calculateScore(answers: QuizAnswer[], questions: Array<{
  id: string;
  type: string;
  title: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  [key: string]: unknown;
}>): number {
  if (!questions || questions.length === 0) return 0;

  let correctAnswers = 0;
  const totalQuestions = questions.length;

  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    let isCorrect = false;

    switch (question.type) {
      case 'multiple-choice':
        isCorrect = answer.answer === question.correctAnswer;
        break;
      case 'true-false':
        isCorrect = answer.answer === question.correctAnswer;
        break;
      case 'multiple-select':
        if (Array.isArray(answer.answer) && Array.isArray(question.correctAnswers)) {
          const userAnswers = answer.answer.sort();
          const correctAnswers = question.correctAnswers.sort();
          isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
        }
        break;
      case 'text':
        if (question.correctAnswer && typeof answer.answer === 'string') {
          isCorrect = answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        }
        break;
      default:
        isCorrect = false;
    }

    if (isCorrect) {
      correctAnswers++;
    }

    // Atualizar a resposta com informação de correção
    answer.isCorrect = isCorrect;
  });

  return Math.round((correctAnswers / totalQuestions) * 100);
}

// Função para obter IP do cliente
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress;
  return ip || 'unknown';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
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

    // Buscar o quiz (deve estar publicado para aceitar respostas)
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz não encontrado ou não está publicado',
        error: 'QUIZ_NOT_FOUND'
      });
    }

    const {
      respondent_name,
      respondent_email,
      answers,
      completion_time,
      user_agent
    }: RespondQuizRequest = req.body;

    // Validar respostas
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Respostas são obrigatórias',
        error: 'MISSING_ANSWERS'
      });
    }

    // Validar email se fornecido
    if (respondent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondent_email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
        error: 'INVALID_EMAIL'
      });
    }

    // Calcular pontuação
    const score = calculateScore(answers, quiz.questions || []);
    const clientIP = getClientIP(req);

    // Preparar dados da resposta
    const responseData = {
      id: uuidv4(),
      quiz_id: id,
      respondent_name: respondent_name?.trim() || null,
      respondent_email: respondent_email?.trim() || null,
      answers: answers,
      score: score,
      completion_time: completion_time || null,
      user_agent: user_agent || req.headers['user-agent'] || null,
      ip_address: clientIP,
      submitted_at: new Date().toISOString()
    };

    // Salvar resposta no banco
    const { data: savedResponse, error: saveError } = await supabase
      .from('quiz_responses')
      .insert(responseData)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving quiz response:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar resposta do quiz',
        error: 'DATABASE_ERROR'
      });
    }

    // Atualizar estatísticas do quiz (incrementar contador de respostas)
    await supabase.rpc('increment_quiz_responses', { quiz_id: id });

    // Preparar resposta para o cliente (sem dados sensíveis)
    const clientResponse: QuizResponseData = {
      id: savedResponse.id,
      quiz_id: savedResponse.quiz_id,
      respondent_name: savedResponse.respondent_name,
      respondent_email: savedResponse.respondent_email,
      answers: savedResponse.answers,
      score: savedResponse.score,
      completion_time: savedResponse.completion_time,
      submitted_at: savedResponse.submitted_at
    };

    // Disparar webhook se configurado
    if (quiz.settings?.webhook_url) {
      try {
        const webhookPayload = {
          event: 'quiz_response',
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          response: clientResponse,
          timestamp: new Date().toISOString()
        };

        // Fazer requisição para webhook (não aguardar resposta)
        fetch(quiz.settings.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Elevado-Quiz-Webhook/1.0'
          },
          body: JSON.stringify(webhookPayload)
        }).catch(error => {
          console.error('Webhook error:', error);
        });
      } catch (error) {
        console.error('Webhook dispatch error:', error);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Resposta do quiz salva com sucesso',
      data: clientResponse
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