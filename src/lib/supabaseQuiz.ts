import { supabase } from '@/integrations/supabase/client';
import { Quiz } from '@/types/quiz';

// Helper function to check if a public ID already exists
export async function isPublicIdUnique(publicId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id')
      .eq('public_id', publicId)
      .single();
    
    // When no rows are found, Supabase returns an error with "0 rows" message
    // This means the public ID is unique
    if (error && error.message.includes('0 rows')) {
      return true;
    }
    
    // If we have data, the ID already exists (not unique)
    // If there's any other error, assume not unique to be safe
    return !data;
  } catch (error) {
    // If there's any unexpected error, assume the ID is unique to avoid blocking the process
    console.warn('Error checking public ID uniqueness:', error);
    return true;
  }
}

// Generate a unique public ID by checking for conflicts
export async function generateUniquePublicId(name: string): Promise<string> {
  let publicId: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5; // Limit attempts to prevent infinite loops
  
  do {
    publicId = generatePublicId(name);
    isUnique = await isPublicIdUnique(publicId);
    attempts++;
    
    // If we've tried too many times, add a timestamp to ensure uniqueness
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString(36);
      publicId = `${generatePublicId(name)}-${timestamp}`;
      isUnique = true; // Assume unique with timestamp
    }
  } while (!isUnique);
  
  return publicId;
}

export async function saveQuizToSupabase(quiz: Quiz): Promise<boolean> {
  try {
    // Save the quiz data
    // IMPORTANT: Supabase JSONB columns accept objects directly, not stringified JSON
    const quizData: any = {
      id: quiz.id,
      public_id: quiz.publicId,
      name: quiz.name,
      description: quiz.description,
      status: quiz.status,
      questions: quiz.questions || [],
      theme: quiz.theme || {},
      outcomes: quiz.outcomes || {},
      pixel_settings: quiz.pixelSettings || {},
      settings: quiz.settings || {},
      updated_at: new Date().toISOString()
    };

    const { error: quizError } = await supabase
      .from('quizzes')
      .upsert(quizData, {
        onConflict: 'id'
      });

    if (quizError) {
      console.error('Error saving quiz:', quizError);
      return false;
    }

    // Update redirect settings separately if they exist
    if (quiz.redirectSettings) {
      await updateQuizRedirectSettings(quiz.id, {
        enabled: quiz.redirectSettings?.enabled || false,
        url: quiz.redirectSettings?.url || '',
        overrideResults: quiz.redirectSettings?.overrideResults || false,
        redirect_type: quiz.redirectSettings?.redirect_type || 'url',
        whatsapp: quiz.redirectSettings?.whatsapp || {}
      });
    }

    // Save steps if they exist
    if (quiz.steps && quiz.steps.length > 0) {
      // First, delete existing steps for this quiz
      const { error: deleteError } = await supabase
        .from('quiz_steps' as any)  // Type assertion to bypass type checking
        .delete()
        .eq('quiz_id', quiz.id);

      if (deleteError) {
        console.error('Error deleting existing steps:', deleteError);
        return false;
      }

      // Prepare steps for insertion with proper data structure
      // IMPORTANT: data and components are JSONB columns, send as objects
      const stepsToInsert = quiz.steps.map((step, index) => {
        const stepData = step.data || {};
        const components = step.components || [];
        
        return {
          id: step.id,
          quiz_id: quiz.id,
          type: step.type,
          name: step.name || `Step ${index + 1}`,
          title: step.title || '',
          data: stepData,
          components: components,
          order: index
        };
      });

      // Insert all steps
      const { error: stepsError } = await supabase
        .from('quiz_steps' as any)  // Type assertion to bypass type checking
        .insert(stepsToInsert as any);  // Type assertion for the data

      if (stepsError) {
        console.error('Error saving steps:', stepsError);
        return false;
      }
    }

    console.log('Quiz saved successfully to Supabase:', quiz.id);
    return true;
  } catch (error) {
    console.error('Error saving quiz to Supabase:', error);
    return false;
  }
}

