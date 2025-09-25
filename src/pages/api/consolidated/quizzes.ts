import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';

interface QuizzesApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuizzesApiResponse>
) {
  const { action, id, publicId } = req.query;

  // Verificar autenticação para ações que precisam
  const needsAuth = !['public-quiz', 'quiz-respond'].includes(action as string);
  let user = null;

  if (needsAuth) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    user = userData.user;
  }

  try {
    switch (action) {
      // List user quizzes
      case 'list':
        if (req.method !== 'GET' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (quizzesError) throw quizzesError;

        return res.status(200).json({
          success: true,
          data: quizzes,
          message: 'Quizzes obtidos com sucesso'
        });

      // Get quiz by ID
      case 'get':
        if (req.method !== 'GET' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (quizError) throw quizError;

        return res.status(200).json({
          success: true,
          data: quiz,
          message: 'Quiz obtido com sucesso'
        });

      // Create quiz
      case 'create':
        if (req.method !== 'POST' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const quizData = { ...req.body, user_id: user.id };
        const { data: newQuiz, error: createError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();

        if (createError) throw createError;

        return res.status(201).json({
          success: true,
          data: newQuiz,
          message: 'Quiz criado com sucesso'
        });

      // Update quiz
      case 'update':
        if (req.method !== 'PUT' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: updatedQuiz, error: updateError } = await supabase
          .from('quizzes')
          .update(req.body)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json({
          success: true,
          data: updatedQuiz,
          message: 'Quiz atualizado com sucesso'
        });

      // Delete quiz
      case 'delete':
        if (req.method !== 'DELETE' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { error: deleteError } = await supabase
          .from('quizzes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        return res.status(200).json({
          success: true,
          message: 'Quiz deletado com sucesso'
        });

      // Get public quiz
      case 'public-quiz':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: publicQuiz, error: publicError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('public_id', publicId)
          .eq('ativo', true)
          .single();

        if (publicError) throw publicError;

        return res.status(200).json({
          success: true,
          data: publicQuiz,
          message: 'Quiz público obtido com sucesso'
        });

      // Submit quiz response
      case 'quiz-respond':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const responseData = req.body;
        const { data: response, error: responseError } = await supabase
          .from('quiz_responses')
          .insert(responseData)
          .select()
          .single();

        if (responseError) throw responseError;

        return res.status(201).json({
          success: true,
          data: response,
          message: 'Resposta enviada com sucesso'
        });

      // Get quiz responses
      case 'responses':
        if (req.method !== 'GET' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: responses, error: responsesError } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('quiz_id', id)
          .order('created_at', { ascending: false });

        if (responsesError) throw responsesError;

        return res.status(200).json({
          success: true,
          data: responses,
          message: 'Respostas obtidas com sucesso'
        });

      // Get quiz results
      case 'results':
        if (req.method !== 'GET' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: results, error: resultsError } = await supabase
          .from('quiz_results')
          .select('*')
          .eq('quiz_id', id)
          .order('created_at', { ascending: false });

        if (resultsError) throw resultsError;

        return res.status(200).json({
          success: true,
          data: results,
          message: 'Resultados obtidos com sucesso'
        });

      // Templates
      case 'templates-list':
        if (req.method !== 'GET' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: templates, error: templatesError } = await supabase
          .from('quiz_templates')
          .select('*')
          .or(`user_id.eq.${user.id},is_public.eq.true`)
          .order('created_at', { ascending: false });

        if (templatesError) throw templatesError;

        return res.status(200).json({
          success: true,
          data: templates,
          message: 'Templates obtidos com sucesso'
        });

      // Get template by ID
      case 'template-get':
        if (req.method !== 'GET' || !user) {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { data: template, error: templateError } = await supabase
          .from('quiz_templates')
          .select('*')
          .eq('id', id)
          .or(`user_id.eq.${user.id},is_public.eq.true`)
          .single();

        if (templateError) throw templateError;

        return res.status(200).json({
          success: true,
          data: template,
          message: 'Template obtido com sucesso'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Ação não reconhecida'
        });
    }
  } catch (error) {
    console.error('Erro na API de quizzes:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);