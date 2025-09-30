require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProfilesStructure() {
  console.log('🔍 Verificando estrutura da tabela user_profiles...');
  
  try {
    // Buscar todos os registros para ver a estrutura
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao acessar user_profiles:', error.message);
      return;
    }
    
    console.log('✅ Tabela user_profiles acessível!');
    console.log('📊 Registros encontrados:', data.length);
    
    if (data.length > 0) {
      console.log('\n📋 Estrutura dos dados:');
      const firstRecord = data[0];
      console.log('Colunas disponíveis:', Object.keys(firstRecord));
      console.log('\n📄 Primeiro registro completo:');
      console.log(JSON.stringify(firstRecord, null, 2));
      
      if (data.length > 1) {
        console.log('\n📄 Segundo registro completo:');
        console.log(JSON.stringify(data[1], null, 2));
      }
    } else {
      console.log('📭 Nenhum registro encontrado na tabela');
    }
    
    // Tentar uma consulta SQL direta para ver a estrutura da tabela
    console.log('\n🔍 Tentando obter informações do schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_profiles' })
      .select('*');
    
    if (schemaError) {
      console.log('⚠️ Não foi possível obter schema via RPC:', schemaError.message);
    } else {
      console.log('✅ Schema obtido:', schemaData);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

checkUserProfilesStructure().catch(console.error);