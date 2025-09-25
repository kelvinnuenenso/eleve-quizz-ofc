import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  settings: Record<string, unknown>;
  questions: Array<{
    id: string;
    type: string;
    title: string;
    options?: Array<{ id: string; text: string; value?: string | number | boolean }>;
    [key: string]: unknown;
  }>;
  status: string;
  public_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PublicQuizResponse {
  success: boolean;
  message: string;
  data?: Quiz;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicQuizResponse>
) {
  const { publicId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Public ID is required'
    });
  }

  try {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('public_id', publicId)
      .eq('status', 'published')
      .single();

    if (error || !quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not published',
        error: error?.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz retrieved successfully',
      data: quiz
    });
  } catch (error: unknown) {
    console.error('Error fetching public quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}