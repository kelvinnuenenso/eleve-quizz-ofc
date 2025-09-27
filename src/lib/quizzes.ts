import { Quiz, Result, Lead } from '@/types/quiz';
import { localDB } from './localStorage';
import { quizzesApi, responsesApi } from './supabaseApi';
import { supabase } from '@/integrations/supabase/client';

// Helper function to check if user is authenticated (not in demo mode)
async function isUserAuthenticated(): Promise<boolean> {
  const isDemoMode = localStorage.getItem('demo_mode_active') === 'true';
  if (isDemoMode) return false;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user !== null;
}

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function saveQuiz(quiz: Quiz): Promise<Quiz> {
  if (await isUserAuthenticated()) {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // Save to Supabase for authenticated users
        const savedQuiz = await quizzesApi.create({
          ...quiz,
          userId
        });
        return savedQuiz;
      }
    } catch (error) {
      console.error('Error saving quiz to Supabase:', error);
      // Fallback to localStorage if Supabase fails
    }
  }
  
  // Use localStorage for demo mode or as fallback
  localDB.saveQuiz(quiz);
  return quiz;
}

export async function loadQuizByPublicId(publicId: string): Promise<Quiz | null> {
  if (await isUserAuthenticated()) {
    try {
      // Try to load from Supabase first
      const quiz = await quizzesApi.getByPublicId(publicId);
      if (quiz) return quiz;
    } catch (error) {
      console.error('Error loading quiz from Supabase:', error);
    }
  }
  
  // Fallback to localStorage
  return localDB.getQuizByPublicId(publicId);
}

export async function loadQuiz(id: string): Promise<Quiz | null> {
  if (await isUserAuthenticated()) {
    try {
      // Try to load from Supabase first
      const quiz = await quizzesApi.getById(id);
      if (quiz) return quiz;
    } catch (error) {
      console.error('Error loading quiz from Supabase:', error);
    }
  }
  
  // Fallback to localStorage
  return localDB.getQuiz(id);
}

export async function listQuizzes(): Promise<Quiz[]> {
  if (await isUserAuthenticated()) {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // Load from Supabase for authenticated users
        const quizzes = await quizzesApi.getByUserId(userId);
        return quizzes;
      }
    } catch (error) {
      console.error('Error loading quizzes from Supabase:', error);
    }
  }
  
  // Use localStorage for demo mode or as fallback
  return localDB.getAllQuizzes();
}

export async function deleteQuiz(id: string): Promise<void> {
  if (await isUserAuthenticated()) {
    try {
      // Delete from Supabase for authenticated users
      await quizzesApi.delete(id);
      return;
    } catch (error) {
      console.error('Error deleting quiz from Supabase:', error);
    }
  }
  
  // Use localStorage for demo mode or as fallback
  localDB.deleteQuiz(id);
}

export async function saveResult(result: Result): Promise<void> {
  if (await isUserAuthenticated()) {
    try {
      // Save to Supabase for authenticated users
      await responsesApi.create(result);
      return;
    } catch (error) {
      console.error('Error saving result to Supabase:', error);
    }
  }
  
  // Use localStorage for demo mode or as fallback
  localDB.saveResult(result);
}

export async function saveLead(lead: Lead): Promise<void> {
  if (await isUserAuthenticated()) {
    try {
      // Save to Supabase for authenticated users
      const { data, error } = await supabase
        .from('leads')
        .insert({
          quiz_id: lead.quizId,
          email: lead.email,
          nome: lead.name,
          telefone: lead.phone,
          dados_extras: lead.extraData || {},
          origem: lead.source || 'quiz',
          criado_em: new Date().toISOString()
        });
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Error saving lead to Supabase:', error);
    }
  }
  
  // Use localStorage for demo mode or as fallback
  localDB.saveLead(lead);
}

export async function getResult(id: string): Promise<Result | null> {
  if (await isUserAuthenticated()) {
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        // Map Supabase data to Result format
        return {
          id: data.id,
          quizId: data.quiz_id,
          userId: data.user_responder_id,
          answers: data.respostas_json,
          score: data.score,
          createdAt: data.criado_em,
          completedAt: data.completed_at,
          sessionId: data.session_id
        };
      }
    } catch (error) {
      console.error('Error loading result from Supabase:', error);
    }
  }
  
  // Fallback to localStorage
  return localDB.getResult(id);
}