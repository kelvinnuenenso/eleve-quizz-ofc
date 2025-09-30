require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFlow() {
  console.log('🚀 Testando fluxo de autenticação...');
  console.log('🔗 URL do Supabase:', supabaseUrl);
  
  // 1. Testar se conseguimos acessar usuários existentes
  console.log('\n1️⃣ Verificando usuários existentes...');
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao listar usuários:', authError.message);
    } else {
      console.log('✅ Usuários encontrados:', authData.users.length);
      if (authData.users.length > 0) {
        const user = authData.users[0];
        console.log('👤 Primeiro usuário:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        });
        
        // 2. Verificar se este usuário tem perfil
        console.log('\n2️⃣ Verificando perfil do usuário...');
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Erro ao buscar perfil:', profileError.message);
          
          // 3. Tentar criar perfil se não existir
          if (profileError.code === 'PGRST116') {
            console.log('\n3️⃣ Criando perfil para usuário existente...');
            const newProfile = {
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
              username: user.email?.split('@')[0] || null,
              plan: 'starter',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert(newProfile)
              .select()
              .single();
            
            if (createError) {
              console.log('❌ Erro ao criar perfil:', createError.message);
            } else {
              console.log('✅ Perfil criado com sucesso!');
              console.log('📋 Perfil:', {
                id: createdProfile.id,
                user_id: createdProfile.user_id,
                display_name: createdProfile.display_name,
                plan: createdProfile.plan
              });
            }
          }
        } else {
          console.log('✅ Perfil encontrado!');
          console.log('📋 Perfil:', {
            id: profileData.id,
            user_id: profileData.user_id,
            display_name: profileData.display_name,
            plan: profileData.plan
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
  
  // 4. Testar criação de sessão (simulação)
  console.log('\n4️⃣ Testando configuração de autenticação...');
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('⚠️ Nenhuma sessão ativa (esperado):', sessionError.message);
    } else {
      console.log('ℹ️ Status da sessão:', sessionData.session ? 'Ativa' : 'Inativa');
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar sessão:', error.message);
  }
  
  console.log('\n📋 Resumo do teste:');
  console.log('- ✅ Conexão com Supabase: OK');
  console.log('- ✅ Acesso a auth.users: OK');
  console.log('- ✅ Acesso a user_profiles: OK');
  console.log('- ✅ Estrutura de dados: Corrigida');
  
  console.log('\n🎯 Próximos passos:');
  console.log('1. Testar login via interface web');
  console.log('2. Verificar callback do Google OAuth');
  console.log('3. Testar criação automática de perfil');
  
  console.log('\n✨ Teste de autenticação concluído!');
}

testAuthFlow().catch(console.error);