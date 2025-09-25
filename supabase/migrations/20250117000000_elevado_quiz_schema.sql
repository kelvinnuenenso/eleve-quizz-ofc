-- ELEVADO QUIZ - Schema completo do banco de dados
-- Criando as tabelas principais conforme especificação

-- 1. Tabela de perfis de usuários (complementa auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'free' CHECK (plano IN ('free', 'basic', 'premium', 'enterprise')),
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- 2. Tabela de Quizzes (reformulada para seguir a especificação)
-- Primeiro, removemos as tabelas antigas se existirem
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quiz_options CASCADE;
DROP TABLE IF EXISTS public.quiz_responses CASCADE;

-- Recriar tabela de quizzes com estrutura normalizada
CREATE TABLE IF NOT EXISTS public.quiz_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tema TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Questions (perguntas dos quizzes)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quiz_quizzes(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (tipo IN ('multiple_choice', 'single_choice', 'text', 'rating', 'boolean')),
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quiz_id, ordem)
);

-- 4. Tabela de Options (opções das perguntas)
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, ordem)
);

-- 5. Tabela de Responses (respostas dos usuários)
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quiz_quizzes(id) ON DELETE CASCADE,
  user_responder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  respostas_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  resultado JSONB DEFAULT '{}'::JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  completed_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_quiz_quizzes_user_id ON public.quiz_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_quizzes_status ON public.quiz_quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_ordem ON public.quiz_questions(quiz_id, ordem);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON public.quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_ordem ON public.quiz_options(question_id, ordem);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON public.quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_responder_id ON public.quiz_responses(user_responder_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_id ON public.quiz_responses(session_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quiz_quizzes_updated_at
  BEFORE UPDATE ON public.quiz_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para quiz_quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quiz_quizzes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quizzes" ON public.quiz_quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes" ON public.quiz_quizzes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes" ON public.quiz_quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para quiz_questions
CREATE POLICY "Users can view questions of their quizzes" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_quizzes 
      WHERE id = quiz_questions.quiz_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for their quizzes" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_quizzes 
      WHERE id = quiz_questions.quiz_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions of their quizzes" ON public.quiz_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_quizzes 
      WHERE id = quiz_questions.quiz_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of their quizzes" ON public.quiz_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_quizzes 
      WHERE id = quiz_questions.quiz_id AND user_id = auth.uid()
    )
  );

-- Políticas para quiz_options
CREATE POLICY "Users can view options of their quiz questions" ON public.quiz_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      JOIN public.quiz_quizzes qz ON q.quiz_id = qz.id
      WHERE q.id = quiz_options.question_id AND qz.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create options for their quiz questions" ON public.quiz_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      JOIN public.quiz_quizzes qz ON q.quiz_id = qz.id
      WHERE q.id = quiz_options.question_id AND qz.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options of their quiz questions" ON public.quiz_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      JOIN public.quiz_quizzes qz ON q.quiz_id = qz.id
      WHERE q.id = quiz_options.question_id AND qz.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options of their quiz questions" ON public.quiz_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      JOIN public.quiz_quizzes qz ON q.quiz_id = qz.id
      WHERE q.id = quiz_options.question_id AND qz.user_id = auth.uid()
    )
  );

-- Políticas para quiz_responses
CREATE POLICY "Anyone can create responses" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view responses to their quizzes" ON public.quiz_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_quizzes 
      WHERE id = quiz_responses.quiz_id AND user_id = auth.uid()
    )
    OR auth.uid() = user_responder_id
  );

CREATE POLICY "Users can view their own responses" ON public.quiz_responses
  FOR SELECT USING (auth.uid() = user_responder_id);

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();