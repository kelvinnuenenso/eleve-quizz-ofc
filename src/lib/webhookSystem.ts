// FASE 4: SISTEMA DE WEBHOOKS FUNCIONAIS
import { Quiz, Result, Lead } from '@/types/quiz';
import { supabaseSync } from './supabaseSync';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  active: boolean;
  retryCount: number;
  timeoutSeconds: number;
}

export type WebhookEvent = 'quiz_start' | 'quiz_complete' | 'lead_capture' | 'question_answer' | 'drop_off';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  quiz: {
    id: string;
    name: string;
    publicId: string;
  };
  data: any;
  session?: {
    sessionId: string;
    userAgent?: string;
    referrer?: string;
    utmParams?: Record<string, string>;
  };
}

class WebhookSystem {
  private webhooks: Map<string, WebhookConfig[]> = new Map();
  private executionQueue: Array<{ webhook: WebhookConfig; payload: WebhookPayload }> = [];
  private isProcessing = false;

  // Register webhook for a quiz
  registerWebhook(quizId: string, webhook: WebhookConfig): void {
    if (!this.webhooks.has(quizId)) {
      this.webhooks.set(quizId, []);
    }
    
    const quizWebhooks = this.webhooks.get(quizId)!;
    const existingIndex = quizWebhooks.findIndex(w => w.id === webhook.id);
    
    if (existingIndex >= 0) {
      quizWebhooks[existingIndex] = webhook;
    } else {
      quizWebhooks.push(webhook);
    }

    // Persist to localStorage
    this.persistWebhooks();
    console.log('Webhook registered:', webhook.name, 'for quiz:', quizId);
  }

  // Remove webhook
  removeWebhook(quizId: string, webhookId: string): void {
    const quizWebhooks = this.webhooks.get(quizId);
    if (quizWebhooks) {
      const filteredWebhooks = quizWebhooks.filter(w => w.id !== webhookId);
      this.webhooks.set(quizId, filteredWebhooks);
      this.persistWebhooks();
      console.log('Webhook removed:', webhookId);
    }
  }

  // Get webhooks for a quiz
  getWebhooks(quizId: string): WebhookConfig[] {
    return this.webhooks.get(quizId) || [];
  }

