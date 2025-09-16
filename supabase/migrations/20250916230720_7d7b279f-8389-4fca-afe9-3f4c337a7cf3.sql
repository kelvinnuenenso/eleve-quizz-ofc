-- FASE 4: INTEGRAÇÃO SUPABASE - Criar tabelas para dados funcionais

-- Tabela para armazenar quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  theme JSONB DEFAULT '{}'::JSONB,
  outcomes JSONB DEFAULT '{}'::JSONB,
  pixel_settings JSONB DEFAULT '{}'::JSONB,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para armazenar resultados de quizzes
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  outcome_key TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::JSONB,
  utm_params JSONB DEFAULT '{}'::JSONB,
  meta JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para armazenar leads capturados
CREATE TABLE IF NOT EXISTS public.quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  result_id UUID NOT NULL REFERENCES public.quiz_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para eventos de analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'question_view', 'question_answer', 'drop_off', 'complete', 'lead_capture')),
  event_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  device_info JSONB DEFAULT '{}'::JSONB,
  utm_params JSONB DEFAULT '{}'::JSONB,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para sessões de analytics
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time BIGINT NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  step_start_times JSONB DEFAULT '{}'::JSONB,
  step_end_times JSONB DEFAULT '{}'::JSONB,
  answers JSONB DEFAULT '[]'::JSONB,
  drop_off_point INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  lead_captured BOOLEAN DEFAULT FALSE,
  utm_params JSONB DEFAULT '{}'::JSONB,
  device_info JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para armazenar webhooks
CREATE TABLE IF NOT EXISTS public.quiz_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  headers JSONB DEFAULT '{}'::JSONB,
  active BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para logs de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.quiz_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_public_id ON public.quizzes(public_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_session_id ON public.quiz_results(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_quiz_id ON public.quiz_leads(quiz_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_quiz_id ON public.analytics_events(quiz_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_quiz_id ON public.analytics_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);

-- RLS Policies
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quizzes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes" ON public.quizzes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes" ON public.quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- Política para visualizar quizzes publicados sem autenticação
CREATE POLICY "Anyone can view published quizzes" ON public.quizzes
  FOR SELECT USING (status = 'published');

-- Políticas para resultados de quiz
CREATE POLICY "Users can view results from their quizzes" ON public.quiz_results
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can create quiz results" ON public.quiz_results
  FOR INSERT WITH CHECK (true);

-- Políticas para leads
CREATE POLICY "Users can view leads from their quizzes" ON public.quiz_leads
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can create leads" ON public.quiz_leads
  FOR INSERT WITH CHECK (true);

-- Políticas para eventos de analytics
CREATE POLICY "Users can view analytics from their quizzes" ON public.analytics_events
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Políticas para sessões de analytics
CREATE POLICY "Users can view analytics sessions from their quizzes" ON public.analytics_sessions
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can create and update analytics sessions" ON public.analytics_sessions
  FOR ALL WITH CHECK (true);

-- Políticas para webhooks
CREATE POLICY "Users can manage their own webhooks" ON public.quiz_webhooks
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para logs de webhooks
CREATE POLICY "Users can view webhook logs from their webhooks" ON public.webhook_logs
  FOR SELECT USING (
    webhook_id IN (SELECT id FROM public.quiz_webhooks WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create webhook logs" ON public.webhook_logs
  FOR INSERT WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_analytics_sessions_updated_at
  BEFORE UPDATE ON public.analytics_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quiz_webhooks_updated_at
  BEFORE UPDATE ON public.quiz_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();