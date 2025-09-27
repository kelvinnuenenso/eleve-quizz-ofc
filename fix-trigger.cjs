require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixTrigger() {
  console.log('🔧 Corrigindo trigger de criação de perfil de usuário...');

  try {
    // 1. Primeiro, vamos verificar a estrutura da tabela user_profiles
    console.log('1. Verificando estrutura da tabela user_profiles...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log('⚠️  Não foi possível verificar colunas:', columnsError.message);
    } else {
      console.log('✅ Colunas da tabela user_profiles:', columns?.map(c => c.column_name));
    }

    // 2. Testar criação de usuário diretamente
    console.log('2. Testando criação de usuário...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Usuário Teste',
        nome: 'Usuário Teste'
      }
    });

    if (userError) {
      console.error('❌ Erro na criação do usuário:', userError.message);
      console.error('Detalhes do erro:', userError);
      return;
    }

    console.log('✅ Usuário criado com sucesso:', userData.user.id);

    // 3. Verificar se o perfil foi criado automaticamente
    console.log('3. Verificando criação automática do perfil...');
    
    // Aguardar um pouco para o trigger executar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️  Perfil não foi criado automaticamente:', profileError.message);
      
      // 4. Tentar criar o perfil manualmente
      console.log('4. Criando perfil manualmente...');
      const { data: manualProfile, error: manualError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userData.user.id,
          nome: userData.user.user_metadata?.full_name || userData.user.user_metadata?.nome || userData.user.email.split('@')[0],
          email: userData.user.email,
          plano: 'free'
        })
        .select()
        .single();

      if (manualError) {
        console.error('❌ Erro ao criar perfil manualmente:', manualError.message);
        console.error('Detalhes:', manualError);
      } else {
        console.log('✅ Perfil criado manualmente:', manualProfile);
      }
    } else {
      console.log('✅ Perfil criado automaticamente:', profileData);
    }

    // 5. Limpar usuário de teste
    console.log('5. Limpando usuário de teste...');
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Usuário de teste removido');

    console.log('\n🎉 Teste de criação de usuário concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixTrigger();