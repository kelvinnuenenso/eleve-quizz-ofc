require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthTables() {
  console.log('🚀 Testando tabelas de autenticação...');
  console.log('🔗 URL do Supabase:', supabaseUrl);
  
  // Testar tabela user_profiles
  console.log('\n1️⃣ Testando tabela "user_profiles"...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao acessar "user_profiles":', error.message);
    } else {
      console.log('✅ Tabela "user_profiles" acessível!');
      console.log('📊 Registros encontrados:', data.length);
      if (data.length > 0) {
        console.log('📋 Exemplo de registro:', {
          user_id: data[0].user_id,
          email: data[0].email,
          name: data[0].name,
          plan: data[0].plan
        });
      }
    }
  } catch (error) {
    console.log('❌ Erro inesperado ao acessar "user_profiles":', error.message);
  }
  
  // Testar tabela auth.users (se acessível)
  console.log('\n2️⃣ Testando tabela "auth.users"...');
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Erro ao acessar "auth.users":', error.message);
    } else {
      console.log('✅ Tabela "auth.users" acessível!');
      console.log('📊 Usuários encontrados:', data.users.length);
      if (data.users.length > 0) {
        console.log('📋 Exemplo de usuário:', {
          id: data.users[0].id,
          email: data.users[0].email,
          created_at: data.users[0].created_at
        });
      }
    }
  } catch (error) {
    console.log('❌ Erro inesperado ao acessar "auth.users":', error.message);
  }
  
  // Testar criação de perfil de usuário
  console.log('\n3️⃣ Testando criação de perfil de usuário...');
  const testUserId = randomUUID();
  const testProfile = {
    user_id: testUserId,
    email: 'test@example.com',
    name: 'Usuário Teste',
    plan: 'starter',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erro ao criar perfil de usuário:', error.message);
    } else {
      console.log('✅ Perfil de usuário criado com sucesso!');
      console.log('📋 ID do perfil:', data.user_id);
      console.log('👤 Email:', data.email);
      
      // Limpar o perfil de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', testUserId);
      console.log('🧹 Perfil de teste removido');
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar perfil:', error.message);
  }
  
  console.log('\n📋 Resumo:');
  console.log('- Se "user_profiles" funciona: Sistema de perfis está operacional');
  console.log('- Se "auth.users" funciona: Autenticação Supabase está configurada');
  console.log('- Se criação funciona: Banco está pronto para novos usuários');
  
  console.log('\n✨ Teste concluído!');
}

testAuthTables().catch(console.error);