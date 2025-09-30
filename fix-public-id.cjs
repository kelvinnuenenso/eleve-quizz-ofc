require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPublicIdColumn() {
  console.log('🔧 Corrigindo coluna public_id...');
  
  try {
    // Tornar public_id nullable
    console.log('1️⃣ Tornando public_id nullable...');
    const { data: result1, error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.quizzes ALTER COLUMN public_id DROP NOT NULL;'
    });
    
    if (error1) {
      console.log('⚠️  Erro esperado (coluna já pode ser nullable):', error1.message);
    } else {
      console.log('✅ public_id agora é nullable');
    }

    // Testar criação de quiz
    console.log('\n2️⃣ Testando criação de quiz...');
    const testQuiz = {
      name: 'Quiz Teste - ' + Date.now(),
      description: 'Teste de criação',
      status: 'draft',
      settings: { theme: 'default' },
      questions: [],
      user_id: '00000000-0000-0000-0000-000000000000' // UUID fictício para teste
    };

    const { data: createdQuiz, error: createError } = await supabase
      .from('quizzes')
      .insert(testQuiz)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar quiz:', createError.message);
    } else {
      console.log('✅ Quiz criado com sucesso!');
      console.log('📋 Quiz criado:', {
        id: createdQuiz.id,
        name: createdQuiz.name,
        public_id: createdQuiz.public_id
      });

      // Limpar quiz de teste
      await supabase.from('quizzes').delete().eq('id', createdQuiz.id);
      console.log('🧹 Quiz de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixPublicIdColumn();