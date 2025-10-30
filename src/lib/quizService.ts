import { supabase } from '@/integrations/supabase/client';
import { Quiz } from '@/types/quiz';
import { saveQuiz as saveQuizToLocal } from './quizzes';

/**
 * Comprehensive service for quiz operations
 */
class QuizService {
  /**
   * Save a quiz to Supabase with all its data
   */
  async saveQuiz(quiz: Quiz, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving quiz:', { quizId: quiz.id, userId });
      
      // Validate required fields
      if (!quiz.id) {
        return { success: false, error: 'Quiz ID is required' };
      }
      
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Prepare quiz data for Supabase
      // IMPORTANT: Supabase JSONB columns accept objects directly, not stringified JSON
      const quizData: any = {
        id: quiz.id,
        user_id: userId,
        public_id: quiz.publicId || null,
        name: quiz.name || 'Untitled Quiz',
        description: quiz.description || null,
        status: quiz.status || 'draft',
        questions: quiz.questions || [],
        theme: quiz.theme || {},
        outcomes: quiz.outcomes || {},
        pixel_settings: quiz.pixelSettings || {},
        settings: quiz.settings || {},
        updated_at: new Date().toISOString()
      };

      // Try to add redirect_settings if it exists in the quiz
      // IMPORTANT: Send as object, not stringified JSON
      let hasRedirectSettings = false;
      if (quiz.redirectSettings) {
        try {
          quizData.redirect_settings = quiz.redirectSettings;
          hasRedirectSettings = true;
        } catch (e) {
          console.warn('Could not include redirect_settings in main query, will update separately');
        }
      }

      console.log('Prepared quiz data:', quizData);

      // Save the quiz data
      const { error: quizError } = await supabase
        .from('quizzes')
        .upsert(quizData, {
          onConflict: 'id'
        });

      if (quizError) {
        console.error('Error saving quiz to Supabase:', quizError);
        // If it's a schema cache error for redirect_settings, try without it
        if (quizError.message.includes('redirect_settings') && quizError.message.includes('schema cache')) {
          console.log('Retrying without redirect_settings column');
          delete quizData.redirect_settings;
          
          const { error: retryError } = await supabase
            .from('quizzes')
            .upsert(quizData, {
              onConflict: 'id'
            });
            
          if (retryError) {
            return { success: false, error: `Failed to save quiz: ${retryError.message}` };
          }
          
          // If successful, update redirect_settings separately if it exists
          if (hasRedirectSettings) {
            await this.updateRedirectSettingsSeparately(quiz.id, quiz.redirectSettings);
          }
        } else {
          return { success: false, error: `Failed to save quiz: ${quizError.message}` };
        }
      } else if (hasRedirectSettings && !quizData.redirect_settings) {
        // If we removed redirect_settings due to schema issues, update it separately
        await this.updateRedirectSettingsSeparately(quiz.id, quiz.redirectSettings);
      }

      console.log('Quiz saved to Supabase');

      // Save steps if they exist
      if (quiz.steps && quiz.steps.length > 0) {
        console.log('Saving steps to Supabase:', quiz.steps.length);
        
        try {
          // First, delete existing steps for this quiz
          // Using type assertion because quiz_steps table types may not be generated yet
          const { error: deleteError } = await supabase
            .from('quiz_steps' as any)
            .delete()
            .eq('quiz_id', quiz.id);

          if (deleteError) {
            console.error('Error deleting existing steps:', deleteError);
            
            // Check if it's a table not found error
            if (deleteError.message.includes('Could not find the table') || 
                deleteError.message.includes('relation') && deleteError.message.includes('does not exist')) {
              return { 
                success: false, 
                error: '❌ Tabela quiz_steps não encontrada no banco de dados. Execute o script FIX_QUIZ_STEPS_TABLE.sql no SQL Editor do Supabase primeiro!' 
              };
            }
            
            return { success: false, error: `Failed to delete existing steps: ${deleteError.message}` };
          }

          // Prepare steps for insertion
          // IMPORTANT: data and components are JSONB columns, send as objects
          const stepsToInsert = quiz.steps.map((step, index) => {
            // Remove 'step-' prefix if present, ensure valid UUID
            let cleanId = step.id || crypto.randomUUID();
            if (cleanId.startsWith('step-')) {
              cleanId = cleanId.replace('step-', '');
            }
            
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(cleanId)) {
              console.warn(`Invalid UUID detected for step: ${cleanId}, generating new one`);
              cleanId = crypto.randomUUID();
            }
                    
            return {
              id: cleanId,
              quiz_id: quiz.id,
              type: step.type || 'question',
              name: step.name || `Step ${index + 1}`,
              title: step.title || '',
              data: step.data || {},
              components: step.components || [],
              order: index
            };
          });

          console.log('Prepared steps data:', stepsToInsert);

          // Insert all steps
          // Using type assertion because quiz_steps table types may not be generated yet
          const { error: stepsError } = await supabase
            .from('quiz_steps' as any)
            .insert(stepsToInsert as any);

          if (stepsError) {
            console.error('Error saving steps to Supabase:', stepsError);
            
            // Check if it's a table not found error
            if (stepsError.message.includes('Could not find the table') || 
                stepsError.message.includes('relation') && stepsError.message.includes('does not exist')) {
              return { 
                success: false, 
                error: '❌ Tabela quiz_steps não encontrada no banco de dados. Execute o script FIX_QUIZ_STEPS_TABLE.sql no SQL Editor do Supabase primeiro!' 
              };
            }
            
            return { success: false, error: `Failed to save steps: ${stepsError.message}` };
          }

          console.log('Steps saved to Supabase');
        } catch (stepError) {
          console.error('Unexpected error saving steps:', stepError);
          return { 
            success: false, 
            error: `Unexpected error with steps: ${stepError instanceof Error ? stepError.message : 'Unknown error'}` 
          };
        }
      }

