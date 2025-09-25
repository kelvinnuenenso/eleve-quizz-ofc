import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';

interface QuizCompletedPayload {
  quiz_id: string;
  response_id: string;
  user_data: {
    nome?: string;
    email?: string;
    telefone?: string;
    empresa?: string;
    cargo?: string;
  };
  quiz_data: {
    titulo: string;
    pontuacao: number;
    total_questoes: number;
    acertos: number;
    tempo_gasto?: number;
  };
  metadata?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
    ip_address?: string;
    user_agent?: string;
  };
}

interface WebhookResponse {
  success: boolean;
  lead_id?: string;
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    const payload: QuizCompletedPayload = req.body;

    // Validar payload
    if (!payload.quiz_id || !payload.response_id) {
      return res.status(400).json({
        success: false,
        error: 'Quiz ID e Response ID são obrigatórios'
      });
    }

    // Verificar se o quiz existe
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, titulo, user_id, configuracoes')
      .eq('id', payload.quiz_id)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz não encontrado'
      });
    }

    // Verificar se a resposta existe
    const { data: response, error: responseError } = await supabase
      .from('quiz_responses')
      .select('id, dados_usuario')
      .eq('id', payload.response_id)
      .eq('quiz_id', payload.quiz_id)
      .single();

    if (responseError || !response) {
      return res.status(404).json({
        success: false,
        error: 'Resposta do quiz não encontrada'
      });
    }

    // Verificar se lead generation está habilitada para este quiz
    const configuracoes = quiz.configuracoes || {};
    if (!configuracoes.generate_leads) {
      return res.status(200).json({
        success: true,
        message: 'Lead generation não está habilitada para este quiz'
      });
    }

    // Extrair dados do usuário (priorizar payload, depois response)
    const userData = {
      ...response.dados_usuario,
      ...payload.user_data
    };

    // Validar se temos dados mínimos para criar um lead
    if (!userData.email && !userData.nome) {
      return res.status(400).json({
        success: false,
        error: 'Email ou nome são obrigatórios para gerar lead'
      });
    }

    // Verificar se já existe um lead com este email para este usuário
    let existingLead = null;
    if (userData.email) {
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', userData.email.toLowerCase())
        .eq('user_id', quiz.user_id)
        .single();
      
      existingLead = lead;
    }

    let leadId: string;

    if (existingLead) {
      // Atualizar lead existente
      const updateData: any = {
        quiz_id: payload.quiz_id,
        pontuacao: payload.quiz_data.pontuacao,
        status: determineLeadStatus(payload.quiz_data.pontuacao, payload.quiz_data.total_questoes),
        atualizado_em: new Date().toISOString()
      };

      // Atualizar dados se fornecidos
      if (userData.nome) updateData.nome = userData.nome;
      if (userData.telefone) updateData.telefone = userData.telefone;
      if (userData.empresa) updateData.empresa = userData.empresa;
      if (userData.cargo) updateData.cargo = userData.cargo;

      // Adicionar tags baseadas na performance
      const performanceTags = generatePerformanceTags(payload.quiz_data);
      const metadataTags = generateMetadataTags(payload.metadata);
      updateData.tags = [...performanceTags, ...metadataTags];

      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', existingLead.id)
        .select('id')
        .single();

      if (updateError) {
        throw updateError;
      }

      leadId = updatedLead.id;

    } else {
      // Criar novo lead
      const leadData = {
        nome: userData.nome || 'Lead do Quiz',
        email: userData.email?.toLowerCase() || `lead-${payload.response_id}@quiz.local`,
        telefone: userData.telefone || null,
        empresa: userData.empresa || null,
        cargo: userData.cargo || null,
        origem: 'quiz',
        quiz_id: payload.quiz_id,
        pontuacao: payload.quiz_data.pontuacao,
        status: determineLeadStatus(payload.quiz_data.pontuacao, payload.quiz_data.total_questoes),
        tags: [
          ...generatePerformanceTags(payload.quiz_data),
          ...generateMetadataTags(payload.metadata)
        ],
        notas: generateLeadNotes(payload),
        user_id: quiz.user_id,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };

      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert(leadData)
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      leadId = newLead.id;
    }

    // Atualizar estatísticas do quiz
    await updateQuizStats(payload.quiz_id);

    // Log da atividade
    await logLeadActivity(leadId, 'quiz_completed', {
      quiz_id: payload.quiz_id,
      response_id: payload.response_id,
      pontuacao: payload.quiz_data.pontuacao,
      tempo_gasto: payload.quiz_data.tempo_gasto
    });

    return res.status(200).json({
      success: true,
      lead_id: leadId,
      message: existingLead ? 'Lead atualizado com sucesso' : 'Lead criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao processar webhook de quiz completado:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Determinar status do lead baseado na performance
function determineLeadStatus(pontuacao: number, totalQuestoes: number): string {
  const percentual = (pontuacao / totalQuestoes) * 100;
  
  if (percentual >= 80) return 'qualificado';
  if (percentual >= 60) return 'novo';
  return 'novo';
}

// Gerar tags baseadas na performance
function generatePerformanceTags(quizData: QuizCompletedPayload['quiz_data']): string[] {
  const tags: string[] = [];
  const percentual = (quizData.pontuacao / quizData.total_questoes) * 100;
  
  if (percentual >= 90) tags.push('alta-performance');
  else if (percentual >= 70) tags.push('boa-performance');
  else if (percentual >= 50) tags.push('performance-media');
  else tags.push('baixa-performance');
  
  if (quizData.tempo_gasto) {
    if (quizData.tempo_gasto < 60) tags.push('rapido');
    else if (quizData.tempo_gasto > 300) tags.push('detalhista');
  }
  
  return tags;
}

// Gerar tags baseadas em metadata
function generateMetadataTags(metadata?: QuizCompletedPayload['metadata']): string[] {
  const tags: string[] = [];
  
  if (metadata?.utm_source) tags.push(`fonte-${metadata.utm_source}`);
  if (metadata?.utm_medium) tags.push(`meio-${metadata.utm_medium}`);
  if (metadata?.utm_campaign) tags.push(`campanha-${metadata.utm_campaign}`);
  
  return tags;
}

// Gerar notas para o lead
function generateLeadNotes(payload: QuizCompletedPayload): string {
  const notes: string[] = [];
  
  notes.push(`Quiz: ${payload.quiz_data.titulo}`);
  notes.push(`Pontuação: ${payload.quiz_data.pontuacao}/${payload.quiz_data.total_questoes} (${Math.round((payload.quiz_data.pontuacao / payload.quiz_data.total_questoes) * 100)}%)`);
  
  if (payload.quiz_data.tempo_gasto) {
    const minutos = Math.floor(payload.quiz_data.tempo_gasto / 60);
    const segundos = payload.quiz_data.tempo_gasto % 60;
    notes.push(`Tempo gasto: ${minutos}m ${segundos}s`);
  }
  
  if (payload.metadata?.utm_source) {
    notes.push(`Origem: ${payload.metadata.utm_source}`);
  }
  
  return notes.join('\n');
}

// Atualizar estatísticas do quiz
async function updateQuizStats(quizId: string) {
  try {
    // Buscar estatísticas atuais
    const { data: stats } = await supabase
      .from('quiz_stats')
      .select('*')
      .eq('quiz_id', quizId)
      .single();

    if (stats) {
      // Atualizar estatísticas existentes
      await supabase
        .from('quiz_stats')
        .update({
          leads_gerados: (stats.leads_gerados || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('quiz_id', quizId);
    } else {
      // Criar estatísticas iniciais
      await supabase
        .from('quiz_stats')
        .insert({
          quiz_id: quizId,
          leads_gerados: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas do quiz:', error);
  }
}

// Log de atividade do lead
async function logLeadActivity(leadId: string, activity: string, data: any) {
  try {
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: activity,
        activity_data: data,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Erro ao registrar atividade do lead:', error);
  }
}

export default withErrorHandling(handler);