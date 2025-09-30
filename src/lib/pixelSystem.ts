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
    
    // Initialize Facebook Pixel
    if (settings.facebook?.enabled && settings.facebook.pixelId) {
      this.initializeFacebookPixel(settings.facebook.pixelId);
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

    console.log('Quiz view tracked:', quiz.name);
  }

  // Track quiz start
  trackQuizStart(quiz: Quiz) {
    if (!this.isInitialized) return;
    console.log('Quiz start tracked:', quiz.name);
  }

  // Track question answer
  trackQuestionAnswer(quiz: Quiz, questionIndex: number, questionId: string, answer: any) {
    if (!this.isInitialized) return;
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

    console.log('Lead capture tracked:', { quiz: quiz.name });
  }

  // Track specific result
  trackSpecificResult(quiz: Quiz, result: any, outcomeKey: string) {
    if (!this.isInitialized) return;
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
}

// Export singleton instance
export const realPixelSystem = new RealPixelSystem();