-- Update quizzes table schema to include all necessary fields
-- Add redirect_settings column if it doesn't exist
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS redirect_settings JSONB DEFAULT '{}'::JSONB;

-- Add components column to quiz_steps table for storing visual components
ALTER TABLE public.quiz_steps
ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]'::JSONB;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_redirect_settings ON public.quizzes USING GIN (redirect_settings);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_components ON public.quiz_steps USING GIN (components);

-- Update the update_updated_at_column function to handle all tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers exist for all tables
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_steps_updated_at ON public.quiz_steps;
CREATE TRIGGER update_quiz_steps_updated_at
  BEFORE UPDATE ON public.quiz_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for the new columns if needed
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_steps ENABLE ROW LEVEL SECURITY;

-- Ensure all existing policies are still in place
-- (These should already exist from previous migrations, but we'll ensure they're there)

-- Policies for quizzes
DROP POLICY IF EXISTS "Users can view their own quizzes" ON public.quizzes;
CREATE POLICY "Users can view their own quizzes" ON public.quizzes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own quizzes" ON public.quizzes;
CREATE POLICY "Users can create their own quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quizzes" ON public.quizzes;
CREATE POLICY "Users can update their own quizzes" ON public.quizzes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quizzes" ON public.quizzes;
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for viewing published quizzes without authentication
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON public.quizzes;
CREATE POLICY "Anyone can view published quizzes" ON public.quizzes
  FOR SELECT USING (status = 'published');

-- Policies for quiz steps
DROP POLICY IF EXISTS "Users can view steps from their quizzes" ON public.quiz_steps;
CREATE POLICY "Users can view steps from their quizzes" ON public.quiz_steps
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create steps for their quizzes" ON public.quiz_steps;
CREATE POLICY "Users can create steps for their quizzes" ON public.quiz_steps
  FOR INSERT WITH CHECK (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update steps from their quizzes" ON public.quiz_steps;
CREATE POLICY "Users can update steps from their quizzes" ON public.quiz_steps
  FOR UPDATE USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete steps from their quizzes" ON public.quiz_steps;
CREATE POLICY "Users can delete steps from their quizzes" ON public.quiz_steps
  FOR DELETE USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );