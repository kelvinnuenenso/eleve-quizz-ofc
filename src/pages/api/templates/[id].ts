import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';

interface QuizTemplate {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  tags: string[];
  is_public: boolean;
  created_by: string;
  creator_name?: string;
  usage_count: number;
  rating: number;
  template_data: {
    questions: Array<{
      enunciado: string;
      tipo: 'multiple_choice' | 'single_choice' | 'text' | 'rating' | 'boolean';
      options?: Array<{
        texto: string;
        correta?: boolean;
      }>;
    }>;
    settings?: {
      tema?: string;
      timeLimit?: number;
      showResults?: boolean;
      allowRetake?: boolean;
    };
  };
  criado_em: string;
  atualizado_em: string;
}

interface TemplateApiResponse {
  success: boolean;
  template?: QuizTemplate;
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
  res: NextApiResponse<TemplateApiResponse>
) {
  const { id: templateId } = req.query;

  if (!templateId || typeof templateId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'ID do template é obrigatório'
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetTemplate(req, res, templateId);
    
    case 'PUT':
      return handleUpdateTemplate(req, res, templateId);
    
    case 'DELETE':
      return handleDeleteTemplate(req, res, templateId);
    
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
}

// GET /api/templates/[id] - Obter template específico
async function handleGetTemplate(
  req: NextApiRequest,
  res: NextApiResponse<TemplateApiResponse>,
  templateId: string
) {
  try {
    // Buscar template
    const { data: template, error } = await supabase
      .from('quiz_templates')
      .select(`
        *,
        user_profiles!quiz_templates_created_by_fkey (
          nome
        )
      `)
      .eq('id', templateId)
      .single();

    if (error || !template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    // Verificar se o template é público ou se o usuário é o criador
    if (!template.is_public) {
      const auth = await authenticate(req);
      if (!auth || auth.user.id !== template.created_by) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }
    }

    // Incrementar contador de uso
    await supabase
      .from('quiz_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId);

    // Formatar resposta
    const formattedTemplate = {
      ...template,
      creator_name: template.user_profiles?.nome || 'Usuário Anônimo'
    };

    return res.status(200).json({
      success: true,
      template: formattedTemplate,
      message: 'Template obtido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// PUT /api/templates/[id] - Atualizar template
async function handleUpdateTemplate(
  req: NextApiRequest,
  res: NextApiResponse<TemplateApiResponse>,
  templateId: string
) {
  try {
    // Verificar autenticação
    const auth = await authenticate(req);
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária'
      });
    }

    const { user, profile } = auth;

    // Verificar se o template existe e pertence ao usuário
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('quiz_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    if (existingTemplate.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const {
      titulo,
      descricao,
      categoria,
      tags,
      is_public,
      template_data
    } = req.body;

    // Validar dados se fornecidos
    if (titulo !== undefined && titulo.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Título deve ter pelo menos 3 caracteres'
      });
    }

    if (template_data !== undefined) {
      if (!template_data.questions || !Array.isArray(template_data.questions)) {
        return res.status(400).json({
          success: false,
          error: 'Dados do template são obrigatórios'
        });
      }

      if (template_data.questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Template deve ter pelo menos uma questão'
        });
      }

      // Validar questões
      for (const question of template_data.questions) {
        if (!question.enunciado || question.enunciado.trim().length < 5) {
          return res.status(400).json({
            success: false,
            error: 'Todas as questões devem ter enunciado com pelo menos 5 caracteres'
          });
        }

        if (!['multiple_choice', 'single_choice', 'text', 'rating', 'boolean'].includes(question.tipo)) {
          return res.status(400).json({
            success: false,
            error: 'Tipo de questão inválido'
          });
        }

        // Validar opções para questões de múltipla escolha
        if (['multiple_choice', 'single_choice', 'boolean'].includes(question.tipo)) {
          if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
            return res.status(400).json({
              success: false,
              error: `Questões do tipo ${question.tipo} devem ter pelo menos 2 opções`
            });
          }

          const hasCorrectAnswer = question.options.some(opt => opt.correta);
          if (!hasCorrectAnswer && question.tipo !== 'text' && question.tipo !== 'rating') {
            return res.status(400).json({
              success: false,
              error: 'Questões devem ter pelo menos uma resposta correta'
            });
          }
        }
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      atualizado_em: new Date().toISOString()
    };

    if (titulo !== undefined) updateData.titulo = titulo.trim();
    if (descricao !== undefined) updateData.descricao = descricao?.trim();
    if (categoria !== undefined) updateData.categoria = categoria;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (is_public !== undefined) updateData.is_public = is_public;
    if (template_data !== undefined) updateData.template_data = template_data;

    // Atualizar template
    const { data: updatedTemplate, error } = await supabase
      .from('quiz_templates')
      .update(updateData)
      .eq('id', templateId)
      .select(`
        *,
        user_profiles!quiz_templates_created_by_fkey (
          nome
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar template:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar template'
      });
    }

    // Formatar resposta
    const formattedTemplate = {
      ...updatedTemplate,
      creator_name: updatedTemplate.user_profiles?.nome || profile.nome
    };

    return res.status(200).json({
      success: true,
      template: formattedTemplate,
      message: 'Template atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// DELETE /api/templates/[id] - Deletar template
async function handleDeleteTemplate(
  req: NextApiRequest,
  res: NextApiResponse<TemplateApiResponse>,
  templateId: string
) {
  try {
    // Verificar autenticação
    const auth = await authenticate(req);
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária'
      });
    }

    const { user } = auth;

    // Verificar se o template existe e pertence ao usuário
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('quiz_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    if (existingTemplate.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    // Verificar se o template está sendo usado (opcional - implementar lógica de negócio)
    if (existingTemplate.usage_count > 0 && existingTemplate.is_public) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar template público que já foi usado'
      });
    }

    // Deletar template
    const { error } = await supabase
      .from('quiz_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Erro ao deletar template:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar template'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Template deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);