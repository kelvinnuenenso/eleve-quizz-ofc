// Real Pixel System - FASE 2: PIXELS FUNCIONAIS
import { CustomEvent, PixelSettings } from '@/components/quiz/PixelsManager';
import { Quiz, Result, Lead } from '@/types/quiz';

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

    // Initialize UTMify
    if (settings.utmify?.enabled && settings.utmify.code) {
      this.initializeUTMify(settings.utmify.code);
    }

    // Initialize custom code
    if (settings.custom?.enabled && settings.custom.code) {
      this.executeCustomCode(settings.custom.code);
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

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
      document.head.appendChild(noscript);

      console.log('Facebook Pixel initialized:', pixelId);
    } catch (error) {
      console.error('Error initializing Facebook Pixel:', error);
    }
  }

  // Initialize UTMify
  private initializeUTMify(code: string) {
    try {
      // Execute UTMify code safely
      const script = document.createElement('script');
      script.innerHTML = code;
      document.head.appendChild(script);
      console.log('UTMify initialized');
    } catch (error) {
      console.error('Error initializing UTMify:', error);
    }
  }

  // Execute custom tracking code
  private executeCustomCode(code: string) {
    try {
      // Create a safe execution context
      const script = document.createElement('script');
      script.innerHTML = code;
      document.head.appendChild(script);
      console.log('Custom code executed');
    } catch (error) {
      console.error('Error executing custom code:', error);
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
        content_ids: [quiz.id],
        content_type: 'product',
        value: 0,
        currency: 'BRL'
      });
    }

    // Track custom events for quiz start trigger
    this.trackCustomEvents('quiz_start', {
      quiz_id: quiz.id,
      quiz_name: quiz.name,
      quiz_questions: quiz.questions?.length || 0
    });

    console.log('Quiz view tracked:', quiz.name);
  }

  // Track quiz start
  trackQuizStart(quiz: Quiz) {
    if (!this.isInitialized) return;

    // Facebook Pixel InitiateCheckout event (can be used for quiz start)
    if (this.shouldTrackFacebookEvent('InitiateCheckout')) {
      this.fireFacebookEvent('InitiateCheckout', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id],
        num_items: quiz.questions?.length || 0,
        value: 0,
        currency: 'BRL'
      });
    }

    console.log('Quiz start tracked:', quiz.name);
  }

  // Track question answer
  trackQuestionAnswer(quiz: Quiz, questionIndex: number, questionId: string, answer: any) {
    if (!this.isInitialized) return;

    // Track custom events for question answer trigger
    this.trackCustomEvents('question_answer', {
      quiz_id: quiz.id,
      question_index: questionIndex,
      question_id: questionId,
      answer: answer
    }, questionIndex.toString());

    console.log('Question answer tracked:', { questionIndex, questionId, answer });
  }

  // Track quiz completion
  trackQuizCompletion(quiz: Quiz, result: Result) {
    if (!this.isInitialized) return;

    // Facebook Pixel CompleteRegistration event
    if (this.shouldTrackFacebookEvent('CompleteRegistration')) {
      this.fireFacebookEvent('CompleteRegistration', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id],
        status: 'completed',
        value: result.score || 0,
        currency: 'BRL'
      });
    }

    // Track custom events for quiz complete trigger
    this.trackCustomEvents('quiz_complete', {
      quiz_id: quiz.id,
      result_id: result.id,
      score: result.score,
      outcome_key: result.outcomeKey,
      completion_time: result.completedAt
    });

    console.log('Quiz completion tracked:', { quiz: quiz.name, result: result.id });
  }

  // Track lead capture
  trackLeadCapture(quiz: Quiz, lead: Lead) {
    if (!this.isInitialized) return;

    // Facebook Pixel Lead event
    if (this.shouldTrackFacebookEvent('Lead')) {
      this.fireFacebookEvent('Lead', {
        content_name: quiz.name,
        content_category: 'Quiz',
        content_ids: [quiz.id],
        lead_event_source: 'website',
        value: 1,
        currency: 'BRL'
      });
    }

    console.log('Lead capture tracked:', { quiz: quiz.name, lead: lead.id });
  }

  // Track specific result
  trackSpecificResult(quiz: Quiz, result: Result, outcomeKey: string) {
    if (!this.isInitialized) return;

    // Track custom events for result specific trigger
    this.trackCustomEvents('result_specific', {
      quiz_id: quiz.id,
      result_id: result.id,
      outcome_key: outcomeKey,
      score: result.score
    }, outcomeKey);

    console.log('Specific result tracked:', { quiz: quiz.name, outcomeKey });
  }

  // Fire Facebook Pixel event
  private fireFacebookEvent(eventName: string, parameters: Record<string, any> = {}) {
    try {
      if (typeof (window as any).fbq === 'undefined') {
        console.warn('Facebook Pixel not initialized, cannot fire event:', eventName);
        return;
      }

      // Add UTM parameters to event data
      const eventData = {
        ...parameters,
        utm_source: this.utmParams.utm_source,
        utm_medium: this.utmParams.utm_medium,
        utm_campaign: this.utmParams.utm_campaign,
        utm_content: this.utmParams.utm_content,
        utm_term: this.utmParams.utm_term
      };

      // Remove undefined values
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

  // Track custom events
  private trackCustomEvents(trigger: string, eventData: Record<string, any>, triggerValue?: string) {
    if (!this.pixelSettings.facebook?.customMode?.enabled) return;

    const customEvents = this.pixelSettings.facebook?.customMode?.events || [];
    
    customEvents.forEach(event => {
      if (event.trigger === trigger) {
        // Check if trigger value matches (for question_answer and result_specific)
        if (triggerValue && event.triggerValue && event.triggerValue !== triggerValue) {
          return;
        }

        // Prepare event parameters
        const parameters = event.parameters.reduce((acc, param) => {
          if (param.key && param.value) {
            acc[param.key] = param.value;
          }
          return acc;
        }, {} as Record<string, any>);

        // Add context data
        const finalEventData = {
          ...parameters,
          ...eventData,
          trigger,
          trigger_value: triggerValue,
          timestamp: new Date().toISOString()
        };

        // Fire Facebook Pixel custom event
        if (this.pixelSettings.facebook?.enabled && this.pixelSettings.facebook?.pixelId) {
          this.fireFacebookEvent(event.name, finalEventData);
        }

        console.log('Custom event fired:', event.name, finalEventData);
      }
    });
  }

  // Fire custom tracking event (for other platforms)
  fireCustomEvent(eventName: string, eventData: Record<string, any> = {}) {
    try {
      // Custom event with UTM data
      const customEventData = {
        ...eventData,
        utm_params: this.utmParams,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        referrer: document.referrer
      };

      // Dispatch custom DOM event
      const customEvent = new CustomEvent('pixelEvent', {
        detail: {
          eventName,
          eventData: customEventData
        }
      });
      
      document.dispatchEvent(customEvent);

      // Log to console for debugging
      console.log('Custom pixel event fired:', eventName, customEventData);

      // If Google Analytics is available
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', eventName, customEventData);
      }

      // If dataLayer is available (Google Tag Manager)
      if (typeof (window as any).dataLayer !== 'undefined') {
        (window as any).dataLayer.push({
          event: eventName,
          ...customEventData
        });
      }
    } catch (error) {
      console.error('Error firing custom event:', error);
    }
  }

  // Get UTM parameters from URL
  static extractUTMParameters(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utmParams[param] = value;
      }
    });

    return utmParams;
  }

  // Persist UTM parameters in localStorage
  static persistUTMParameters(utmParams: Record<string, string>) {
    try {
      localStorage.setItem('quiz_utm_params', JSON.stringify(utmParams));
    } catch (error) {
      console.error('Error persisting UTM parameters:', error);
    }
  }

  // Get persisted UTM parameters
  static getPersistedUTMParameters(): Record<string, string> {
    try {
      const stored = localStorage.getItem('quiz_utm_params');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting persisted UTM parameters:', error);
      return {};
    }
  }

  // Test pixel functionality
  testPixels() {
    console.log('Testing pixel functionality...');
    
    if (this.pixelSettings.facebook?.enabled) {
      this.fireFacebookEvent('PageView', { test: true });
      console.log('Facebook Pixel test fired');
    }

    this.fireCustomEvent('test_event', { test: true });
    console.log('Custom event test fired');
  }
}

// Export singleton instance
export const realPixelSystem = new RealPixelSystem();