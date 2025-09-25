import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { PlanType } from '@/lib/planManager';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    plan: PlanType;
    plan_expires_at?: string;
  };
  token?: string;
  refresh_token?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      error: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const { email, password }: LoginRequest = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
        error: 'MISSING_FIELDS'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido',
        error: 'INVALID_EMAIL'
      });
    }

    // Fazer login no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Tratar erros específicos do Supabase
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos',
          error: 'INVALID_CREDENTIALS'
        });
      }

      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({
          success: false,
          message: 'Email não confirmado. Verifique sua caixa de entrada.',
          error: 'EMAIL_NOT_CONFIRMED'
        });
      }

      return res.status(400).json({
        success: false,
        message: authError.message || 'Erro ao fazer login',
        error: 'AUTH_ERROR'
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao fazer login',
        error: 'LOGIN_FAILED'
      });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // Se não encontrar perfil, criar um básico
    let userProfile = profile;
    if (!profile) {
      const newProfile = {
        user_id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.full_name || authData.user.email!.split('@')[0],
        plan: 'starter' as PlanType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      userProfile = createdProfile || newProfile;
    }

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        name: userProfile?.name || authData.user.user_metadata?.full_name || authData.user.email!.split('@')[0],
        plan: userProfile?.plan || 'starter',
        plan_expires_at: userProfile?.plan_expires_at,
      },
      token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}