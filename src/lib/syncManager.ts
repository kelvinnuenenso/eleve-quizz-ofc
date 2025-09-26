import { supabase } from '@/integrations/supabase/client';
import { localDB, type UserProfile } from './localStorage';
import { Quiz, Result, Lead } from '@/types/quiz';

interface SyncStatus {
  lastSync: string;
  pendingChanges: boolean;
  conflicts: string[];
}

class SyncManager {
  private syncInProgress = false;
  private retryAttempts = 3;
  private retryDelay = 1000;

  async syncUserData(userId: string): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.syncInProgress = true;
    
    try {
      await Promise.all([
        this.syncQuizzes(userId),
        this.syncResults(userId),
        this.syncLeads(userId)
      ]);
      
      this.updateSyncStatus({
        lastSync: new Date().toISOString(),
        pendingChanges: false,
        conflicts: []
      });
      
      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncStatus({
        lastSync: this.getSyncStatus().lastSync,
        pendingChanges: true,
        conflicts: [`Sync failed: ${error}`]
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncQuizzes(userId: string): Promise<void> {
    const localQuizzes = localDB.getQuizzes();
    const { data: remoteQuizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Upload local quizzes that don't exist remotely
    for (const localQuiz of localQuizzes) {
      const existsRemotely = remoteQuizzes?.some(q => q.id === localQuiz.id);
      
      if (!existsRemotely) {
        await this.retryOperation(async () => {
          const { error } = await supabase
            .from('quizzes')
            .insert({
              id: localQuiz.id,
              user_id: userId,
              title: localQuiz.title,
              description: localQuiz.description,
              questions: localQuiz.questions,
              settings: localQuiz.settings,
              created_at: localQuiz.createdAt,
              updated_at: localQuiz.updatedAt || localQuiz.createdAt
            });
          
          if (error) throw error;
        });
      }
    }

    // Download remote quizzes that don't exist locally
    if (remoteQuizzes) {
      for (const remoteQuiz of remoteQuizzes) {
        const existsLocally = localQuizzes.some(q => q.id === remoteQuiz.id);
        
        if (!existsLocally) {
          const quiz: Quiz = {
            id: remoteQuiz.id,
            title: remoteQuiz.title,
            description: remoteQuiz.description,
            questions: remoteQuiz.questions,
            settings: remoteQuiz.settings,
            createdAt: remoteQuiz.created_at,
            updatedAt: remoteQuiz.updated_at
          };
          
          localDB.saveQuiz(quiz);
        }
      }
    }
  }

  private async syncResults(userId: string): Promise<void> {
    const localResults = localDB.getResults();
    const { data: remoteResults, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Upload local results that don't exist remotely
    for (const localResult of localResults) {
      const existsRemotely = remoteResults?.some(r => r.id === localResult.id);
      
      if (!existsRemotely) {
        await this.retryOperation(async () => {
          const { error } = await supabase
            .from('quiz_results')
            .insert({
              id: localResult.id,
              quiz_id: localResult.quizId,
              user_id: userId,
              answers: localResult.answers,
              score: localResult.score,
              completed_at: localResult.completedAt,
              time_spent: localResult.timeSpent
            });
          
          if (error) throw error;
        });
      }
    }

    // Download remote results that don't exist locally
    if (remoteResults) {
      for (const remoteResult of remoteResults) {
        const existsLocally = localResults.some(r => r.id === remoteResult.id);
        
        if (!existsLocally) {
          const result: Result = {
            id: remoteResult.id,
            quizId: remoteResult.quiz_id,
            answers: remoteResult.answers,
            score: remoteResult.score,
            completedAt: remoteResult.completed_at,
            timeSpent: remoteResult.time_spent
          };
          
          localDB.saveResult(result);
        }
      }
    }
  }

  private async syncLeads(userId: string): Promise<void> {
    const localLeads = localDB.getLeads();
    const { data: remoteLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Upload local leads that don't exist remotely
    for (const localLead of localLeads) {
      const existsRemotely = remoteLeads?.some(l => l.id === localLead.id);
      
      if (!existsRemotely) {
        await this.retryOperation(async () => {
          const { error } = await supabase
            .from('leads')
            .insert({
              id: localLead.id,
              quiz_id: localLead.quizId,
              user_id: userId,
              name: localLead.name,
              email: localLead.email,
              phone: localLead.phone,
              answers: localLead.answers,
              score: localLead.score,
              created_at: localLead.createdAt
            });
          
          if (error) throw error;
        });
      }
    }

    // Download remote leads that don't exist locally
    if (remoteLeads) {
      for (const remoteLead of remoteLeads) {
        const existsLocally = localLeads.some(l => l.id === remoteLead.id);
        
        if (!existsLocally) {
          const lead: Lead = {
            id: remoteLead.id,
            quizId: remoteLead.quiz_id,
            name: remoteLead.name,
            email: remoteLead.email,
            phone: remoteLead.phone,
            answers: remoteLead.answers,
            score: remoteLead.score,
            createdAt: remoteLead.created_at
          };
          
          localDB.saveLead(lead);
        }
      }
    }
  }

  private async retryOperation(operation: () => Promise<void>): Promise<void> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await operation();
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Operation failed (attempt ${attempt}/${this.retryAttempts}):`, error);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  private getSyncStatus(): SyncStatus {
    try {
      const status = localStorage.getItem('elevado_sync_status');
      return status ? JSON.parse(status) : {
        lastSync: '',
        pendingChanges: false,
        conflicts: []
      };
    } catch {
      return {
        lastSync: '',
        pendingChanges: false,
        conflicts: []
      };
    }
  }

  private updateSyncStatus(status: SyncStatus): void {
    try {
      localStorage.setItem('elevado_sync_status', JSON.stringify(status));
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  // Public method to check if sync is needed
  shouldSync(): boolean {
    const status = this.getSyncStatus();
    const lastSync = new Date(status.lastSync || 0);
    const now = new Date();
    const timeDiff = now.getTime() - lastSync.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeDiff > fiveMinutes || status.pendingChanges;
  }

  // Public method to force sync
  async forcSync(userId: string): Promise<void> {
    await this.syncUserData(userId);
  }

  // Method to handle offline changes
  markPendingChanges(): void {
    const status = this.getSyncStatus();
    this.updateSyncStatus({
      ...status,
      pendingChanges: true
    });
  }
}

export const syncManager = new SyncManager();
export type { SyncStatus };