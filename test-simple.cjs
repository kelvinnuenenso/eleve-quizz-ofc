const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSimple() {
  console.log('🧪 Teste simples do Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Service Key presente:', !!supabaseServiceKey);
  
  try {
    // Teste básico: verificar se conseguimos fazer uma query simples
    console.log('\n1. Testando query básica...');
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Erro na query básica:', error);
    } else {
      console.log('✅ Query básica funcionou');
    }
    
    // Teste 2: Tentar criar usuário com dados mínimos
    console.log('\n2. Testando criação de usuário com dados mínimos...');
    const testEmail = `simple-test-${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456'
    });
    
    if (authError) {
      console.error('Erro detalhado:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        details: authError
      });
    } else {
      console.log('✅ Usuário criado:', authData.user.email);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testSimple();