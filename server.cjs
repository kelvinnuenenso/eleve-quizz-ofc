const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
  console.error('Configure: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://nome-do-projeto.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Endpoint POST /api/quiz/respostas - Recebe e salva respostas
app.post('/api/quiz/respostas', async (req, res) => {
  const { quiz_id, usuario_id, respostas, pontuacao } = req.body;

  if (!quiz_id || !respostas) {
    return res.status(400).json({ 
      error: 'quiz_id e respostas são obrigatórios' 
    });
  }

  try {
    // Buscar o quiz para validar se existe
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('public_id', quiz_id)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Salvar resposta na tabela quiz_results
    const { data: result, error: insertError } = await supabase
      .from('quiz_results')
      .insert({
        quiz_id: quiz.id,
        user_id: usuario_id || null,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        score: pontuacao || 0,
        answers: respostas,
        meta: {
          api_version: 'legacy_compat',
          migrated_from: 'sqlite'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao salvar resposta:', insertError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Registrar evento de analytics
    await supabase
      .from('analytics_events')
      .insert({
        quiz_id: quiz.id,
        session_id: result.session_id,
        user_id: usuario_id || null,
        event_type: 'complete',
        event_data: {
          score: pontuacao || 0,
          total_questions: Object.keys(respostas).length,
          source: 'legacy_api'
        }
      });

    res.json({ 
      success: true, 
      id: result.id,
      message: 'Resposta salva com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao processar resposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint GET /api/quiz/resultados - Retorna estatísticas
app.get('/api/quiz/resultados', async (req, res) => {
  const { quiz_id } = req.query;

  try {
    let query = supabase
      .from('quiz_results')
      .select(`
        quiz_id,
        score,
        created_at,
        quizzes!inner(
          public_id,
          name
        )
      `);
    
    if (quiz_id) {
      // Buscar pelo public_id do quiz
      query = query.eq('quizzes.public_id', quiz_id);
    }

    const { data: results, error } = await query;

    if (error) {
      console.error('Erro ao buscar resultados:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Agrupar resultados por quiz
    const statsMap = new Map();
    
    results.forEach(result => {
      const quizPublicId = result.quizzes.public_id;
      
      if (!statsMap.has(quizPublicId)) {
        statsMap.set(quizPublicId, {
          quiz_id: quizPublicId,
          scores: [],
          quiz_name: result.quizzes.name
        });
      }
      
      statsMap.get(quizPublicId).scores.push(result.score);
    });

    // Calcular estatísticas
    const resultados = Array.from(statsMap.values()).map(stats => {
      const scores = stats.scores;
      const total_tentativas = scores.length;
      const pontuacao_media = total_tentativas > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / total_tentativas 
        : 0;
      const pontuacao_maxima = total_tentativas > 0 ? Math.max(...scores) : 0;
      const pontuacao_minima = total_tentativas > 0 ? Math.min(...scores) : 0;

      return {
        quiz_id: stats.quiz_id,
        total_tentativas,
        pontuacao_media: Math.round(pontuacao_media * 100) / 100,
        pontuacao_maxima,
        pontuacao_minima
      };
    });

    res.json({
      success: true,
      resultados
    });

  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint GET /api/quiz/respostas/:quiz_id - Buscar respostas específicas
app.get('/api/quiz/respostas/:quiz_id', async (req, res) => {
  const { quiz_id } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  try {
    // Buscar respostas pelo public_id do quiz
    const { data: results, error } = await supabase
      .from('quiz_results')
      .select(`
        id,
        session_id,
        user_id,
        answers,
        score,
        created_at,
        quizzes!inner(
          public_id
        )
      `)
      .eq('quizzes.public_id', quiz_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Erro ao buscar respostas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Formatar respostas para compatibilidade com API antiga
    const respostas = results.map(result => ({
      id: result.id,
      quiz_id: quiz_id,
      usuario_id: result.user_id,
      respostas: result.answers,
      pontuacao: result.score,
      data_criacao: result.created_at
    }));

    res.json({
      success: true,
      respostas
    });

  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Testar conexão com Supabase
    const { data, error } = await supabase
      .from('quizzes')
      .select('count')
      .limit(1);

    const dbStatus = error ? 'Erro na conexão' : 'Supabase conectado';
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Erro na conexão com Supabase',
      error: error.message
    });
  }
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'POST /api/quiz/respostas',
      'GET /api/quiz/resultados',
      'GET /api/quiz/respostas/:quiz_id',
      'GET /api/health'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor da API rodando na porta ${PORT}`);
  console.log(`📊 Endpoints disponíveis:`);
  console.log(`   POST /api/quiz/respostas - Salvar respostas`);
  console.log(`   GET  /api/quiz/resultados - Obter estatísticas`);
  console.log(`   GET  /api/quiz/respostas/:quiz_id - Buscar respostas específicas`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`🔗 Conectado ao Supabase: ${supabaseUrl}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  console.log('✅ Servidor encerrado com sucesso.');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});