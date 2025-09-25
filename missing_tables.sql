-- SQL para criar as tabelas faltantes no Supabase
-- Execute este script no SQL Editor do dashboard do Supabase

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_quiz_id ON public.analytics_events(quiz_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_quiz_id ON public.analytics_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_completed ON public.analytics_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_created_at ON public.analytics_sessions(created_at);

-- RLS Policies para analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics events for their quizzes" ON public.analytics_events
  FOR SELECT USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics events for their quizzes" ON public.analytics_events
  FOR INSERT WITH CHECK (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies para analytics_sessions
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics sessions for their quizzes" ON public.analytics_sessions
  FOR SELECT USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage analytics sessions for their quizzes" ON public.analytics_sessions
  FOR ALL USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous analytics sessions" ON public.analytics_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous analytics sessions updates" ON public.analytics_sessions
  FOR UPDATE USING (true);

-- Trigger para updated_at em analytics_sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analytics_sessions_updated_at BEFORE UPDATE ON public.analytics_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se as tabelas foram criadas
SELECT 'analytics_events' as table_name, COUNT(*) as row_count FROM public.analytics_events
UNION ALL
SELECT 'analytics_sessions' as table_name, COUNT(*) as row_count FROM public.analytics_sessions;