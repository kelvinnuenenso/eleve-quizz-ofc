-- Migração para corrigir incompatibilidade entre estruturas de tabelas
-- O código usa 'quizzes' mas a migração anterior criou 'quiz_quizzes'

-- 1. Primeiro, vamos renomear a tabela quiz_quizzes para quizzes
ALTER TABLE IF EXISTS public.quiz_quizzes RENAME TO quizzes;

-- 2. Ajustar as colunas para corresponder ao que o código espera
ALTER TABLE public.quizzes 
  RENAME COLUMN titulo TO name;

ALTER TABLE public.quizzes 
  RENAME COLUMN descricao TO description;

ALTER TABLE public.quizzes 
  RENAME COLUMN tema TO theme;

ALTER TABLE public.quizzes 
  RENAME COLUMN criado_em TO created_at;

ALTER TABLE public.quizzes 
  RENAME COLUMN atualizado_em TO updated_at;

-- 3. Adicionar colunas que estão faltando conforme esperado pelo código
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS public_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS pixel_settings JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 4. Converter o campo theme de TEXT para JSONB se necessário
ALTER TABLE public.quizzes 
  ALTER COLUMN theme TYPE JSONB USING 
    CASE 
      WHEN theme IS NULL THEN '{}'::JSONB
      WHEN theme = '' THEN '{}'::JSONB
      ELSE ('"' || theme || '"')::JSONB
    END;

-- 5. Atualizar as referências nas outras tabelas
ALTER TABLE IF EXISTS public.quiz_questions 
  DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey,
  ADD CONSTRAINT quiz_questions_quiz_id_fkey 
    FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.quiz_responses 
  DROP CONSTRAINT IF EXISTS quiz_responses_quiz_id_fkey,
  ADD CONSTRAINT quiz_responses_quiz_id_fkey 
    FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- 6. Recriar índices com os novos nomes de colunas
DROP INDEX IF EXISTS idx_quiz_quizzes_user_id;
DROP INDEX IF EXISTS idx_quiz_quizzes_status;

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_public_id ON public.quizzes(public_id);

-- 7. Atualizar o trigger de updated_at
DROP TRIGGER IF EXISTS update_quiz_quizzes_updated_at ON public.quizzes;

CREATE OR REPLACE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Gerar public_id para quizzes existentes que não têm
UPDATE public.quizzes 
SET public_id = gen_random_uuid()::text 
WHERE public_id IS NULL;

-- 9. Tornar public_id obrigatório após preencher os valores
ALTER TABLE public.quizzes 
  ALTER COLUMN public_id SET NOT NULL;

COMMIT;