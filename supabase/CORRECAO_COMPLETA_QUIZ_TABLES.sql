-- ============================================
-- CORREÇÃO COMPLETA PARA SALVAR E PUBLICAR QUIZZES
-- Execute este script COMPLETO no SQL Editor do Supabase
-- Data: 2025-10-24
-- ============================================

-- PARTE 1: VERIFICAR E CORRIGIR TABELA QUIZZES
-- ============================================

-- Adicionar coluna redirect_settings se não existir
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS redirect_settings JSONB DEFAULT '{}'::JSONB;

-- Verificar se as colunas JSONB existem e têm valores padrão corretos
ALTER TABLE public.quizzes 
  ALTER COLUMN questions SET DEFAULT '[]'::JSONB,
  ALTER COLUMN theme SET DEFAULT '{}'::JSONB,
  ALTER COLUMN outcomes SET DEFAULT '{}'::JSONB,
  ALTER COLUMN pixel_settings SET DEFAULT '{}'::JSONB,
  ALTER COLUMN settings SET DEFAULT '{}'::JSONB,
  ALTER COLUMN redirect_settings SET DEFAULT '{}'::JSONB;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_public_id ON public.quizzes(public_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_redirect_settings ON public.quizzes USING GIN (redirect_settings);

-- PARTE 2: CRIAR/ATUALIZAR TABELA QUIZ_STEPS
-- ============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.quiz_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  data JSONB DEFAULT '{}'::JSONB,
  components JSONB DEFAULT '[]'::JSONB,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar coluna components se não existir (para migrações antigas)
ALTER TABLE public.quiz_steps 
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]'::JSONB;

-- Atualizar valores padrão
ALTER TABLE public.quiz_steps 
  ALTER COLUMN data SET DEFAULT '{}'::JSONB,
  ALTER COLUMN components SET DEFAULT '[]'::JSONB;

-- REMOVER constraint antigo de type
ALTER TABLE public.quiz_steps 
  DROP CONSTRAINT IF EXISTS quiz_steps_type_check;

-- Adicionar novo constraint com todos os tipos suportados
ALTER TABLE public.quiz_steps 
  ADD CONSTRAINT quiz_steps_type_check 
  CHECK (type IN ('question', 'result', 'custom_lead', 'lead_registration'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_steps_quiz_id ON public.quiz_steps(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_order ON public.quiz_steps("order");
CREATE INDEX IF NOT EXISTS idx_quiz_steps_type ON public.quiz_steps(type);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_components ON public.quiz_steps USING GIN (components);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_data ON public.quiz_steps USING GIN (data);

-- PARTE 3: CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ============================================

-- Ativar RLS nas tabelas
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_steps ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can create their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can update their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can delete their own quizzes" ON public.quizzes;

DROP POLICY IF EXISTS "Users can view steps from their quizzes" ON public.quiz_steps;
DROP POLICY IF EXISTS "Users can create steps for their quizzes" ON public.quiz_steps;
DROP POLICY IF EXISTS "Users can update steps from their quizzes" ON public.quiz_steps;
DROP POLICY IF EXISTS "Users can delete steps from their quizzes" ON public.quiz_steps;

-- Criar políticas RLS para QUIZZES
CREATE POLICY "Users can view their own quizzes" 
  ON public.quizzes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quizzes" 
  ON public.quizzes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes" 
  ON public.quizzes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes" 
  ON public.quizzes FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar políticas RLS para QUIZ_STEPS
CREATE POLICY "Users can view steps from their quizzes" 
  ON public.quiz_steps FOR SELECT 
  USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create steps for their quizzes" 
  ON public.quiz_steps FOR INSERT 
  WITH CHECK (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update steps from their quizzes" 
  ON public.quiz_steps FOR UPDATE 
  USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete steps from their quizzes" 
  ON public.quiz_steps FOR DELETE 
  USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

-- PARTE 4: CRIAR TRIGGERS PARA UPDATED_AT
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para quizzes
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para quiz_steps
DROP TRIGGER IF EXISTS update_quiz_steps_updated_at ON public.quiz_steps;
CREATE TRIGGER update_quiz_steps_updated_at
  BEFORE UPDATE ON public.quiz_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- PARTE 5: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar estrutura da tabela quizzes
SELECT 
  'QUIZZES' as tabela,
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'quizzes'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela quiz_steps
SELECT 
  'QUIZ_STEPS' as tabela,
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'quiz_steps'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('quizzes', 'quiz_steps')
ORDER BY tablename, policyname;

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '✅ Tabela quizzes atualizada';
  RAISE NOTICE '✅ Tabela quiz_steps criada/atualizada';
  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Triggers criados';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '1. Verifique os resultados dos SELECTs acima';
  RAISE NOTICE '2. Teste salvar um quiz na aplicação';
  RAISE NOTICE '3. Teste publicar um quiz na aplicação';
END $$;
