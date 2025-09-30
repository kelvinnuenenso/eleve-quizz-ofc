const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Criar cliente Supabase com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testQuizTables() {
  console.log('🧪 Testando acesso às tabelas de quizzes...');
  
  // Teste 1: Tentar acessar tabela 'quizzes'
  console.log('\n1️⃣ Testando tabela "quizzes"...');
  try {
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, name, status, created_at')
      .limit(5);
    
    if (quizzesError) {
      console.log('❌ Erro ao acessar "quizzes":', quizzesError.message);
    } else {
      console.log('✅ Tabela "quizzes" acessível!');
      console.log('📊 Registros encontrados:', quizzesData?.length || 0);
      if (quizzesData && quizzesData.length > 0) {
        console.log('📋 Exemplo de registro:', {
          id: quizzesData[0].id,
          name: quizzesData[0].name,
          status: quizzesData[0].status
        });
      }
    }
  } catch (error) {
    console.log('💥 Erro inesperado ao testar "quizzes":', error.message);
  }
  
  // Teste 2: Tentar acessar tabela 'quiz_quizzes'
  console.log('\n2️⃣ Testando tabela "quiz_quizzes"...');
  try {
    const { data: quizQuizzesData, error: quizQuizzesError } = await supabase
      .from('quiz_quizzes')
      .select('id, titulo, status, criado_em')
      .limit(5);
    
    if (quizQuizzesError) {
      console.log('❌ Erro ao acessar "quiz_quizzes":', quizQuizzesError.message);
    } else {
      console.log('✅ Tabela "quiz_quizzes" acessível!');
      console.log('📊 Registros encontrados:', quizQuizzesData?.length || 0);
      if (quizQuizzesData && quizQuizzesData.length > 0) {
        console.log('📋 Exemplo de registro:', {
          id: quizQuizzesData[0].id,
          titulo: quizQuizzesData[0].titulo,
          status: quizQuizzesData[0].status
        });
      }
    }
  } catch (error) {
    console.log('💥 Erro inesperado ao testar "quiz_quizzes":', error.message);
  }
  
  // Teste 3: Tentar criar um quiz de teste na tabela que funcionar
  console.log('\n3️⃣ Testando criação de quiz...');
  
  // Primeiro tentar na tabela quizzes
  try {
    const testQuiz = {
      name: 'Quiz Teste - ' + Date.now(),
      description: 'Teste de criação',
      status: 'draft',
      public_id: require('crypto').randomUUID(),
      settings: { theme: 'default' },
      questions: [],
      user_id: '00000000-0000-0000-0000-000000000000'
    };
    
    const { data: createData, error: createError } = await supabase
      .from('quizzes')
      .insert([testQuiz])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar quiz na tabela "quizzes":', createError.message);
      
      // Se falhou, tentar na quiz_quizzes
      console.log('🔄 Tentando criar na tabela "quiz_quizzes"...');
      
      const testQuizAlt = {
        titulo: 'Quiz de Teste - ' + new Date().toISOString(),
        descricao: 'Quiz criado para testar a estrutura do banco',
        status: 'draft',
        tema: {}
      };
      
      const { data: createDataAlt, error: createErrorAlt } = await supabase
        .from('quiz_quizzes')
        .insert([testQuizAlt])
        .select()
        .single();
      
      if (createErrorAlt) {
        console.log('❌ Erro ao criar quiz na tabela "quiz_quizzes":', createErrorAlt.message);
      } else {
        console.log('✅ Quiz criado com sucesso na tabela "quiz_quizzes"!');
        console.log('🆔 ID do quiz:', createDataAlt.id);
        
        // Limpar o quiz de teste
        await supabase.from('quiz_quizzes').delete().eq('id', createDataAlt.id);
        console.log('🧹 Quiz de teste removido');
      }
      
    } else {
      console.log('✅ Quiz criado com sucesso na tabela "quizzes"!');
      console.log('🆔 ID do quiz:', createData.id);
      
      // Limpar o quiz de teste
      await supabase.from('quizzes').delete().eq('id', createData.id);
      console.log('🧹 Quiz de teste removido');
    }
    
  } catch (error) {
    console.log('💥 Erro inesperado ao testar criação:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando teste das tabelas de quizzes...');
    console.log('🔗 URL do Supabase:', supabaseUrl);
    
    await testQuizTables();
    
    console.log('\n📋 Resumo:');
    console.log('- Se "quizzes" funciona: A aplicação deve funcionar normalmente');
    console.log('- Se apenas "quiz_quizzes" funciona: Precisa renomear tabela ou atualizar código');
    console.log('- Se nenhuma funciona: Precisa criar estrutura do banco');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar teste
main().then(() => {
  console.log('\n✨ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});