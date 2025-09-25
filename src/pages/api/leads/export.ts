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
  origem: string;
  quiz_titulo?: string;
  pontuacao?: number;
  status: string;
  tags: string[];
  notas?: string;
  data_contato?: string;
  criado_em: string;
  atualizado_em: string;
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

// Função para converter array de objetos em CSV
function convertToCSV(data: Lead[]): string {
  if (data.length === 0) {
    return 'Nome,Email,Telefone,Empresa,Cargo,Origem,Quiz,Pontuação,Status,Tags,Notas,Data Contato,Criado em,Atualizado em\n';
  }

  // Cabeçalhos
  const headers = [
    'Nome',
    'Email',
    'Telefone',
    'Empresa',
    'Cargo',
    'Origem',
    'Quiz',
    'Pontuação',
    'Status',
    'Tags',
    'Notas',
    'Data Contato',
    'Criado em',
    'Atualizado em'
  ];

  // Função para escapar valores CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Se contém vírgula, quebra de linha ou aspas, precisa ser escapado
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Criar linhas CSV
  const csvRows = [
    headers.join(','),
    ...data.map(lead => [
      escapeCSV(lead.nome),
      escapeCSV(lead.email),
      escapeCSV(lead.telefone || ''),
      escapeCSV(lead.empresa || ''),
      escapeCSV(lead.cargo || ''),
      escapeCSV(lead.origem),
      escapeCSV(lead.quiz_titulo || ''),
      escapeCSV(lead.pontuacao || ''),
      escapeCSV(lead.status),
      escapeCSV(lead.tags.join('; ')),
      escapeCSV(lead.notas || ''),
      escapeCSV(lead.data_contato ? formatDate(lead.data_contato) : ''),
      escapeCSV(formatDate(lead.criado_em)),
      escapeCSV(formatDate(lead.atualizado_em))
    ].join(','))
  ];

  return csvRows.join('\n');
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  // Verificar autenticação
  const auth = await authenticate(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária'
    });
  }

  const userId = auth.user.id as string;

  try {
    const {
      status,
      origem,
      search,
      tags,
      dateFrom,
      dateTo,
      format = 'csv'
    } = req.query;

    // Validar formato
    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        error: 'Apenas formato CSV é suportado'
      });
    }

    // Construir query
    let query = supabase
      .from('leads')
      .select(`
        *,
        quizzes!leads_quiz_id_fkey (
          titulo
        )
      `)
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

    if (dateFrom) {
      query = query.gte('criado_em', dateFrom);
    }

    if (dateTo) {
      query = query.lte('criado_em', dateTo);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('criado_em', { ascending: false });

    const { data: leads, error } = await query;

    if (error) {
      console.error('Erro ao buscar leads para exportação:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar leads'
      });
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum lead encontrado para exportação'
      });
    }

    // Formatar leads
    const formattedLeads: Lead[] = leads.map(lead => ({
      ...lead,
      quiz_titulo: lead.quizzes?.titulo || null
    }));

    // Converter para CSV
    const csvContent = convertToCSV(formattedLeads);

    // Definir nome do arquivo
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leads-export-${timestamp}.csv`;

    // Configurar headers para download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Adicionar BOM para UTF-8 (para Excel reconhecer acentos)
    const csvWithBOM = '\uFEFF' + csvContent;

    return res.status(200).send(csvWithBOM);

  } catch (error) {
    console.error('Erro ao exportar leads:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);