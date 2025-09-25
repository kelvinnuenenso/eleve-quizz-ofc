/**
 * Sistema de Tratamento de Erros
 * 
 * Centraliza o tratamento de erros da aplicação com logging,
 * notificações ao usuário e recuperação automática
 */

import { ValidationError } from './validation';

// ===== TIPOS DE ERRO =====

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ===== INTERFACES =====

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  code?: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, unknown>;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  quizId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// ===== CLASSES DE ERRO CUSTOMIZADAS =====

export class AppErrorClass extends Error implements AppError {
  public id: string;
  public type: ErrorType;
  public severity: ErrorSeverity;
  public details?: string;
  public code?: string;
  public timestamp: string;
  public userId?: string;
  public context?: Record<string, unknown>;
  public recoverable: boolean;
  public retryable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      details?: string;
      code?: string;
      userId?: string;
      context?: Record<string, unknown>;
      recoverable?: boolean;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    
    this.id = crypto.randomUUID();
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.details = options.details;
    this.code = options.code;
    this.timestamp = new Date().toISOString();
    this.userId = options.userId;
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;
    this.retryable = options.retryable ?? false;
    this.name = 'AppError';

    if (options.cause) {
      this.stack = options.cause.stack;
    }
  }
}

export class NetworkError extends AppErrorClass {
  constructor(message: string, options: { status?: number; url?: string } = {}) {
    super(ErrorType.NETWORK, message, {
      severity: ErrorSeverity.MEDIUM,
      code: options.status?.toString(),
      context: { url: options.url },
      retryable: true
    });
  }
}

export class AuthError extends AppErrorClass {
  constructor(message: string, code?: string) {
    super(ErrorType.AUTH, message, {
      severity: ErrorSeverity.HIGH,
      code,
      recoverable: false
    });
  }
}

export class PermissionError extends AppErrorClass {
  constructor(message: string, resource?: string) {
    super(ErrorType.PERMISSION, message, {
      severity: ErrorSeverity.HIGH,
      context: { resource },
      recoverable: false
    });
  }
}

export class NotFoundError extends AppErrorClass {
  constructor(resource: string, id?: string) {
    super(ErrorType.NOT_FOUND, `${resource} não encontrado`, {
      severity: ErrorSeverity.MEDIUM,
      context: { resource, id },
      recoverable: false
    });
  }
}

// ===== MAPEAMENTO DE ERROS =====

/**
 * Converte erros nativos em AppError
 */
export const mapError = (error: unknown, context?: ErrorContext): AppError => {
  if (error instanceof AppErrorClass) {
    return error;
  }

  if (error instanceof ValidationError) {
    return new AppErrorClass(ErrorType.VALIDATION, error.message, {
      severity: ErrorSeverity.MEDIUM,
      details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
      context
    });
  }

  if (error instanceof TypeError) {
    return new AppErrorClass(ErrorType.CLIENT, error.message, {
      severity: ErrorSeverity.LOW,
      context,
      cause: error
    });
  }

  // Erros de rede (fetch, axios, etc.)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    
    if (status === 401) {
      return new AuthError('Não autorizado');
    }
    
    if (status === 403) {
      return new PermissionError('Acesso negado');
    }
    
    if (status === 404) {
      return new NotFoundError('Recurso', (error as any).url);
    }
    
    if (status >= 500) {
      return new AppErrorClass(ErrorType.SERVER, 'Erro interno do servidor', {
        severity: ErrorSeverity.HIGH,
        code: status.toString(),
        retryable: true,
        context
      });
    }
    
    return new NetworkError(`Erro de rede: ${status}`, {
      status,
      url: (error as any).url
    });
  }

  // Erro genérico
  const message = error instanceof Error ? error.message : String(error);
  return new AppErrorClass(ErrorType.UNKNOWN, message, {
    severity: ErrorSeverity.MEDIUM,
    context,
    cause: error instanceof Error ? error : undefined
  });
};

// ===== LOGGER DE ERROS =====

export interface ErrorLogger {
  log(error: AppError): void;
  logBatch(errors: AppError[]): void;
}

class ConsoleErrorLogger implements ErrorLogger {
  log(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      details: error.details,
      code: error.code,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    };

    console[logLevel](`[${error.type}] ${error.message}`, logData);
  }

  logBatch(errors: AppError[]): void {
    errors.forEach(error => this.log(error));
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }
}

// ===== NOTIFICADOR DE ERROS =====

export interface ErrorNotifier {
  notify(error: AppError): void;
  notifyUser(message: string, type: 'error' | 'warning' | 'info'): void;
}