  // Trigger webhooks for an event
  async triggerWebhooks(event: WebhookEvent, quiz: Quiz, data: any, sessionData?: any): Promise<void> {
    const quizWebhooks = this.webhooks.get(quiz.id) || [];
    
    const relevantWebhooks = quizWebhooks.filter(webhook => 
      webhook.active && webhook.events.includes(event)
    );

    if (relevantWebhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      quiz: {
        id: quiz.id,
        name: quiz.name,
        publicId: quiz.publicId
      },
      data,
      session: sessionData
    };

    // Add to execution queue
    for (const webhook of relevantWebhooks) {
      this.executionQueue.push({ webhook, payload });
    }

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processExecutionQueue();
    }
  }

  // Process webhook execution queue
  private async processExecutionQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const { webhook, payload } = this.executionQueue.shift()!;
      await this.executeWebhook(webhook, payload);
    }

    this.isProcessing = false;
  }

  // Execute a single webhook
  private async executeWebhook(webhook: WebhookConfig, payload: WebhookPayload, attempt: number = 1): Promise<void> {
    try {
      console.log(`Executing webhook: ${webhook.name} (attempt ${attempt})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeoutSeconds * 1000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Elevado-Quiz-Webhook/1.0',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Quiz-ID': payload.quiz.id,
          ...webhook.headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseBody = await response.text();
      
      // Log successful execution
      this.logWebhookExecution(webhook, payload, response.status, responseBody, null, attempt);
      
      console.log(`Webhook executed successfully: ${webhook.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook execution failed: ${webhook.name}`, errorMessage);

      // Log failed execution
      this.logWebhookExecution(webhook, payload, 0, null, errorMessage, attempt);

      // Retry if attempts remaining
      if (attempt < webhook.retryCount) {
        const retryDelay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
        setTimeout(() => {
          this.executeWebhook(webhook, payload, attempt + 1);
        }, retryDelay);
      } else {
        console.error(`Max retries reached for webhook: ${webhook.name}`);
      }
    }
  }

  // Log webhook execution
  private logWebhookExecution(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    responseStatus: number,
    responseBody: string | null,
    errorMessage: string | null,
    attemptCount: number
  ): void {
    const logEntry = {
      id: crypto.randomUUID(),
      webhookId: webhook.id,
      webhookName: webhook.name,
      event: payload.event,
      quizId: payload.quiz.id,
      payload,
      responseStatus,
      responseBody,
      errorMessage,
      attemptCount,
      executedAt: new Date().toISOString()
    };

    // Store in localStorage
    try {
      const logs = JSON.parse(localStorage.getItem('webhook_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('webhook_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging webhook execution:', error);
    }
  }

  // Get webhook execution logs
  getWebhookLogs(quizId?: string, webhookId?: string): any[] {
    try {
      const logs = JSON.parse(localStorage.getItem('webhook_logs') || '[]');
      
      let filteredLogs = logs;
      
      if (quizId) {
        filteredLogs = filteredLogs.filter((log: any) => log.quizId === quizId);
      }
      
      if (webhookId) {
        filteredLogs = filteredLogs.filter((log: any) => log.webhookId === webhookId);
      }
      
      return filteredLogs.reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting webhook logs:', error);
      return [];
    }
  }

  // Test webhook
  async testWebhook(webhook: WebhookConfig): Promise<boolean> {
    const testPayload: WebhookPayload = {
      event: 'quiz_start',
      timestamp: new Date().toISOString(),
      quiz: {
        id: 'test-quiz',
        name: 'Test Quiz',
        publicId: 'test-123'
      },
      data: {
        test: true,
        message: 'This is a test webhook execution'
      },
      session: {
        sessionId: 'test-session',
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        utmParams: {}
      }
    };

    try {
      await this.executeWebhook(webhook, testPayload);
      return true;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  // Event shortcuts
  async onQuizStart(quiz: Quiz, sessionData: any): Promise<void> {
    await this.triggerWebhooks('quiz_start', quiz, {
      startTime: Date.now(),
      totalQuestions: quiz.questions?.length || 0
    }, sessionData);
  }

  async onQuizComplete(quiz: Quiz, result: Result, sessionData: any): Promise<void> {
    await this.triggerWebhooks('quiz_complete', quiz, {
      resultId: result.id,
      score: result.score,
      outcomeKey: result.outcomeKey,
      completedAt: result.completedAt,
      answers: result.answers
    }, sessionData);
  }

  async onLeadCapture(quiz: Quiz, lead: Lead, sessionData: any): Promise<void> {
    await this.triggerWebhooks('lead_capture', quiz, {
      leadId: lead.id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      customFields: lead.customFields
    }, sessionData);
  }

  async onQuestionAnswer(quiz: Quiz, questionData: any, sessionData: any): Promise<void> {
    await this.triggerWebhooks('question_answer', quiz, questionData, sessionData);
  }

  async onDropOff(quiz: Quiz, dropOffData: any, sessionData: any): Promise<void> {
    await this.triggerWebhooks('drop_off', quiz, dropOffData, sessionData);
  }

  // Persist webhooks to localStorage
  private persistWebhooks(): void {
    try {
      const webhooksObj = Object.fromEntries(this.webhooks);
      localStorage.setItem('quiz_webhooks', JSON.stringify(webhooksObj));
    } catch (error) {
      console.error('Error persisting webhooks:', error);
    }
  }

  // Load webhooks from localStorage
  loadWebhooks(): void {
    try {
      const stored = localStorage.getItem('quiz_webhooks');
      if (stored) {
        const webhooksObj = JSON.parse(stored);
        this.webhooks = new Map(Object.entries(webhooksObj));
        console.log('Webhooks loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  }

  // Initialize webhook system
  initialize(): void {
    this.loadWebhooks();
    
    // Process any pending webhooks on startup
    this.processExecutionQueue();
    
    console.log('Webhook system initialized');
  }

  // Get webhook statistics
  getWebhookStats(quizId: string): {
    totalWebhooks: number;
    activeWebhooks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const webhooks = this.getWebhooks(quizId);
    const logs = this.getWebhookLogs(quizId);
    
    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.active).length,
      totalExecutions: logs.length,
      successfulExecutions: logs.filter(log => log.responseStatus >= 200 && log.responseStatus < 300).length,
      failedExecutions: logs.filter(log => log.responseStatus === 0 || log.responseStatus >= 400).length
    };
  }
}

// Export singleton instance
export const webhookSystem = new WebhookSystem();
