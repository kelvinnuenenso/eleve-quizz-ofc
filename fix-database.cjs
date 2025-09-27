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

async function fixDatabase() {
  console.log('🔧 Verificando e corrigindo estrutura do banco de dados...');
  
  try {
    // 1. Verificar se a tabela user_profiles existe
    console.log('\n1. Verificando tabela user_profiles...');
    const { data: userProfilesCheck, error: userProfilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (userProfilesError) {
      console.log('❌ Tabela user_profiles não encontrada ou inacessível:', userProfilesError.message);
      
      // Tentar criar a tabela user_profiles com estrutura correta
      console.log('\n2. Criando tabela user_profiles...');
      const createUserProfilesSQL = `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          nome TEXT,
          email TEXT,
          display_name TEXT,
          username TEXT,
          plano TEXT DEFAULT 'free' CHECK (plano IN ('free', 'basic', 'premium', 'enterprise')),
          data_criacao TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        -- Habilitar RLS
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
        CREATE POLICY "Users can view their own profile" ON public.user_profiles
          FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
        CREATE POLICY "Users can update their own profile" ON public.user_profiles
          FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
        CREATE POLICY "Users can insert their own profile" ON public.user_profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `;
      
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql: createUserProfilesSQL
      });
      
      if (createError) {
        console.error('Erro ao criar tabela user_profiles:', createError);
      } else {
        console.log('✅ Tabela user_profiles criada com sucesso');
      }
    } else {
      console.log('✅ Tabela user_profiles existe e é acessível');
    }
    
    // 3. Verificar trigger de criação automática de perfil
    console.log('\n3. Verificando trigger de criação de perfil...');
    const createTriggerSQL = `
      -- Função para criar perfil automaticamente
      CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $$
      BEGIN
        INSERT INTO public.user_profiles (user_id, nome, email, display_name, username)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          split_part(NEW.email, '@', 1)
        )
        ON CONFLICT (user_id) DO NOTHING;
        RETURN NEW;
      END;
      $$;
      
      -- Recriar trigger
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
    `;
    
    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTriggerSQL
    });
    
    if (triggerError) {
      console.error('Erro ao criar trigger:', triggerError);
    } else {
      console.log('✅ Trigger de criação de perfil configurado');
    }
    
    // 4. Testar criação de usuário
    console.log('\n4. Testando criação de usuário...');
    const testEmail = `test-fix-${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Erro na criação do usuário:', authError.message);
    } else {
      console.log('✅ Usuário criado com sucesso:', authData.user.email);
      
      // Verificar se o perfil foi criado automaticamente
      setTimeout(async () => {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Perfil não foi criado automaticamente:', profileError.message);
        } else {
          console.log('✅ Perfil criado automaticamente:', profileData);
        }
      }, 1000);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

fixDatabase();