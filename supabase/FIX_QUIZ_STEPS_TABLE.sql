-- ============================================
-- FIX PARA TABELA quiz_steps
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar a tabela quiz_steps se não existir
CREATE TABLE IF NOT EXISTS public.quiz_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('question', 'result', 'custom_lead', 'lead_registration')),
  name TEXT NOT NULL,
  title TEXT,
  data JSONB DEFAULT '{}'::JSONB,
  components JSONB DEFAULT '[]'::JSONB,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Se a tabela já existe, adicionar colunas faltantes
ALTER TABLE public.quiz_steps 
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]'::JSONB;

-- 3. Atualizar o CHECK constraint para incluir 'lead_registration'
ALTER TABLE public.quiz_steps 
  DROP CONSTRAINT IF EXISTS quiz_steps_type_check;

ALTER TABLE public.quiz_steps 
  ADD CONSTRAINT quiz_steps_type_check 
  CHECK (type IN ('question', 'result', 'custom_lead', 'lead_registration'));

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_steps_quiz_id ON public.quiz_steps(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_order ON public.quiz_steps("order");
CREATE INDEX IF NOT EXISTS idx_quiz_steps_components ON public.quiz_steps USING GIN (components);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_data ON public.quiz_steps USING GIN (data);

-- 5. Ativar RLS (Row Level Security)
ALTER TABLE public.quiz_steps ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view steps from their quizzes" ON public.quiz_steps;
DROP POLICY IF EXISTS "Users can create steps for their quizzes" ON public.quiz_steps;
DROP POLICY IF EXISTS "Users can update steps from their quizzes" ON public.quiz_steps;
DROP POLICY IF EXISTS "Users can delete steps from their quizzes" ON public.quiz_steps;

-- 7. Criar políticas RLS
CREATE POLICY "Users can view steps from their quizzes" ON public.quiz_steps
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create steps for their quizzes" ON public.quiz_steps
  FOR INSERT WITH CHECK (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update steps from their quizzes" ON public.quiz_steps
  FOR UPDATE USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete steps from their quizzes" ON public.quiz_steps
  FOR DELETE USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

-- 8. Criar/atualizar função para update automático de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_quiz_steps_updated_at ON public.quiz_steps;
CREATE TRIGGER update_quiz_steps_updated_at
  BEFORE UPDATE ON public.quiz_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Verificar se a coluna redirect_settings existe na tabela quizzes
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS redirect_settings JSONB DEFAULT '{}'::JSONB;

-- 11. Criar índice para redirect_settings
CREATE INDEX IF NOT EXISTS idx_quizzes_redirect_settings ON public.quizzes USING GIN (redirect_settings);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute este SELECT para verificar se tudo está OK:
-- SELECT 
--   table_name, 
--   column_name, 
--   data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'quiz_steps' 
-- ORDER BY ordinal_position;
