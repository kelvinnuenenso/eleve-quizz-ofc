import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';
import { UsageTracker } from '@/lib/usageTracker';

interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  plano: 'free' | 'basic' | 'premium' | 'enterprise';
  avatar_url?: string;
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
  data_criacao: string;
  updated_at: string;
}

interface ProfileApiResponse {
  success: boolean;
  profile?: UserProfile;
  message?: string;
  error?: string;
}

// Middleware para autenticação
async function authenticate(req: NextApiRequest): Promise<{ user: Record<string, unknown>; profile: UserProfile } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) return null;

    return { user, profile };
  } catch (error) {
    return null;
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileApiResponse>
) {
  // Verificar autenticação
  const auth = await authenticate(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso inválido ou expirado'
    });
  }

  const { user, profile } = auth;

  switch (req.method) {
    case 'GET':
      return handleGetProfile(req, res, profile);
    
    case 'PUT':
      return handleUpdateProfile(req, res, user, profile);
    
    case 'DELETE':
      return handleDeleteAccount(req, res, user);
    
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
}

// GET /api/users/profile - Obter perfil do usuário
async function handleGetProfile(
  req: NextApiRequest,
  res: NextApiResponse<ProfileApiResponse>,
  profile: UserProfile
) {
  try {
    // Adicionar estatísticas de uso ao perfil
    const usage = await UsageTracker.getUserUsage(profile.user_id);
    const warnings = await UsageTracker.getUsageWarnings(profile.user_id);

    return res.status(200).json({
      success: true,
      profile: {
        ...profile,
        usage,
        warnings
      } as any,
      message: 'Perfil obtido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// PUT /api/users/profile - Atualizar perfil do usuário
async function handleUpdateProfile(
  req: NextApiRequest,
  res: NextApiResponse<ProfileApiResponse>,
  user: Record<string, unknown>,
  currentProfile: UserProfile
) {
  try {
    const {
      nome,
      avatar_url,
      bio,
      website,
      company,
      location
    } = req.body;

    // Validar dados obrigatórios
    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nome deve ter pelo menos 2 caracteres'
      });
    }

    // Validar URL do website se fornecida
    if (website && !isValidUrl(website)) {
      return res.status(400).json({
        success: false,
        error: 'URL do website inválida'
      });
    }

    // Atualizar perfil
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update({
        nome: nome.trim(),
        avatar_url,
        bio: bio?.trim(),
        website: website?.trim(),
        company: company?.trim(),
        location: location?.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar perfil'
      });
    }

    return res.status(200).json({
      success: true,
      profile: updatedProfile,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// DELETE /api/users/profile - Deletar conta do usuário
async function handleDeleteAccount(
  req: NextApiRequest,
  res: NextApiResponse<ProfileApiResponse>,
  user: Record<string, unknown>
) {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Confirmação de senha é obrigatória'
      });
    }

    // Verificar se o usuário tem quizzes ativos
    const { data: activeQuizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'published');

    if (quizzesError) {
      console.error('Erro ao verificar quizzes:', quizzesError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar quizzes ativos'
      });
    }

    if (activeQuizzes && activeQuizzes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar conta com quizzes publicados. Arquive-os primeiro.'
      });
    }

    // Deletar dados do usuário em cascata
    // 1. Deletar respostas de quizzes
    await supabase
      .from('quiz_responses')
      .delete()
      .eq('user_responder_id', user.id);

    // 2. Deletar opções das questões
    const { data: userQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('user_id', user.id);

    if (userQuizzes && userQuizzes.length > 0) {
      const quizIds = userQuizzes.map(q => q.id);
      
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .in('quiz_id', quizIds);

      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        
        await supabase
          .from('options')
          .delete()
          .in('question_id', questionIds);
      }

      // 3. Deletar questões
      await supabase
        .from('questions')
        .delete()
        .in('quiz_id', quizIds);

      // 4. Deletar quizzes
      await supabase
        .from('quizzes')
        .delete()
        .eq('user_id', user.id);
    }

    // 5. Deletar perfil do usuário
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id);

    // 6. Deletar usuário do auth (isso deve ser feito por último)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id as string
    );

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar conta'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conta deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Função auxiliar para validar URL
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export default withErrorHandling(handler);