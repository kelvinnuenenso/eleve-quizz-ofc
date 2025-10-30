import { supabase } from '@/integrations/supabase/client';
import { Quiz } from '@/types/quiz';
import { saveQuiz as saveQuizToLocal } from './quizzes';
import { updateQuizRedirectSettings } from './supabaseQuiz';

/**
 * Save a quiz to Supabase with all its data including steps and redirect settings
 * @param quiz The quiz to save
 * @param userId The ID of the user saving the quiz
 * @returns Boolean indicating success or failure
 */
export async function saveQuizToSupabase(quiz: Quiz, userId: string): Promise<boolean> {
  try {
    console.log('Saving quiz to Supabase:', { quizId: quiz.id, userId });
    
    // Validate required fields
    if (!quiz.id) {
      throw new Error('Quiz ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
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

    // Try to include redirect_settings if it exists
    // IMPORTANT: Send as object, not stringified JSON
    let hasRedirectSettings = false;
    if (quiz.redirectSettings) {
      try {
        quizData.redirect_settings = quiz.redirectSettings;
        hasRedirectSettings = true;
      } catch (e) {
        console.warn('Could not include redirect_settings in main query');
      }
    }

    console.log('Prepared quiz data:', quizData);

    // Save the quiz data
    const { error: quizError } = await supabase
      .from('quizzes')
      .upsert(quizData, {
        onConflict: 'id'
      });

    // Handle schema cache errors for redirect_settings
    if (quizError) {
      console.error('Error saving quiz to Supabase:', quizError);
      if (quizError.message.includes('redirect_settings') && quizError.message.includes('schema cache')) {
        console.log('Retrying without redirect_settings column');
        delete quizData.redirect_settings;
        
        const { error: retryError } = await supabase
          .from('quizzes')
          .upsert(quizData, {
            onConflict: 'id'
          });
          
        if (retryError) {
          console.error('Retry failed:', retryError);
          return false;
        }
        
        // Update redirect_settings separately if it exists
        if (hasRedirectSettings) {
          try {
            await updateQuizRedirectSettings(quiz.id, quiz.redirectSettings);
          } catch (redirectError) {
            console.warn('Failed to update redirect settings separately:', redirectError);
          }
        }
      } else {
        return false;
      }
    } else if (hasRedirectSettings && !quizData.redirect_settings) {
      // Update redirect_settings separately if we removed it due to schema issues
      try {
        await updateQuizRedirectSettings(quiz.id, quiz.redirectSettings);
      } catch (redirectError) {
        console.warn('Failed to update redirect settings separately:', redirectError);
      }
    }

    console.log('Quiz saved to Supabase');

    // Save steps if they exist
    if (quiz.steps && quiz.steps.length > 0) {
      console.log('Saving steps to Supabase:', quiz.steps.length);
      
      // First, delete existing steps for this quiz
      // Using raw SQL to avoid TypeScript type issues
      const { error: deleteError } = await supabase
        .from('quiz_steps' as any)
        .delete()
        .eq('quiz_id', quiz.id);

      if (deleteError) {
        console.error('Error deleting existing steps:', deleteError);
        return false;
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
      // Using raw SQL to avoid TypeScript type issues
      const { error: stepsError } = await supabase
        .from('quiz_steps' as any)
        .insert(stepsToInsert as any);

      if (stepsError) {
        console.error('Error saving steps to Supabase:', stepsError);
        return false;
      }

      console.log('Steps saved to Supabase');
    }

    // Also save to local storage as backup
    try {
      await saveQuizToLocal(quiz);
      console.log('Quiz saved to local storage');
    } catch (localError) {
      console.warn('Failed to save quiz to local storage:', localError);
      // Don't throw here as this is just a backup
    }

    console.log('Quiz saved successfully to Supabase:', quiz.id);
    return true;
  } catch (error) {
    console.error('Error saving quiz to Supabase:', error);
    return false;
  }
}

/**
 * Publish a quiz by setting its status to 'published' and generating a public ID if needed
 * @param quiz The quiz to publish
 * @param userId The ID of the user publishing the quiz
 * @returns Object with success status and public ID or error message
 */
export async function publishQuizToSupabase(quiz: Quiz, userId: string): Promise<{ success: boolean; publicId?: string; error?: string }> {
  try {
    console.log('Publishing quiz:', { quizId: quiz.id, userId });
    
    // Generate public ID if not exists
    let publicId = quiz.publicId;
    if (!publicId) {
      // Simple public ID generation - in a real app you'd want something more robust
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
    const success = await saveQuizToSupabase(updatedQuiz, userId);
    
    if (success) {
      return {
        success: true,
        publicId
      };
    } else {
      return {
        success: false,
        error: 'Failed to save quiz to Supabase'
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
 * Load a quiz from Supabase by ID
 * @param quizId The ID of the quiz to load
 * @param userId The ID of the user loading the quiz
 * @returns The loaded quiz or null if not found
 */
export async function loadQuizFromSupabase(quizId: string, userId: string): Promise<Quiz | null> {
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
      return null;
    }

    console.log('Loaded quiz data:', quizData);

    // Load steps data
    // Using raw SQL to avoid TypeScript type issues
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
    return loadedQuiz;
  } catch (error) {
    console.error('Error loading quiz from Supabase:', error);
    return null;
  }
}