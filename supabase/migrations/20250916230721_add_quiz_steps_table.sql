-- Add quiz_steps table for step-based quiz architecture
CREATE TABLE IF NOT EXISTS public.quiz_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('question', 'result', 'custom_lead')),
  name TEXT NOT NULL,
  title TEXT,
  data JSONB,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_steps_quiz_id ON public.quiz_steps(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_order ON public.quiz_steps("order");

-- RLS Policies for quiz_steps
ALTER TABLE public.quiz_steps ENABLE ROW LEVEL SECURITY;

-- Policies for quiz steps
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

-- Update function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on quiz_steps
CREATE OR REPLACE TRIGGER update_quiz_steps_updated_at
  BEFORE UPDATE ON public.quiz_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();