class ToastErrorNotifier implements ErrorNotifier {
  notify(error: AppError): void {
    const userMessage = this.getUserMessage(error);
    const notificationType = this.getNotificationType(error.severity);
    this.notifyUser(userMessage, notificationType);
  }

  notifyUser(message: string, type: 'error' | 'warning' | 'info'): void {
    // Implementação com toast/notification library
    // Por enquanto, apenas console
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // TODO: Integrar com react-hot-toast ou similar
    // toast[type](message);
  }

  private getUserMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return 'Dados inválidos. Verifique os campos e tente novamente.';
      case ErrorType.NETWORK:
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      case ErrorType.AUTH:
        return 'Sessão expirada. Faça login novamente.';
      case ErrorType.PERMISSION:
        return 'Você não tem permissão para esta ação.';
      case ErrorType.NOT_FOUND:
        return 'Recurso não encontrado.';
      case ErrorType.SERVER:
        return 'Erro interno. Tente novamente em alguns minutos.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  }

  private getNotificationType(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }
}

// ===== HANDLER PRINCIPAL =====

export class ErrorHandler {
  private logger: ErrorLogger;
  private notifier: ErrorNotifier;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  constructor(
    logger: ErrorLogger = new ConsoleErrorLogger(),
    notifier: ErrorNotifier = new ToastErrorNotifier()
  ) {
    this.logger = logger;
    this.notifier = notifier;
  }

  /**
   * Processa um erro
   */
  handle(error: unknown, context?: ErrorContext): AppError {
    const appError = mapError(error, context);
    
    // Log do erro
    this.logger.log(appError);
    
    // Adiciona à fila
    this.addToQueue(appError);
    
    // Notifica o usuário se necessário
    if (this.shouldNotifyUser(appError)) {
      this.notifier.notify(appError);
    }
    
    return appError;
  }

  /**
   * Processa múltiplos erros
   */
  handleBatch(errors: unknown[], context?: ErrorContext): AppError[] {
    const appErrors = errors.map(error => mapError(error, context));
    
    this.logger.logBatch(appErrors);
    appErrors.forEach(error => this.addToQueue(error));
    
    // Notifica apenas erros críticos em batch
    appErrors
      .filter(error => error.severity === ErrorSeverity.CRITICAL)
      .forEach(error => this.notifier.notify(error));
    
    return appErrors;
  }

  /**
   * Tenta recuperar de um erro
   */
  async recover(error: AppError, recoveryFn?: () => Promise<void>): Promise<boolean> {
    if (!error.recoverable) {
      return false;
    }

    try {
      if (recoveryFn) {
        await recoveryFn();
      }
      return true;
    } catch (recoveryError) {
      this.handle(recoveryError, { 
        component: 'ErrorHandler',
        action: 'recover',
        metadata: { originalErrorId: error.id }
      });
      return false;
    }
  }

  /**
   * Tenta reexecutar uma operação
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: AppError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handle(error, {
          ...context,
          metadata: { ...context?.metadata, attempt, maxRetries }
        });
        
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError;
        }
        
        // Delay exponencial
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError;
  }

  /**
   * Obtém estatísticas de erros
   */
  getStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;
    
    this.errorQueue.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    return {
      total: this.errorQueue.length,
      byType,
      bySeverity,
      recent: this.errorQueue.slice(-10)
    };
  }

  /**
   * Limpa a fila de erros
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    // Mantém o tamanho da fila
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private shouldNotifyUser(error: AppError): boolean {
    // Não notifica erros de baixa severidade
    if (error.severity === ErrorSeverity.LOW) {
      return false;
    }
    
    // Sempre notifica erros críticos
    if (error.severity === ErrorSeverity.CRITICAL) {
      return true;
    }
    
    // Notifica erros de validação e rede
    return [ErrorType.VALIDATION, ErrorType.NETWORK, ErrorType.AUTH].includes(error.type);
  }
}

// ===== INSTÂNCIA GLOBAL =====

export const errorHandler = new ErrorHandler();

// ===== HELPERS =====

/**
 * Wrapper para funções assíncronas com tratamento de erro
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw errorHandler.handle(error, context);
    }
  };
};

/**
 * Wrapper para funções síncronas com tratamento de erro
 */
export const withErrorHandlingSync = <T extends any[], R>(
  fn: (...args: T) => R,
  context?: ErrorContext
) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      throw errorHandler.handle(error, context);
    }
  };
};

/**
 * Hook para React components
 */
export const useErrorHandler = () => {
  return {
    handle: (error: unknown, context?: ErrorContext) => errorHandler.handle(error, context),
    retry: errorHandler.retry.bind(errorHandler),
    recover: errorHandler.recover.bind(errorHandler),
    stats: errorHandler.getStats()
  };
};