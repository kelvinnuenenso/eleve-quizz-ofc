// Pixel tracking service for Facebook Pixel, Google Analytics, and custom scripts
interface PixelSettings {
  facebook?: {
    enabled: boolean;
    pixelId: string;
    standardEvents?: {
      enabled: boolean;
      events: string[];
    };
    customMode?: {
      enabled: boolean;
      events: CustomEvent[];
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

interface CustomEvent {
  id: string;
  name: string;
  parameters: { key: string; value: string }[];
  trigger: 'quiz_start' | 'question_answer' | 'quiz_complete' | 'result_specific';
  triggerValue?: string;
}

class PixelTrackingService {
  private initialized = false;
  private pixelSettings: PixelSettings | null = null;
  private utmParams: Record<string, string> = {};

  initialize(settings: PixelSettings, utmParams: Record<string, string> = {}) {
    this.pixelSettings = settings;
    this.utmParams = utmParams;
    this.initialized = true;
    
    // Initialize Facebook Pixel if enabled
    if (settings.facebook?.enabled && settings.facebook.pixelId) {
      this.initFacebookPixel(settings.facebook.pixelId);
    }
    
    // Initialize custom scripts if enabled
    if (settings.custom?.enabled && settings.custom.code) {
      this.initCustomScript(settings.custom.code);
    }
  }

  private initFacebookPixel(pixelId: string) {
    if (typeof window === 'undefined') return;
    
    // Facebook Pixel base code
    !(function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );
    
    // Initialize the pixel
    (window as any).fbq('init', pixelId);
    (window as any).fbq('track', 'PageView');
  }

  private initCustomScript(code: string) {
    if (typeof window === 'undefined') return;
    
    try {
      // Create a script element and append it to the head
      const script = document.createElement('script');
      script.innerHTML = code;
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error initializing custom pixel script:', error);
    }
  }

  trackQuizView(quiz: any) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track with Facebook Pixel
    if (this.pixelSettings.facebook?.enabled) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: quiz.name,
        content_ids: [quiz.id],
        content_type: 'quiz',
        ...this.utmParams
      });
    }
    
    // Track custom events
    this.trackCustomEvent('quiz_view', { quizId: quiz.id, quizName: quiz.name });
  }

  trackQuizStart(quiz: any) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track with Facebook Pixel
    if (this.pixelSettings.facebook?.enabled && this.pixelSettings.facebook.standardEvents?.enabled) {
      if (this.pixelSettings.facebook.standardEvents.events.includes('ViewContent')) {
        (window as any).fbq('track', 'ViewContent', {
          content_name: quiz.name,
          content_ids: [quiz.id],
          content_type: 'quiz',
          ...this.utmParams
        });
      }
    }
    
    // Track custom events
    this.trackCustomEvent('quiz_start', { quizId: quiz.id, quizName: quiz.name });
  }

  trackQuestionAnswer(quiz: any, questionIndex: number, questionId: string, answer: any) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track custom events
    this.trackCustomEvent('question_answer', { 
      quizId: quiz.id, 
      questionIndex, 
      questionId, 
      answer: typeof answer === 'object' ? JSON.stringify(answer) : answer 
    });
  }

  trackQuizCompletion(quiz: any, result: any) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track with Facebook Pixel
    if (this.pixelSettings.facebook?.enabled && this.pixelSettings.facebook.standardEvents?.enabled) {
      if (this.pixelSettings.facebook.standardEvents.events.includes('CompleteRegistration')) {
        (window as any).fbq('track', 'CompleteRegistration', {
          content_name: quiz.name,
          content_ids: [quiz.id],
          content_type: 'quiz',
          status: true,
          ...this.utmParams
        });
      }
    }
    
    // Track custom events
    this.trackCustomEvent('quiz_complete', { 
      quizId: quiz.id, 
      resultId: result.id, 
      score: result.score 
    });
  }

  trackLeadCapture(quiz: any, lead: any) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track with Facebook Pixel
    if (this.pixelSettings.facebook?.enabled && this.pixelSettings.facebook.standardEvents?.enabled) {
      if (this.pixelSettings.facebook.standardEvents.events.includes('Lead')) {
        (window as any).fbq('track', 'Lead', {
          content_name: quiz.name,
          content_ids: [quiz.id],
          content_type: 'quiz',
          ...this.utmParams
        });
      }
    }
    
    // Track custom events
    this.trackCustomEvent('lead_capture', { 
      quizId: quiz.id, 
      leadId: lead.id, 
      email: lead.email 
    });
  }

  trackSpecificResult(quiz: any, result: any, outcomeKey: string) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track custom events
    this.trackCustomEvent('specific_result', { 
      quizId: quiz.id, 
      resultId: result.id, 
      outcomeKey,
      score: result.score 
    });
  }

  private trackCustomEvent(eventName: string, data: any) {
    if (!this.initialized || !this.pixelSettings) return;
    
    // Track Facebook Custom Events
    if (this.pixelSettings.facebook?.customMode?.enabled) {
      const customEvents = this.pixelSettings.facebook.customMode.events;
      const matchingEvents = customEvents.filter(event => {
        switch (event.trigger) {
          case 'quiz_start':
            return eventName === 'quiz_start';
          case 'question_answer':
            return eventName === 'question_answer' && event.triggerValue === data.questionId;
          case 'quiz_complete':
            return eventName === 'quiz_complete';
          case 'result_specific':
            return eventName === 'specific_result' && event.triggerValue === data.outcomeKey;
          default:
            return false;
        }
      });
      
      matchingEvents.forEach(event => {
        const params: any = {
          ...this.utmParams
        };
        
        // Add custom parameters
        event.parameters.forEach(param => {
          params[param.key] = param.value;
        });
        
        (window as any).fbq('trackCustom', event.name, params);
      });
    }
    
    // Dispatch custom event for other trackers
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('quizPixelEvent', {
        detail: { eventName, data }
      });
      window.dispatchEvent(event);
    }
  }

  // Method to manually trigger custom events
  triggerCustomEvent(eventName: string, data: any = {}) {
    if (!this.initialized) return;
    
    this.trackCustomEvent(eventName, data);
  }
}

// Export singleton instance
export const pixelTracking = new PixelTrackingService();