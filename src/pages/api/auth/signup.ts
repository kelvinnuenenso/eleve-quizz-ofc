import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { PlanType } from '@/lib/planManager';

interface SignUpRequest {
  email: string;
  password: string;
  fullName?: string;
  plan?: PlanType;
}

interface SignUpResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    plan: PlanType;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignUpResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      error: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const { email, password, fullName, plan = 'starter' }: SignUpRequest = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
        error: 'MISSING_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres',
        error: 'WEAK_PASSWORD'
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

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Tratar erros específicos do Supabase
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está cadastrado',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }

      return res.status(400).json({
        success: false,
        message: authError.message || 'Erro ao criar conta',
        error: 'AUTH_ERROR'
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao criar usuário',
        error: 'USER_CREATION_FAILED'
      });
    }

    // Criar perfil do usuário na tabela user_profiles
    const userProfile = {
      user_id: authData.user.id,
      email: authData.user.email!,
      name: fullName || authData.user.email!.split('@')[0],
      plan: plan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(userProfile);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Não falhar se o perfil não for criado, pois o usuário já foi criado
    }

    // Resposta de sucesso
    return res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu email para confirmar.',
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        name: fullName || authData.user.email!.split('@')[0],
        plan: plan,
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}