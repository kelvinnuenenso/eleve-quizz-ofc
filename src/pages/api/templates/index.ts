import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';
import { UsageTracker } from '@/lib/usageTracker';

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

interface TemplatesApiResponse {
  success: boolean;
  template?: QuizTemplate;
  templates?: QuizTemplate[];
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Middleware para autenticação (opcional para GET)
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
  res: NextApiResponse<TemplatesApiResponse>
) {
  switch (req.method) {
    case 'GET':
      return handleGetTemplates(req, res);
    
    case 'POST':
      return handleCreateTemplate(req, res);
    
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
}

// GET /api/templates - Listar templates
async function handleGetTemplates(
  req: NextApiRequest,
  res: NextApiResponse<TemplatesApiResponse>
) {
  try {
    // Parâmetros de consulta
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    
    const {
      categoria,
      tags,
      search,
      sort = 'popular', // popular, recent, rating
      my_templates = 'false'
    } = req.query;

    let query = supabase
      .from('quiz_templates')
      .select(`
        *,
        user_profiles!quiz_templates_created_by_fkey (
          nome
        )
      `, { count: 'exact' });

    // Filtrar por templates públicos ou do usuário
    if (my_templates === 'true') {
      const auth = await authenticate(req);
      if (!auth) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária para ver seus templates'
        });
      }
      query = query.eq('created_by', auth.user.id);
    } else {
      query = query.eq('is_public', true);
    }

    // Aplicar filtros
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query = query.overlaps('tags', tagArray);
    }

    if (search) {
      query = query.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    // Aplicar ordenação
    switch (sort) {
      case 'recent':
        query = query.order('criado_em', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'popular':
      default:
        query = query.order('usage_count', { ascending: false });
        break;
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar templates:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar templates'
      });
    }

    // Formatar dados
    const formattedTemplates = templates?.map(template => ({
      ...template,
      creator_name: template.user_profiles?.nome || 'Usuário Anônimo'
    })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return res.status(200).json({
      success: true,
      templates: formattedTemplates,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      message: 'Templates obtidos com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// POST /api/templates - Criar novo template
async function handleCreateTemplate(
  req: NextApiRequest,
  res: NextApiResponse<TemplatesApiResponse>
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

    // Verificar limites de uso
    const canCreate = await UsageTracker.canCreateQuiz(user.id as string);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        error: 'Limite de templates atingido para seu plano'
      });
    }

    const {
      titulo,
      descricao,
      categoria,
      tags = [],
      is_public = false,
      template_data
    } = req.body;

    // Validar dados obrigatórios
    if (!titulo || titulo.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Título deve ter pelo menos 3 caracteres'
      });
    }

    if (!categoria) {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória'
      });
    }

    if (!template_data || !template_data.questions || !Array.isArray(template_data.questions)) {
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

    // Criar template
    const { data: template, error } = await supabase
      .from('quiz_templates')
      .insert({
        titulo: titulo.trim(),
        descricao: descricao?.trim(),
        categoria,
        tags: Array.isArray(tags) ? tags : [],
        is_public,
        created_by: user.id,
        template_data,
        usage_count: 0,
        rating: 0,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select(`
        *,
        user_profiles!quiz_templates_created_by_fkey (
          nome
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao criar template:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar template'
      });
    }

    // Incrementar contador de uso (templates criados)
    await UsageTracker.incrementUsage(user.id as string, 'quizzes', 1);

    // Formatar resposta
    const formattedTemplate = {
      ...template,
      creator_name: template.user_profiles?.nome || profile.nome
    };

    return res.status(201).json({
      success: true,
      template: formattedTemplate,
      message: 'Template criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar template:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);