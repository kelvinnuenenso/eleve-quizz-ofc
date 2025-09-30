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

async function createTestUser() {
  console.log('🚀 Criando usuário de teste...');
  
  const testUserId = randomUUID();
  const testUser = {
    id: testUserId,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    // Tentar criar na tabela auth.users (se existir)
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (authError) {
      console.log('⚠️ Não foi possível criar na tabela users:', authError.message);
      
      // Tentar criar na tabela profiles (se existir)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        console.log('⚠️ Não foi possível criar na tabela profiles:', profileError.message);
        console.log('📝 Usando ID de usuário existente do banco...');
        
        // Buscar um usuário existente
        const { data: existingUsers, error: fetchError } = await supabase
          .from('quizzes')
          .select('user_id')
          .limit(1);
        
        if (fetchError || !existingUsers || existingUsers.length === 0) {
          console.log('❌ Não foi possível encontrar usuário existente');
          return null;
        }
        
        console.log('✅ Usando usuário existente:', existingUsers[0].user_id);
        return existingUsers[0].user_id;
      } else {
        console.log('✅ Usuário criado na tabela profiles:', profile.id);
        return profile.id;
      }
    } else {
      console.log('✅ Usuário criado na tabela users:', authUser.id);
      return authUser.id;
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    return null;
  }
}

// Testar criação de quiz com usuário válido
async function testQuizCreationWithUser() {
  const userId = await createTestUser();
  
  if (!userId) {
    console.log('❌ Não foi possível obter ID de usuário válido');
    return;
  }
  
  console.log('\n🧪 Testando criação de quiz com usuário válido...');
  
  const testQuiz = {
    name: 'Quiz de Teste com Usuário',
    description: 'Descrição do quiz de teste',
    status: 'draft',
    public_id: randomUUID(),
    settings: { theme: 'default' },
    questions: [{
      id: randomUUID(),
      type: 'multiple_choice',
      title: 'Pergunta teste',
      options: ['A', 'B', 'C']
    }],
    user_id: userId
  };
  
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(testQuiz)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erro ao criar quiz:', error.message);
    } else {
      console.log('✅ Quiz criado com sucesso!');
      console.log('📋 ID do quiz:', data.id);
      console.log('👤 ID do usuário:', data.user_id);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

testQuizCreationWithUser().then(() => {
  console.log('\n✨ Teste concluído!');
}).catch(console.error);