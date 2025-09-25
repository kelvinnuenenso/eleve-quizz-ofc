import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { UsageTracker, UsageStats, UsageWarning } from '@/lib/usageTracker';
import { withErrorHandling } from '@/lib/errorHandling';

interface UsageStatsApiResponse {
  success: boolean;
  usage?: UsageStats;
  warnings?: UsageWarning[];
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsageStatsApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

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
    // Buscar estatísticas de uso
    const usage = await UsageTracker.getUserUsage(user.id);
    
    // Buscar avisos de uso
    const warnings = await UsageTracker.getUsageWarnings(user.id);

    return res.status(200).json({
      success: true,
      usage,
      warnings,
      message: 'Estatísticas de uso obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);