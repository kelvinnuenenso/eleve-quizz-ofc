const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Criar cliente Supabase com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentStructure() {
  try {
    console.log('🔍 Verificando estrutura atual do banco...');
    
    // Verificar quais tabelas existem
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['quizzes', 'quiz_quizzes']);
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return null;
    }
    
    console.log('📋 Tabelas encontradas:', tables.map(t => t.table_name));
    
    // Se a tabela quizzes já existe, verificar suas colunas
    if (tables.some(t => t.table_name === 'quizzes')) {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'quizzes');
      
      if (!columnsError) {
        console.log('📊 Colunas da tabela quizzes:', columns.map(c => `${c.column_name} (${c.data_type})`));
      }
    }
    
    return tables;
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
    return null;
  }
}

async function testQuizAccess() {
  try {
    console.log('🧪 Testando acesso à tabela de quizzes...');
    
    // Tentar acessar a tabela quizzes
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, name, status')
      .limit(1);
    
    if (quizzesError) {
      console.log('❌ Erro ao acessar tabela quizzes:', quizzesError.message);
      
      // Tentar acessar quiz_quizzes
      const { data: quizQuizzesData, error: quizQuizzesError } = await supabase
        .from('quiz_quizzes')
        .select('id, titulo, status')
        .limit(1);
      
      if (quizQuizzesError) {
        console.log('❌ Erro ao acessar tabela quiz_quizzes:', quizQuizzesError.message);
        return false;
      } else {
        console.log('✅ Tabela quiz_quizzes acessível:', quizQuizzesData?.length || 0, 'registros');
        return 'quiz_quizzes';
      }
    } else {
      console.log('✅ Tabela quizzes acessível:', quizzesData?.length || 0, 'registros');
      return 'quizzes';
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de acesso:', error.message);
    return false;
  }
}

async function createQuizzesTableIfNeeded() {
  try {
    console.log('🔧 Verificando se precisa criar/ajustar tabela quizzes...');
    
    // Verificar se a tabela quizzes existe
    const { data: quizzesExists } = await supabase
      .from('quizzes')
      .select('id')
      .limit(1);
    
    if (quizzesExists !== null) {
      console.log('✅ Tabela quizzes já existe e está acessível');
      return true;
    }
    
    // Se não existe, verificar se quiz_quizzes existe
    const { data: quizQuizzesData, error: quizQuizzesError } = await supabase
      .from('quiz_quizzes')
      .select('*')
      .limit(1);
    
    if (quizQuizzesError) {
      console.log('❌ Nenhuma tabela de quizzes encontrada. Criando estrutura básica...');
      
      // Criar tabela quizzes básica
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.quizzes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          public_id TEXT UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
          questions JSONB NOT NULL DEFAULT '[]'::JSONB,
          theme JSONB DEFAULT '{}'::JSONB,
          outcomes JSONB DEFAULT '{}'::JSONB,
          pixel_settings JSONB DEFAULT '{}'::JSONB,
          settings JSONB DEFAULT '{}'::JSONB,
          steps JSONB DEFAULT '[]'::JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          published_at TIMESTAMPTZ
        );
      `;
      
      // Usar uma abordagem diferente - criar via API
      console.log('⚠️ Não é possível criar tabelas via cliente Supabase. Estrutura precisa ser criada manualmente.');
      return false;
    }
    
    console.log('📋 Tabela quiz_quizzes encontrada. Dados precisam ser migrados para quizzes.');
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao verificar/criar tabela:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando verificação e correção da estrutura do banco...');
    
    // Verificar estrutura atual
    const tables = await checkCurrentStructure();
    if (!tables) {
      console.error('❌ Não foi possível verificar a estrutura do banco');
      return;
    }
    
    // Testar acesso às tabelas
    const accessResult = await testQuizAccess();
    
    if (accessResult === 'quizzes') {
      console.log('🎉 Tabela quizzes já está funcionando corretamente!');
      
      // Verificar se tem todas as colunas necessárias
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'quizzes');
      
      const requiredColumns = ['public_id', 'questions', 'outcomes', 'pixel_settings', 'settings', 'steps'];
      const existingColumns = columns?.map(c => c.column_name) || [];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Colunas faltando:', missingColumns);
        console.log('💡 Algumas funcionalidades podem não funcionar corretamente.');
      } else {
        console.log('✅ Todas as colunas necessárias estão presentes!');
      }
      
    } else if (accessResult === 'quiz_quizzes') {
      console.log('⚠️ Apenas quiz_quizzes está disponível. O código precisa ser atualizado ou a tabela renomeada.');
      console.log('💡 Solução: Renomear quiz_quizzes para quizzes e ajustar colunas.');
      
    } else {
      console.log('❌ Nenhuma tabela de quizzes está acessível.');
      console.log('💡 Solução: Criar estrutura de banco adequada.');
    }
    
    console.log('\n📋 Resumo da situação:');
    console.log('- Tabelas encontradas:', tables.map(t => t.table_name).join(', '));
    console.log('- Acesso funcional:', accessResult || 'Nenhum');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar verificação
main().then(() => {
  console.log('\n✨ Verificação concluída!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha na verificação:', error);
  process.exit(1);
});