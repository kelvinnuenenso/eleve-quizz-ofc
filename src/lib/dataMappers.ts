/**
 * Data Mappers - Padronização entre Frontend e Backend
 * 
 * Este arquivo resolve as inconsistências de nomenclatura entre:
 * - Frontend (quiz.ts) - usa camelCase e inglês
 * - Backend (supabaseApi.ts) - usa snake_case e português
 * - Database (SQL) - usa snake_case e inglês
 */

import type { Quiz as FrontendQuiz, Question as FrontendQuestion, QuizAnswer, Result, Lead } from '@/types/quiz';
import type { Quiz as BackendQuiz, Question as BackendQuestion, QuizResponse, UserProfile } from './supabaseApi';

// ===== QUIZ MAPPERS =====

export interface DatabaseQuiz {
  id: string;
  user_id: string;
  public_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  questions: any[];
  theme?: any;
  outcomes?: any;
  pixel_settings?: any;
  settings?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Converte quiz do banco de dados para o formato do frontend
 */
export const mapDatabaseToFrontendQuiz = (dbQuiz: DatabaseQuiz): FrontendQuiz => {
  return {
    id: dbQuiz.id,
    publicId: dbQuiz.public_id,
    name: dbQuiz.name,
    description: dbQuiz.description,
    status: dbQuiz.status,
    theme: dbQuiz.theme,
    settings: dbQuiz.settings,
    questions: dbQuiz.questions || [],
    outcomes: dbQuiz.outcomes,
    pixelSettings: dbQuiz.pixel_settings,
    createdAt: dbQuiz.created_at,
    updatedAt: dbQuiz.updated_at
  };
};

/**
 * Converte quiz do frontend para o formato do banco de dados
 */
export const mapFrontendToDatabaseQuiz = (frontendQuiz: Partial<FrontendQuiz>): Partial<DatabaseQuiz> => {
  const mapped: Partial<DatabaseQuiz> = {};
  
  if (frontendQuiz.id) mapped.id = frontendQuiz.id;
  if (frontendQuiz.publicId) mapped.public_id = frontendQuiz.publicId;
  if (frontendQuiz.name) mapped.name = frontendQuiz.name;
  if (frontendQuiz.description !== undefined) mapped.description = frontendQuiz.description;
  if (frontendQuiz.status) mapped.status = frontendQuiz.status;
  if (frontendQuiz.questions) mapped.questions = frontendQuiz.questions;
  if (frontendQuiz.theme) mapped.theme = frontendQuiz.theme;
  if (frontendQuiz.outcomes) mapped.outcomes = frontendQuiz.outcomes;
  if (frontendQuiz.pixelSettings) mapped.pixel_settings = frontendQuiz.pixelSettings;
  if (frontendQuiz.settings) mapped.settings = frontendQuiz.settings;
  if (frontendQuiz.createdAt) mapped.created_at = frontendQuiz.createdAt;
  if (frontendQuiz.updatedAt) mapped.updated_at = frontendQuiz.updatedAt;
  
  return mapped;
};

/**
 * Converte quiz do backend (API) para o formato do frontend
 */
export const mapBackendToFrontendQuiz = (backendQuiz: BackendQuiz): Partial<FrontendQuiz> => {
  return {
    id: backendQuiz.id,
    publicId: backendQuiz.id, // Backend não tem public_id, usar id como fallback
    name: backendQuiz.titulo,
    description: backendQuiz.descricao,
    status: backendQuiz.status,
    theme: backendQuiz.tema ? JSON.parse(backendQuiz.tema) : undefined,
    questions: [], // Backend não armazena questions no quiz
    createdAt: backendQuiz.criado_em,
    updatedAt: backendQuiz.atualizado_em
  };
};

// ===== QUESTION MAPPERS =====

export interface DatabaseQuestion {
  id: string;
  quiz_id: string;
  title: string;
  description?: string;
  type: string;
  options?: any[];
  required?: boolean;
  settings?: any;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Converte pergunta do backend para o formato do frontend
 */
export const mapBackendToFrontendQuestion = (backendQuestion: BackendQuestion): Partial<FrontendQuestion> => {
  return {
    id: backendQuestion.id,
    title: backendQuestion.enunciado,
    type: mapBackendToFrontendQuestionType(backendQuestion.tipo),
    idx: backendQuestion.ordem,
    required: true // Default, pois backend não tem esse campo
  };
};

/**
 * Mapeia tipos de pergunta do backend para frontend
 */
export const mapBackendToFrontendQuestionType = (backendType: BackendQuestion['tipo']): FrontendQuestion['type'] => {
  const typeMap: Record<BackendQuestion['tipo'], FrontendQuestion['type']> = {
    'multiple_choice': 'multiple',
    'single_choice': 'single',
    'text': 'short_text',
    'rating': 'rating',
    'boolean': 'single'
  };
  
  return typeMap[backendType] || 'single';
};

// ===== RESPONSE MAPPERS =====

export interface DatabaseQuizResult {
  id: string;
  quiz_id: string;
  session_id?: string;
  user_id?: string;
  started_at: string;
  completed_at?: string;
  score: number;
  outcome_key?: string;
  answers: QuizAnswer[];
  utm_params?: any;
  meta?: any;
  created_at: string;
}

/**
 * Converte resultado do banco para o formato do frontend
 */
export const mapDatabaseToFrontendResult = (dbResult: DatabaseQuizResult): Result => {
  return {
    id: dbResult.id,
    quizId: dbResult.quiz_id,
    startedAt: dbResult.started_at,
    completedAt: dbResult.completed_at,
    score: dbResult.score,
    outcomeKey: dbResult.outcome_key,
    answers: dbResult.answers,
    utm: dbResult.utm_params,
    meta: dbResult.meta
  };
};

/**
 * Converte resposta do backend para o formato do frontend
 */
export const mapBackendToFrontendResponse = (backendResponse: QuizResponse): Partial<Result> => {
  return {
    id: backendResponse.id,
    quizId: backendResponse.quiz_id,
    startedAt: backendResponse.criado_em,
    completedAt: backendResponse.completed_at,
    score: backendResponse.score,
    answers: Object.entries(backendResponse.respostas_json).map(([questionId, value]) => ({
      questionId,
      value: String(value)
    })),
    meta: backendResponse.resultado
  };
};

// ===== LEAD MAPPERS =====

export interface DatabaseLead {
  id: string;
  quiz_id: string;
  result_id: string;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  custom_fields?: any;
  created_at: string;
}

/**
 * Converte lead do banco para o formato do frontend
 */
export const mapDatabaseToFrontendLead = (dbLead: DatabaseLead): Lead => {
  return {
    id: dbLead.id,
    quizId: dbLead.quiz_id,
    resultId: dbLead.result_id,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    tags: dbLead.tags,
    customFields: dbLead.custom_fields,
    createdAt: dbLead.created_at
  };
};

// ===== USER PROFILE MAPPERS =====

export interface DatabaseUserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
}

/**
 * Converte perfil do backend para o formato padronizado
 */
export const mapBackendToFrontendUserProfile = (backendProfile: UserProfile): DatabaseUserProfile => {
  return {
    id: backendProfile.id,
    user_id: backendProfile.user_id,
    name: backendProfile.nome,
    email: backendProfile.email,
    plan: backendProfile.plano,
    created_at: backendProfile.data_criacao,
    updated_at: backendProfile.updated_at
  };
};

// ===== VALIDATION HELPERS =====

/**
 * Valida se um objeto tem as propriedades necessárias para ser um quiz válido
 */
export const isValidQuiz = (obj: any): obj is FrontendQuiz => {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.name === 'string' && 
         typeof obj.status === 'string' &&
         Array.isArray(obj.questions);
};

/**
 * Valida se um objeto tem as propriedades necessárias para ser uma pergunta válida
 */
export const isValidQuestion = (obj: any): obj is FrontendQuestion => {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.type === 'string' &&
         typeof obj.idx === 'number';
};

/**
 * Normaliza IDs para garantir consistência
 */
export const normalizeId = (id: string | undefined): string => {
  if (!id) {
    return crypto.randomUUID();
  }
  return id;
};

/**
 * Normaliza datas para formato ISO
 */
export const normalizeDate = (date: string | Date | undefined): string => {
  if (!date) {
    return new Date().toISOString();
  }
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
};