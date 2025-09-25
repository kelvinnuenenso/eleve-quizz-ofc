import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { mapDatabaseToFrontendQuiz, mapFrontendToDatabaseQuiz, mapDatabaseToFrontendResult, mapDatabaseToFrontendLead } from './dataMappers';
import { validateQuiz, validateResult, validateOrThrow, QuizSchema, ResultSchema } from './validation';
import { errorHandler, withErrorHandling, NetworkError, NotFoundError } from './errorHandling';
import type { Quiz as FrontendQuiz, Result, Lead } from '@/types/quiz';

// Tipos para as entidades principais (mantidos para compatibilidade)
export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  plano: 'free' | 'basic' | 'premium' | 'enterprise';
  data_criacao: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string;
  tema?: string;
  status: 'draft' | 'published' | 'archived';
  criado_em: string;
  atualizado_em: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  enunciado: string;
  tipo: 'multiple_choice' | 'single_choice' | 'text' | 'rating' | 'boolean';
  ordem: number;
  created_at: string;
}

export interface Option {
  id: string;
  question_id: string;
  texto: string;
  correta: boolean;
  ordem: number;
  created_at: string;
}

export interface QuizResponse {
  id: string;
  quiz_id: string;
  user_responder_id?: string;
  respostas_json: Record<string, any>;
  resultado?: Record<string, any>;
  criado_em: string;
  session_id?: string;
  completed_at?: string;
  score: number;
}