      // Also save to local storage as backup
      try {
        await saveQuizToLocal(quiz);
        console.log('Quiz saved to local storage');
      } catch (localError) {
        console.warn('Failed to save quiz to local storage:', localError);
        // Don't fail the operation if local storage fails
      }

      console.log('Quiz saved successfully:', quiz.id);
      return { success: true };
    } catch (error) {
      console.error('Error saving quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Update redirect settings separately to avoid schema cache issues
   */
  private async updateRedirectSettingsSeparately(quizId: string, redirectSettings: any): Promise<void> {
    try {
      console.log('Updating redirect settings separately for quiz:', quizId);
      
      // Using type assertion because redirect_settings may not be in generated types
      const { error } = await supabase
        .from('quizzes')
        .update({ 
          redirect_settings: redirectSettings
        } as any)
        .eq('id', quizId);
        
      if (error) {
        console.warn('Could not update redirect_settings separately:', error.message);
      } else {
        console.log('Successfully updated redirect_settings for quiz:', quizId);
      }
    } catch (error) {
      console.warn('Error updating redirect_settings:', error);
    }
  }

  /**
   * Publish a quiz
   */
  async publishQuiz(quiz: Quiz, userId: string): Promise<{ success: boolean; publicId?: string; error?: string }> {
    try {
      console.log('Publishing quiz:', { quizId: quiz.id, userId });
      
      // Generate public ID if not exists
      let publicId = quiz.publicId;
      if (!publicId) {
        // Simple public ID generation
        publicId = `${quiz.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
        console.log('Generated new public ID:', publicId);
      }

      // Update quiz status and public ID
      const updatedQuiz = {
        ...quiz,
        publicId,
        status: 'published' as const,
        updatedAt: new Date().toISOString()
      };

      console.log('Updated quiz for publishing:', updatedQuiz);

      // Save to Supabase
      const saveResult = await this.saveQuiz(updatedQuiz, userId);
      
      if (saveResult.success) {
        return {
          success: true,
          publicId
        };
      } else {
        return {
          success: false,
          error: saveResult.error
        };
      }
    } catch (error) {
      console.error('Error publishing quiz:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Load a quiz from Supabase
   */
  async loadQuiz(quizId: string, userId: string): Promise<{ quiz: Quiz | null; error?: string }> {
    try {
      console.log('Loading quiz from Supabase:', { quizId, userId });
      
      // Load quiz data
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', userId)
        .single();

      if (quizError || !quizData) {
        console.error('Error loading quiz from Supabase:', quizError);
        return { quiz: null, error: quizError?.message || 'Quiz not found' };
      }

      console.log('Loaded quiz data:', quizData);

      // Load steps data
      // Using type assertion because quiz_steps table types may not be generated yet
      const { data: stepsData, error: stepsError } = await supabase
        .from('quiz_steps' as any)
        .select('*')
        .eq('quiz_id', quizId)
        .order('order', { ascending: true });

      console.log('Loaded steps data:', stepsData, stepsError);

      // Transform Supabase data to Quiz format
      // IMPORTANT: JSONB columns come as objects, not strings
      // Using type assertions to handle Json type from Supabase
      const loadedQuiz: Quiz = {
        id: quizData.id,
        publicId: quizData.public_id,
        name: quizData.name,
        description: quizData.description,
        status: quizData.status as 'draft' | 'published' | 'archived',
        theme: (quizData.theme as any) || {},
        settings: (quizData.settings as any) || {},
        questions: (quizData.questions as any) || [],
        outcomes: (quizData.outcomes as any) || {},
        pixelSettings: (quizData.pixel_settings as any) || {},
        redirectSettings: (quizData as any).redirect_settings || {},
        // Add steps if they exist
        steps: stepsData && !stepsError 
          ? stepsData.map((step: any) => ({
              id: step.id,
              type: step.type as 'question' | 'result' | 'custom_lead' | 'lead_registration',
              name: step.name,
              title: step.title || '',
              components: step.components || [],
              data: step.data || {}
            }))
          : [],
        createdAt: quizData.created_at,
        updatedAt: quizData.updated_at
      };
      
      console.log('Transformed quiz data:', loadedQuiz);
      return { quiz: loadedQuiz };
    } catch (error) {
      console.error('Error loading quiz from Supabase:', error);
      return { quiz: null, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Create a new quiz
   */
  createNewQuiz(name: string): Quiz {
    return {
      id: crypto.randomUUID(),
      publicId: '',
      name: name || 'Novo Quiz',
      description: '',
      status: 'draft',
      questions: [],
      outcomes: {},
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const quizService = new QuizService();