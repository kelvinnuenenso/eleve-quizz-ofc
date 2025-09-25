import { z } from 'zod';

// ===== SCHEMAS BÁSICOS =====

export const QuestionTypeSchema = z.enum([
  'single',
  'multiple', 
  'rating',
  'nps',
  'slider',
  'short_text',
  'long_text',
  'email',
  'phone',
  'date',
  'file',
  'consent',
  'cta'
]);

export const QuizStatusSchema = z.enum(['draft', 'published', 'archived']);

export const PlanTypeSchema = z.enum(['free', 'basic', 'premium', 'enterprise']);

// ===== QUESTION SCHEMAS =====

export const QuestionOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, 'Label é obrigatório'),
  value: z.string().optional(),
  score: z.number().optional()
});

export const QuestionLogicSchema = z.object({
  showIf: z.array(z.object({
    questionId: z.string().uuid(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.union([z.string(), z.number(), z.boolean()])
  })).optional(),
  skipIf: z.array(z.object({
    questionId: z.string().uuid(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.union([z.string(), z.number(), z.boolean()])
  })).optional()
});

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  idx: z.number().min(0),
  type: QuestionTypeSchema,
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  options: z.array(QuestionOptionSchema).optional(),
  required: z.boolean().default(false),
  logic: QuestionLogicSchema.optional(),
  score_weight: z.number().min(0).max(100).optional(),
  settings: z.record(z.unknown()).optional()
});

// ===== QUIZ SCHEMAS =====

export const QuizThemeSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor primária deve ser um hex válido').optional(),
  background: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor de fundo deve ser um hex válido').optional(),
  text: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor do texto deve ser um hex válido').optional(),
  accent: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  cardBackground: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  borderRadius: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  buttonStyle: z.string().optional(),
  maxWidth: z.string().optional(),
  gradient: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  showQuestionNumbers: z.boolean().optional(),
  centerAlign: z.boolean().optional()
});

export const QuizOutcomeSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  cta: z.object({
    label: z.string().min(1),
    href: z.string().url('URL deve ser válida')
  }).optional(),
  scoreRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  redirectUrl: z.string().url().optional()
});

// Quiz validation schema (atualizado)
export const QuizSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().min(1, 'ID público é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  status: QuizStatusSchema,
  userId: z.string().uuid().optional(),
  theme: QuizThemeSchema.optional(),
  settings: z.record(z.unknown()).optional(),
  questions: z.array(QuestionSchema).min(1, 'Quiz deve ter pelo menos uma pergunta'),
  outcomes: z.record(QuizOutcomeSchema).optional(),
  pixelSettings: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// ===== RESPONSE SCHEMAS =====

export const QuizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  value: z.union([z.string(), z.number()])
});

// Result validation schema (atualizado)
export const ResultSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  score: z.number().min(0),
  answers: z.array(QuizAnswerSchema),
  outcomeKey: z.string().optional(),
  utm: z.record(z.string()).optional(),
  meta: z.record(z.unknown()).optional()
});

// ===== VALIDATION FUNCTIONS =====

/**
 * Valida um quiz completo
 */
export const validateQuiz = (quiz: any) => {
  const result = QuizSchema.safeParse(quiz);
  if (!result.success) {
    console.error('Quiz validation failed:', result.error.issues);
    return { success: false, errors: result.error.issues };
  }
  return { success: true, data: result.data };
};

/**
 * Valida uma resposta de quiz
 */
export const validateResult = (result: any) => {
  const validationResult = ResultSchema.safeParse(result);
  if (!validationResult.success) {
    console.error('Result validation failed:', validationResult.error.issues);
    return { success: false, errors: validationResult.error.issues };
  }
  return { success: true, data: validationResult.data };
};

/**
 * Valida uma pergunta
 */
export const validateQuestion = (question: any) => {
  const result = QuestionSchema.safeParse(question);
  if (!result.success) {
    console.error('Question validation failed:', result.error.issues);
    return { success: false, errors: result.error.issues };
  }
  return { success: true, data: result.data };
};

// ===== ERROR HANDLING =====

export class ValidationError extends Error {
  public issues: z.ZodIssue[];
  
  constructor(issues: z.ZodIssue[]) {
    const message = issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    super(`Validation failed: ${message}`);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * Valida dados e lança erro se inválido
 */
export const validateOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
};

// ===== LEGACY FUNCTIONS (mantidas para compatibilidade) =====

export const safeGetQuizData = (data: any) => {
  try {
    const validatedData = QuizSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    console.error('Quiz data validation failed:', error);
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : 'Unknown validation error',
      data: null
    };
  }
};

export const safeGetResultData = (data: any) => {
  try {
    const validatedData = ResultSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    console.error('Result data validation failed:', error);
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : 'Unknown validation error',
      data: null
    };
  }
};