export async function publishQuiz(quiz: Quiz): Promise<{ success: boolean; publicId?: string; error?: string }> {
  try {
    // Validate quiz before publishing
    const validationErrors = validateQuizForPublishing(quiz);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`
      };
    }

    // Generate public ID if not exists or if we need to ensure uniqueness
    let publicId = quiz.publicId;
    if (!publicId) {
      publicId = await generateUniquePublicId(quiz.name);
      console.log('Generated new public ID:', publicId);
    } else {
      // Check if the existing public ID is unique, if not generate a new one
      const isUnique = await isPublicIdUnique(publicId);
      console.log('Checking public ID uniqueness:', publicId, 'isUnique:', isUnique);
      if (!isUnique) {
        publicId = await generateUniquePublicId(quiz.name);
        console.log('Generated unique public ID:', publicId);
      }
    }

    // Update quiz status and public ID
    const updatedQuiz = {
      ...quiz,
      publicId,
      status: 'published' as const,
      updatedAt: new Date().toISOString()
    };

    // Save to Supabase
    const success = await saveQuizToSupabase(updatedQuiz);
    
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

function validateQuizForPublishing(quiz: Quiz): string[] {
  const errors: string[] = [];
  
  if (!quiz.name?.trim()) {
    errors.push('Quiz name is required');
  }
  
  if (!quiz.steps || quiz.steps.length === 0) {
    errors.push('At least one step is required');
  }
  
  // Validate each step
  if (quiz.steps) {
    for (let i = 0; i < quiz.steps.length; i++) {
      const step = quiz.steps[i];
      if (!step.name?.trim()) {
        errors.push(`Step ${i + 1} name is required`);
      }
      
      // Validate lead registration steps
      if (step.type === 'lead_registration' && (!step.components || step.components.length === 0)) {
        errors.push(`Lead registration step '${step.name}' must have components`);
      }
    }
  }
  
  // Only validate empty steps for non-lead registration steps
  quiz.steps?.forEach((stage, index) => {
    // Allow lead registration steps to be empty as they're handled differently
    if (stage.type !== 'lead_registration' && stage.components.length === 0) {
      errors.push(`Etapa ${index + 1} está vazia`);
    }
  });
  
  // For publishing, we need at least a basic lead capture mechanism
  // But we won't block if it's missing - just warn
  const hasLeadStep = quiz.steps?.some(step => step.type === 'lead_registration' || step.type === 'custom_lead');
  if (!hasLeadStep && quiz.steps && quiz.steps.length > 0) {
    console.warn('Lead registration step is recommended for collecting user information');
  }
  
  // Check if redirect settings are configured (only warn, don't block)
  if (!quiz.redirectSettings?.enabled) {
    console.warn('Redirect settings are recommended for directing users after quiz completion');
  }
  
  return errors;
}

function generatePublicId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${slug}-${randomSuffix}`;
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d\+]/g, '');
  // URL encode the message
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export async function updateQuizRedirectSettings(quizId: string, redirectSettings: any): Promise<boolean> {
  try {
    // If it's a WhatsApp redirect, generate the URL
    if (redirectSettings.redirect_type === 'whatsapp' && redirectSettings.whatsapp) {
      const { phone, message } = redirectSettings.whatsapp;
      if (phone && message) {
        redirectSettings.url = generateWhatsAppUrl(phone, message);
      }
    }

    // Try to update redirect settings
    // Note: This might fail if the column doesn't exist in the current schema
    const updateData: any = {};
    updateData.redirect_settings = redirectSettings;

    const { error } = await supabase
      .from('quizzes')
      .update(updateData)
      .eq('id', quizId);

    if (error) {
      console.warn('Could not update redirect settings (column may not exist in schema):', error);
      // Don't return false here as this shouldn't block the publish process
    }

    return true;
  } catch (error) {
    console.warn('Error updating redirect settings:', error);
    // Don't return false here as this shouldn't block the publish process
    return true;
  }
}