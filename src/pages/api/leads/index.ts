import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  origem: 'quiz' | 'landing_page' | 'manual' | 'import';
  quiz_id?: string;
  quiz_titulo?: string;
  pontuacao?: number;
  status: 'novo' | 'contatado' | 'qualificado' | 'convertido' | 'perdido';
  tags: string[];
  notas?: string;
  data_contato?: string;
  user_id: string;
  criado_em: string;
  atualizado_em: string;
}

interface LeadsApiResponse {
  success: boolean;
  leads?: Lead[];
  lead?: Lead;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
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
  res: NextApiResponse<LeadsApiResponse>
) {
  // Verificar autenticação
  const auth = await authenticate(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária'
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetLeads(req, res, auth.user.id as string);
    
    case 'POST':
      return handleCreateLead(req, res, auth.user.id as string);
    
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
}

// GET /api/leads - Listar leads do usuário
async function handleGetLeads(
  req: NextApiRequest,
  res: NextApiResponse<LeadsApiResponse>,
  userId: string
) {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      origem,
      search,
      tags,
      sortBy = 'criado_em',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Construir query base
    let query = supabase
      .from('leads')
      .select(`
        *,
        quizzes!leads_quiz_id_fkey (
          titulo
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (origem && origem !== 'all') {
      query = query.eq('origem', origem);
    }

    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,empresa.ilike.%${search}%`);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query = query.overlaps('tags', tagArray);
    }

    // Aplicar ordenação
    const validSortFields = ['criado_em', 'atualizado_em', 'nome', 'email', 'status', 'pontuacao'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'criado_em';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    query = query.order(sortField, { ascending: order === 'asc' });

    // Aplicar paginação
    query = query.range(offset, offset + limitNum - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar leads:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar leads'
      });
    }

    // Formatar leads
    const formattedLeads = leads?.map(lead => ({
      ...lead,
      quiz_titulo: lead.quizzes?.titulo || null
    })) || [];

    const totalPages = Math.ceil((count || 0) / limitNum);

    return res.status(200).json({
      success: true,
      leads: formattedLeads,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages,
      message: 'Leads obtidos com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// POST /api/leads - Criar novo lead
async function handleCreateLead(
  req: NextApiRequest,
  res: NextApiResponse<LeadsApiResponse>,
  userId: string
) {
  try {
    const {
      nome,
      email,
      telefone,
      empresa,
      cargo,
      origem = 'manual',
      quiz_id,
      pontuacao,
      status = 'novo',
      tags = [],
      notas
    } = req.body;

    // Validar dados obrigatórios
    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório e deve ter pelo menos 2 caracteres'
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email válido é obrigatório'
      });
    }

    // Validar origem
    const validOrigens = ['quiz', 'landing_page', 'manual', 'import'];
    if (!validOrigens.includes(origem)) {
      return res.status(400).json({
        success: false,
        error: 'Origem inválida'
      });
    }

    // Validar status
    const validStatus = ['novo', 'contatado', 'qualificado', 'convertido', 'perdido'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }

    // Verificar se o quiz existe (se fornecido)
    if (quiz_id) {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, titulo')
        .eq('id', quiz_id)
        .eq('user_id', userId)
        .single();

      if (quizError || !quiz) {
        return res.status(400).json({
          success: false,
          error: 'Quiz não encontrado'
        });
      }
    }

    // Verificar se já existe lead com este email
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('user_id', userId)
      .single();

    if (existingLead) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um lead com este email'
      });
    }

    // Criar lead
    const leadData = {
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      telefone: telefone?.trim() || null,
      empresa: empresa?.trim() || null,
      cargo: cargo?.trim() || null,
      origem,
      quiz_id: quiz_id || null,
      pontuacao: pontuacao || null,
      status,
      tags: Array.isArray(tags) ? tags : [],
      notas: notas?.trim() || null,
      user_id: userId,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select(`
        *,
        quizzes!leads_quiz_id_fkey (
          titulo
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao criar lead:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar lead'
      });
    }

    // Formatar resposta
    const formattedLead = {
      ...newLead,
      quiz_titulo: newLead.quizzes?.titulo || null
    };

    return res.status(201).json({
      success: true,
      lead: formattedLead,
      message: 'Lead criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);