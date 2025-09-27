const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSupabase() {
  console.log('🧪 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar tabelas existentes
    console.log('\n1. Verificando tabelas...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Erro ao listar tabelas:', tablesError);
    } else {
      console.log('Tabelas encontradas:', tables.map(t => t.table_name));
    }
    
    // Teste 2: Tentar criar usuário simples
    console.log('\n2. Testando criação de usuário...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true
    });
    
    if (authError) {
      console.error('Erro na criação do usuário:', authError);
    } else {
      console.log('✅ Usuário criado com sucesso:', authData.user.id);
      
      // Teste 3: Verificar se existe tabela user_profiles
      console.log('\n3. Verificando tabela user_profiles...');
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (profileError) {
        console.error('Erro ao acessar user_profiles:', profileError);
        console.log('💡 Talvez a tabela user_profiles não exista ou não tenha políticas RLS configuradas');
      } else {
        console.log('✅ Tabela user_profiles acessível');
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testSupabase();