// API para User Profiles
export const userProfilesApi = {
  // Criar perfil de usuário
  async create(profile: Omit<UserProfile, 'id' | 'data_criacao' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar perfil por user_id
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar perfil
  async update(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// API para Quizzes com mapeamento e validação
export const quizzesApi = {
  // Criar quiz
  async create(quiz: Omit<FrontendQuiz, 'id' | 'createdAt' | 'updatedAt'>) {
    return withErrorHandling(async () => {
      // Validar dados de entrada
      const validatedQuiz = validateOrThrow(QuizSchema.omit({ id: true, createdAt: true, updatedAt: true }), quiz);
      
      // Mapear para formato do banco
      const databaseQuiz = mapFrontendToDatabaseQuiz(validatedQuiz as FrontendQuiz);
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert(databaseQuiz)
        .select()
        .single();
      
      if (error) throw new NetworkError(`Erro ao criar quiz: ${error.message}`);
      
      // Mapear resposta para formato frontend
      return mapDatabaseToFrontendQuiz(data);
    });
  },

  // Listar quizzes do usuário
  async getByUserId(userId: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw new NetworkError(`Erro ao buscar quizzes: ${error.message}`);
      
      // Mapear todos os quizzes para formato frontend
      return data.map(mapDatabaseToFrontendQuiz);
    });
  },

  // Buscar quiz por ID
  async getById(id: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Quiz com ID ${id} não encontrado`);
        }
        throw new NetworkError(`Erro ao buscar quiz: ${error.message}`);
      }
      
      return mapDatabaseToFrontendQuiz(data);
    });
  },

  // Buscar quiz por publicId
  async getByPublicId(publicId: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('public_id', publicId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Quiz com ID público ${publicId} não encontrado`);
        }
        throw new NetworkError(`Erro ao buscar quiz: ${error.message}`);
      }
      
      return mapDatabaseToFrontendQuiz(data);
    });
  },

  // Atualizar quiz
  async update(id: string, updates: Partial<FrontendQuiz>) {
    return withErrorHandling(async () => {
      // Validar dados de entrada
      const validatedUpdates = validateOrThrow(QuizSchema.partial(), updates);
      
      // Mapear para formato do banco
      const databaseUpdates = mapFrontendToDatabaseQuiz(validatedUpdates as FrontendQuiz);
      
      const { data, error } = await supabase
        .from('quizzes')
        .update(databaseUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Quiz com ID ${id} não encontrado`);
        }
        throw new NetworkError(`Erro ao atualizar quiz: ${error.message}`);
      }
      
      return mapDatabaseToFrontendQuiz(data);
    });
  },

  // Deletar quiz
  async delete(id: string) {
    return withErrorHandling(async () => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Quiz com ID ${id} não encontrado`);
        }
        throw new NetworkError(`Erro ao deletar quiz: ${error.message}`);
      }
    });
  },

  // Buscar quiz completo com perguntas e opções
  async getFullQuiz(id: string) {
    return withErrorHandling(async () => {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (quizError) {
        if (quizError.code === 'PGRST116') {
          throw new NotFoundError(`Quiz com ID ${id} não encontrado`);
        }
        throw new NetworkError(`Erro ao buscar quiz: ${quizError.message}`);
      }

      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_options (*)
        `)
        .eq('quiz_id', id)
        .order('ordem');
      
      if (questionsError) {
        throw new NetworkError(`Erro ao buscar perguntas: ${questionsError.message}`);
      }

      const mappedQuiz = mapDatabaseToFrontendQuiz(quiz);
      
      return {
        ...mappedQuiz,
        questions: questions.map(q => ({
          ...q,
          options: q.quiz_options.sort((a, b) => a.ordem - b.ordem)
        }))
      };
    });
  }
};

// API para Questions
export const questionsApi = {
  // Criar pergunta
  async create(question: Omit<Question, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Listar perguntas de um quiz
  async getByQuizId(quizId: string) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('ordem');
    
    if (error) throw error;
    return data;
  },

  // Atualizar pergunta
  async update(id: string, updates: Partial<Question>) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar pergunta
  async delete(id: string) {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// API para Options
export const optionsApi = {
  // Criar opção
  async create(option: Omit<Option, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('quiz_options')
      .insert(option)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Listar opções de uma pergunta
  async getByQuestionId(questionId: string) {
    const { data, error } = await supabase
      .from('quiz_options')
      .select('*')
      .eq('question_id', questionId)
      .order('ordem');
    
    if (error) throw error;
    return data;
  },

  // Atualizar opção
  async update(id: string, updates: Partial<Option>) {
    const { data, error } = await supabase
      .from('quiz_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar opção
  async delete(id: string) {
    const { error } = await supabase
      .from('quiz_options')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// API para Responses
export const responsesApi = {
  // Criar resposta
  async create(response: Omit<QuizResponse, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('quiz_responses')
      .insert(response)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Listar respostas de um quiz
  async getByQuizId(quizId: string) {
    const { data, error } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('quiz_id', quizId)
      .order('criado_em', { ascending: false });
    
    if (error) throw error;
    return data;
  },

// API para Responses com mapeamento e validação
export const responsesApi = {
  // Criar resposta
  async create(response: Omit<Result, 'id' | 'createdAt'>) {
    return withErrorHandling(async () => {
      // Validar dados de entrada
      const validatedResponse = validateOrThrow(ResultSchema.omit({ id: true, createdAt: true }), response);
      
      // Mapear para formato do banco
      const databaseResponse = mapFrontendToDatabaseResult(validatedResponse as Result);
      
      const { data, error } = await supabase
        .from('quiz_responses')
        .insert(databaseResponse)
        .select()
        .single();
      
      if (error) throw new NetworkError(`Erro ao criar resposta: ${error.message}`);
      
      // Mapear resposta para formato frontend
      return mapDatabaseToFrontendResult(data);
    });
  },

  // Listar respostas de um quiz
  async getByQuizId(quizId: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });
      
      if (error) throw new NetworkError(`Erro ao buscar respostas: ${error.message}`);
      
      return data.map(mapDatabaseToFrontendResult);
    });
  },

  // Listar respostas de um usuário
  async getByUserId(userId: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select(`
          *,
          quizzes (name, public_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw new NetworkError(`Erro ao buscar respostas do usuário: ${error.message}`);
      
      return data.map(mapDatabaseToFrontendResult);
    });
  },

  // Buscar resposta por session_id
  async getBySessionId(sessionId: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Resposta com session ID ${sessionId} não encontrada`);
        }
        throw new NetworkError(`Erro ao buscar resposta: ${error.message}`);
      }
      
      return mapDatabaseToFrontendResult(data);
    });
  },

  // Atualizar resposta
  async update(id: string, updates: Partial<Result>) {
    return withErrorHandling(async () => {
      // Validar dados de entrada
      const validatedUpdates = validateOrThrow(ResultSchema.partial(), updates);
      
      // Mapear para formato do banco
      const databaseUpdates = mapFrontendToDatabaseResult(validatedUpdates as Result);
      
      const { data, error } = await supabase
        .from('quiz_responses')
        .update(databaseUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Resposta com ID ${id} não encontrada`);
        }
        throw new NetworkError(`Erro ao atualizar resposta: ${error.message}`);
      }
      
      return mapDatabaseToFrontendResult(data);
    });
  },

  // Buscar resposta por session_id
  async getBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar resposta
  async update(id: string, updates: Partial<QuizResponse>) {
    const { data, error } = await supabase
      .from('quiz_responses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Estatísticas de um quiz
  async getQuizStats(quizId: string) {
    const { data, error } = await supabase
      .from('quiz_responses')
      .select('score, completed_at, criado_em')
      .eq('quiz_id', quizId)
      .not('completed_at', 'is', null);
    
    if (error) throw error;

    const totalResponses = data.length;
    const averageScore = totalResponses > 0 
      ? data.reduce((sum, r) => sum + r.score, 0) / totalResponses 
      : 0;
    
    const completionRate = totalResponses > 0 ? 100 : 0;

    return {
      totalResponses,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate,
      responses: data
    };
  }
};

// Função utilitária para criar um quiz completo
export const createFullQuiz = async (
  quizData: Omit<Quiz, 'id' | 'criado_em' | 'atualizado_em'>,
  questionsData: Array<{
    enunciado: string;
    tipo: Question['tipo'];
    ordem: number;
    options: Array<{
      texto: string;
      correta: boolean;
      ordem: number;
    }>;
  }>
) => {
  // Criar o quiz
  const quiz = await quizzesApi.create(quizData);

  // Criar as perguntas e opções
  const questions = [];
  for (const questionData of questionsData) {
    const { options, ...questionInfo } = questionData;
    
    // Criar a pergunta
    const question = await questionsApi.create({
      ...questionInfo,
      quiz_id: quiz.id
    });

    // Criar as opções
    const questionOptions = [];
    for (const optionData of options) {
      const option = await optionsApi.create({
        ...optionData,
        question_id: question.id
      });
      questionOptions.push(option);
    }

    questions.push({
      ...question,
      options: questionOptions
    });
  }

  return {
    ...quiz,
    questions
  };
};