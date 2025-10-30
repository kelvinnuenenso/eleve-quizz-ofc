-- Add redirect_settings column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS redirect_settings JSONB DEFAULT '{}'::JSONB;