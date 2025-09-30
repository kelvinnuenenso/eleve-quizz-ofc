require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura da tabela quizzes...');
  
  try {
    // Verificar colunas da tabela quizzes
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'quizzes')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('❌ Erro ao verificar estrutura:', error.message);
      return;
    }

    console.log('📋 Estrutura da tabela quizzes:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    // Verificar se public_id tem constraint NOT NULL
    const publicIdColumn = columns.find(col => col.column_name === 'public_id');
    if (publicIdColumn) {
      console.log(`\n🔍 Coluna public_id: nullable=${publicIdColumn.is_nullable}, default=${publicIdColumn.column_default || 'none'}`);
      
      if (publicIdColumn.is_nullable === 'NO' && !publicIdColumn.column_default) {
        console.log('⚠️  PROBLEMA: public_id é NOT NULL mas não tem valor padrão!');
        console.log('💡 Solução: Tornar public_id nullable ou definir valor padrão');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTableStructure();