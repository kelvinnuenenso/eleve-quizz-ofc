// Real Pixel System - FASE 2: PIXELS FUNCIONAIS
import { Quiz, Result, Lead } from '@/types/quiz';

export interface QuizCustomEvent {
  id: string;
  name: string;
  parameters: { key: string; value: string }[];
  trigger: 'quiz_start' | 'question_answer' | 'quiz_complete' | 'result_specific';
  triggerValue?: string;
}

export interface PixelSettings {
  facebook?: {
    enabled: boolean;
    pixelId: string;
    standardEvents?: {
      enabled: boolean;
      events: string[];
    };
    customMode?: {
      enabled: boolean;
      events: QuizCustomEvent[];
    };
  };
  utmify?: {
    enabled: boolean;
    code: string;
  };
  custom?: {
    enabled: boolean;
    code: string;
    name?: string;
  };
}

export interface PixelEventData {
  eventName: string;
  parameters?: Record<string, any>;
  customData?: Record<string, any>;
}

class RealPixelSystem {
  private pixelSettings: PixelSettings = {};
  private utmParams: Record<string, string> = {};
  private isInitialized = false;

  // Initialize pixel system
  initialize(settings: PixelSettings, utmParams: Record<string, string> = {}) {
    this.pixelSettings = settings;
    this.utmParams = utmParams;
    
    // Validate and initialize Facebook Pixel
    if (settings.facebook?.enabled && settings.facebook.pixelId) {
      // Validate Facebook Pixel ID format
      if (this.isValidPixelId(settings.facebook.pixelId)) {
        this.initializeFacebookPixel(settings.facebook.pixelId);
      } else {
        console.warn('Invalid Facebook Pixel ID format:', settings.facebook.pixelId);
      }
    }
    
    // Inject custom pixel code
    if (settings.custom?.enabled && settings.custom.code) {
      this.injectCustomPixel(settings.custom.code);
    }
    
    // Inject UTMify code
    if (settings.utmify?.enabled && settings.utmify.code) {
      this.injectCustomPixel(settings.utmify.code);
    }

    this.isInitialized = true;
    console.log('Pixel system initialized', { settings, utmParams });
  }

  // Initialize Facebook Pixel
  private initializeFacebookPixel(pixelId: string) {
    try {
      // Check if fbq already exists
      if (typeof (window as any).fbq !== 'undefined') {
        console.log('Facebook Pixel already initialized');
        return;
      }

      // Create Facebook Pixel script
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
      `;
      
      document.head.appendChild(script);
      console.log('Facebook Pixel initialized:', pixelId);
    } catch (error) {
      console.error('Error initializing Facebook Pixel:', error);
    }
  }

  // Track quiz view
  trackQuizView(quiz: Quiz) {
    if (!this.isInitialized) return;

    // Facebook Pixel ViewContent event
    if (this.shouldTrackFacebookEvent('ViewContent')) {
      this.fireFacebookEvent('ViewContent', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id]
      });
    }
    
    // Fire custom events for quiz view
    this.fireCustomEvents('quiz_start', quiz);

    console.log('Quiz view tracked:', quiz.name);
  }

  // Track quiz start
  trackQuizStart(quiz: Quiz) {
    if (!this.isInitialized) return;
    
    // Facebook Pixel StartQuiz event
    if (this.shouldTrackFacebookEvent('StartQuiz')) {
      this.fireFacebookEvent('StartQuiz', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id]
      });
    }
    
    // Fire custom events for quiz start
    this.fireCustomEvents('quiz_start', quiz);
    
    console.log('Quiz start tracked:', quiz.name);
  }

  // Track question answer
  trackQuestionAnswer(quiz: Quiz, questionIndex: number, questionId: string, answer: any) {
    if (!this.isInitialized) return;
    
    // Facebook Pixel QuestionAnswered event
    if (this.shouldTrackFacebookEvent('QuestionAnswered')) {
      this.fireFacebookEvent('QuestionAnswered', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id],
        question_index: questionIndex,
        question_id: questionId,
        answer: answer
      });
    }
    
    // Fire custom events for question answer
    this.fireCustomEvents('question_answer', quiz, { questionIndex, questionId, answer });
    
    console.log('Question answer tracked:', { questionIndex, questionId, answer });
  }

  // Track quiz completion
  trackQuizCompletion(quiz: Quiz, result: any) {
    if (!this.isInitialized) return;

    // Facebook Pixel CompleteRegistration event
    if (this.shouldTrackFacebookEvent('CompleteRegistration')) {
      this.fireFacebookEvent('CompleteRegistration', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id]
      });
    }
    
    // Fire custom events for quiz completion
    this.fireCustomEvents('quiz_complete', quiz, { result });

    console.log('Quiz completion tracked:', { quiz: quiz.name });
  }

  // Track lead capture
  trackLeadCapture(quiz: Quiz, lead: any) {
    if (!this.isInitialized) return;

    // Facebook Pixel Lead event
    if (this.shouldTrackFacebookEvent('Lead')) {
      this.fireFacebookEvent('Lead', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id]
      });
    }
    
    // Fire custom events for lead capture
    this.fireCustomEvents('quiz_complete', quiz, { lead });

    console.log('Lead capture tracked:', { quiz: quiz.name });
  }

  // Track specific result
  trackSpecificResult(quiz: Quiz, result: any, outcomeKey: string) {
    if (!this.isInitialized) return;
    
    // Facebook Pixel SpecificResult event
    if (this.shouldTrackFacebookEvent('SpecificResult')) {
      this.fireFacebookEvent('SpecificResult', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id],
        outcome_key: outcomeKey
      });
    }
    
    // Fire custom events for specific result
    this.fireCustomEvents('result_specific', quiz, { result, outcomeKey });
    
    console.log('Specific result tracked:', { quiz: quiz.name, outcomeKey });
  }

  // Fire Facebook Pixel event
  private fireFacebookEvent(eventName: string, parameters: Record<string, any> = {}) {
    try {
      if (typeof (window as any).fbq === 'undefined') {
        console.warn('Facebook Pixel not initialized, cannot fire event:', eventName);
        return;
      }

      const eventData = { ...parameters, ...this.utmParams };
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined) {
          delete eventData[key];
        }
      });

      (window as any).fbq('track', eventName, eventData);
      console.log('Facebook Pixel event fired:', eventName, eventData);
    } catch (error) {
      console.error('Error firing Facebook Pixel event:', error);
    }
  }

  // Check if Facebook event should be tracked
  private shouldTrackFacebookEvent(eventName: string): boolean {
    return !!(
      this.pixelSettings.facebook?.enabled &&
      this.pixelSettings.facebook?.pixelId &&
      this.isValidPixelId(this.pixelSettings.facebook.pixelId) &&
      this.pixelSettings.facebook?.standardEvents?.enabled &&
      this.pixelSettings.facebook?.standardEvents?.events?.includes(eventName)
    );
  }

  // Get UTM parameters from URL
  extractUTMParameters(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      const value = urlParams.get(param);
      if (value) utmParams[param] = value;
    });
    return utmParams;
  }

  // Inject custom pixel code
  private injectCustomPixel(code: string) {
    try {
      // Create a script element and inject the code
      const script = document.createElement('script');
      script.innerHTML = code;
      document.head.appendChild(script);
      console.log('Custom pixel code injected');
    } catch (error) {
      console.error('Error injecting custom pixel code:', error);
    }
  }

  // Persist UTM parameters in localStorage
  persistUTMParameters(utmParams: Record<string, string>) {
    try {
      localStorage.setItem('quiz_utm_params', JSON.stringify(utmParams));
    } catch (error) {
      console.error('Error persisting UTM parameters:', error);
    }
  }

  // Get persisted UTM parameters
  getPersistedUTMParameters(): Record<string, string> {
    try {
      const stored = localStorage.getItem('quiz_utm_params');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting persisted UTM parameters:', error);
      return {};
    }
  }

  // Validate Facebook Pixel ID format
  private isValidPixelId(pixelId: string): boolean {
    // Facebook Pixel IDs are typically numeric
    return /^\d+$/.test(pixelId);
  }

  // Fire custom events based on trigger conditions
  private fireCustomEvents(trigger: string, quiz: any, data?: any) {
    if (!this.pixelSettings.facebook?.customMode?.enabled || !this.pixelSettings.facebook.customMode.events) {
      return;
    }

    // Find events that match the trigger
    const matchingEvents = this.pixelSettings.facebook.customMode.events.filter(event => event.trigger === trigger);
    
    matchingEvents.forEach(event => {
      try {
        // Validate event name
        if (!event.name || event.name.trim() === '') {
          console.warn('Skipping custom event with empty name');
          return;
        }
        
        // Check if trigger value matches (for question_answer and result_specific)
        if (trigger === 'question_answer' && event.triggerValue) {
          const questionIndex = data?.questionIndex;
          if (questionIndex !== parseInt(event.triggerValue) - 1) return; // Convert to 0-based index
        }
        
        if (trigger === 'result_specific' && event.triggerValue) {
          const outcomeKey = data?.outcomeKey;
          if (outcomeKey !== event.triggerValue) return;
        }
        
        // Build parameters
        const parameters: Record<string, any> = {};
        event.parameters.forEach(param => {
          // Validate parameter key and value
          if (param.key && param.key.trim() !== '') {
            parameters[param.key] = param.value;
          }
        });
        
        // Add UTM parameters
        Object.assign(parameters, this.utmParams);
        
        // Fire the custom event
        this.fireFacebookEvent(event.name, parameters);
      } catch (error) {
        console.error('Error firing custom event:', error);
      }
    });
  }
}

// Export singleton instance
export const realPixelSystem = new RealPixelSystem();