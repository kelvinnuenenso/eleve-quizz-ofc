// FASE 4 & 5: INTEGRAÇÃO SUPABASE + PERFORMANCE E CONFIABILIDADE
import { supabase } from '@/integrations/supabase/client';
import { Quiz, Result, Lead } from '@/types/quiz';
import { AnalyticsEvent, QuizSession } from './analytics';
import { localDB } from './localStorage';

export interface SyncStatus {
  lastSync: string | null;
  pendingEvents: number;
  syncInProgress: boolean;
  errors: string[];
}

class SupabaseSync {
  private syncInProgress = false;
  private retryQueue: any[] = [];
  private maxRetries = 3;

  // Sync quiz to Supabase
  async syncQuiz(quiz: Quiz): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .upsert({
          public_id: quiz.publicId,
          name: quiz.name,
          description: quiz.description,
          status: quiz.status as 'draft' | 'published' | 'archived',
          questions: quiz.questions as any || [],
          theme: quiz.theme as any || {},
          outcomes: quiz.outcomes as any || {},
          pixel_settings: quiz.pixelSettings as any || {},
          settings: quiz.settings as any || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'public_id'
        });

      if (error) {
        console.error('Error syncing quiz:', error);
        return false;
      }

      console.log('Quiz synced to Supabase:', quiz.id);
      return true;
    } catch (error) {
      console.error('Error syncing quiz to Supabase:', error);
      return false;
    }
  }

  // Sync result to Supabase
  async syncResult(result: Result): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .insert({
          quiz_id: result.quizId,
          started_at: result.startedAt,
          completed_at: result.completedAt,
          score: result.score,
          outcome_key: result.outcomeKey,
          answers: result.answers as any || [],
          utm_params: result.utm as any || {},
          meta: result.meta as any || {}
        });

      if (error) {
        console.error('Error syncing result:', error);
        this.addToRetryQueue('result', result);
        return false;
      }

      console.log('Result synced to Supabase:', result.id);
      return true;
    } catch (error) {
      console.error('Error syncing result to Supabase:', error);
      this.addToRetryQueue('result', result);
      return false;
    }
  }

  // Sync lead to Supabase
  async syncLead(lead: Lead): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('quiz_leads')
        .insert({
          id: lead.id,
          quiz_id: lead.quizId,
          result_id: lead.resultId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          tags: lead.tags || [],
          custom_fields: lead.customFields || {},
          created_at: lead.createdAt
        });

      if (error) {
        console.error('Error syncing lead:', error);
        this.addToRetryQueue('lead', lead);
        return false;
      }

      console.log('Lead synced to Supabase:', lead.id);
      return true;
    } catch (error) {
      console.error('Error syncing lead to Supabase:', error);
      this.addToRetryQueue('lead', lead);
      return false;
    }
  }

  // Sync analytics event to Supabase
  async syncAnalyticsEvent(event: AnalyticsEvent): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .insert({
          id: event.id,
          quiz_id: event.quizId,
          session_id: event.sessionId,
          event_type: event.eventType,
          event_data: event.eventData || {},
          device_info: event.deviceInfo || {},
          utm_params: event.utmParams || {},
          referrer: event.referrer,
          user_agent: event.userAgent,
          created_at: event.timestamp
        });

      if (error) {
        console.error('Error syncing analytics event:', error);
        this.addToRetryQueue('analytics_event', event);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error syncing analytics event to Supabase:', error);
      this.addToRetryQueue('analytics_event', event);
      return false;
    }
  }

  // Sync analytics session to Supabase
  async syncAnalyticsSession(session: QuizSession): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('analytics_sessions')
        .upsert({
          session_id: session.id,
          quiz_id: session.quizId,
          start_time: session.startTime,
          current_step: session.currentStep,
          total_steps: session.totalSteps,
          step_start_times: session.stepStartTimes as any || {},
          step_end_times: session.stepEndTimes as any || {},
          answers: session.answers as any || [],
          drop_off_point: session.dropOffPoint,
          completed: session.completed,
          lead_captured: session.leadCaptured,
          utm_params: session.utmParams as any || {},
          device_info: session.deviceInfo as any || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error syncing analytics session:', error);
        this.addToRetryQueue('analytics_session', session);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error syncing analytics session to Supabase:', error);
      this.addToRetryQueue('analytics_session', session);
      return false;
    }
  }

  // Bulk sync all localStorage data to Supabase
  async syncAllLocalData(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      return {
        lastSync: null,
        pendingEvents: 0,
        syncInProgress: true,
        errors: ['Sync already in progress']
      };
    }

    this.syncInProgress = true;
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // Sync quizzes
      const quizzes = localDB.getAllQuizzes();
      for (const quiz of quizzes) {
        const success = await this.syncQuiz(quiz);
        if (success) syncedCount++;
        else errors.push(`Failed to sync quiz: ${quiz.id}`);
      }

      // Sync results
      const allResults = JSON.parse(localStorage.getItem('elevado_results') || '[]') as Result[];
      for (const result of allResults) {
        const success = await this.syncResult(result);
        if (success) syncedCount++;
        else errors.push(`Failed to sync result: ${result.id}`);
      }

      // Sync leads
      const allLeads = localDB.getAllLeads();
      for (const lead of allLeads) {
        const success = await this.syncLead(lead);
        if (success) syncedCount++;
        else errors.push(`Failed to sync lead: ${lead.id}`);
      }

      // Sync analytics events
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]') as AnalyticsEvent[];
      for (const event of events) {
        const success = await this.syncAnalyticsEvent(event);
        if (success) syncedCount++;
        else errors.push(`Failed to sync analytics event: ${event.id}`);
      }

      // Sync analytics sessions
      const sessions = JSON.parse(localStorage.getItem('analytics_sessions') || '[]') as QuizSession[];
      for (const session of sessions) {
        const success = await this.syncAnalyticsSession(session);
        if (success) syncedCount++;
        else errors.push(`Failed to sync analytics session: ${session.id}`);
      }

      // Update last sync timestamp
      const lastSync = new Date().toISOString();
      localStorage.setItem('last_supabase_sync', lastSync);

      console.log(`Sync completed: ${syncedCount} items synced, ${errors.length} errors`);

      return {
        lastSync,
        pendingEvents: this.retryQueue.length,
        syncInProgress: false,
        errors
      };

    } catch (error) {
      console.error('Error during bulk sync:', error);
      errors.push(`Bulk sync error: ${error}`);
      
      return {
        lastSync: null,
        pendingEvents: this.retryQueue.length,
        syncInProgress: false,
        errors
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Load quiz from Supabase by public ID
  async loadQuizFromSupabase(publicId: string): Promise<Quiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('public_id', publicId)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        console.error('Error loading quiz from Supabase:', error);
        return null;
      }

      // Transform Supabase data to Quiz format
      const quiz: Quiz = {
        id: data.id,
        publicId: data.public_id,
        name: data.name,
        description: data.description,
        status: data.status as 'draft' | 'published' | 'archived',
        questions: Array.isArray(data.questions) ? data.questions as any : [],
        theme: (typeof data.theme === 'object' && data.theme) ? data.theme as any : {},
        outcomes: (typeof data.outcomes === 'object' && data.outcomes) ? data.outcomes as any : {},
        pixelSettings: (typeof data.pixel_settings === 'object' && data.pixel_settings) ? data.pixel_settings as any : {},
        settings: (typeof data.settings === 'object' && data.settings) ? data.settings as any : {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return quiz;
    } catch (error) {
      console.error('Error loading quiz from Supabase:', error);
      return null;
    }
  }

  // Get analytics data from Supabase
  async getAnalyticsFromSupabase(quizId: string, dateStart?: string, dateEnd?: string) {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('quiz_id', quizId);

      if (dateStart) {
        query = query.gte('created_at', dateStart);
      }
      if (dateEnd) {
        query = query.lte('created_at', dateEnd);
      }

      const { data: events, error: eventsError } = await query;
      
      if (eventsError) {
        console.error('Error loading analytics events:', eventsError);
        return null;
      }

      // Also get sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('*')
        .eq('quiz_id', quizId);

      if (sessionsError) {
        console.error('Error loading analytics sessions:', sessionsError);
        return null;
      }

      return {
        events: events || [],
        sessions: sessions || []
      };
    } catch (error) {
      console.error('Error getting analytics from Supabase:', error);
      return null;
    }
  }

  // Execute webhook
  async executeWebhook(webhookUrl: string, eventType: string, payload: any): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Elevado-Quiz-Webhook/1.0'
        },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          data: payload
        })
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.status, response.statusText);
        return false;
      }

      console.log('Webhook executed successfully:', webhookUrl);
      return true;
    } catch (error) {
      console.error('Error executing webhook:', error);
      return false;
    }
  }

  // Add item to retry queue
  private addToRetryQueue(type: string, item: any) {
    this.retryQueue.push({
      type,
      item,
      attempts: 0,
      addedAt: Date.now()
    });
  }

  // Process retry queue
  async processRetryQueue(): Promise<void> {
    const itemsToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const queueItem of itemsToRetry) {
      if (queueItem.attempts >= this.maxRetries) {
        console.error('Max retries reached for item:', queueItem);
        continue;
      }

      queueItem.attempts++;
      let success = false;

      try {
        switch (queueItem.type) {
          case 'result':
            success = await this.syncResult(queueItem.item);
            break;
          case 'lead':
            success = await this.syncLead(queueItem.item);
            break;
          case 'analytics_event':
            success = await this.syncAnalyticsEvent(queueItem.item);
            break;
          case 'analytics_session':
            success = await this.syncAnalyticsSession(queueItem.item);
            break;
        }
      } catch (error) {
        console.error('Error retrying sync:', error);
      }

      if (!success) {
        this.retryQueue.push(queueItem);
      }
    }
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    const lastSync = localStorage.getItem('last_supabase_sync');
    return {
      lastSync,
      pendingEvents: this.retryQueue.length,
      syncInProgress: this.syncInProgress,
      errors: []
    };
  }

  // Start automatic sync (every 5 minutes)
  startAutoSync(): void {
    setInterval(async () => {
      if (!this.syncInProgress) {
        await this.processRetryQueue();
        
        // Sync new events periodically
        const lastSync = localStorage.getItem('last_supabase_sync');
        if (!lastSync || Date.now() - new Date(lastSync).getTime() > 5 * 60 * 1000) {
          await this.syncAllLocalData();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Export singleton instance
export const supabaseSync = new SupabaseSync();