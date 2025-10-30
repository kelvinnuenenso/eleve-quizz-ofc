// Real Analytics System - FASE 1: COLETA REAL DE DADOS
import { Quiz, Result, Lead, QuizAnswer } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AnalyticsEvent {
  id: string;
  quizId: string;
  sessionId: string;
  eventType: 'view' | 'start' | 'question_view' | 'question_answer' | 'drop_off' | 'complete' | 'lead_capture';
  eventData: any;
  timestamp: string;
  userId?: string;
  deviceInfo?: DeviceInfo;
  utmParams?: Record<string, string>;
  referrer?: string;
  userAgent?: string;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface QuizSession {
  id: string;
  quizId: string;
  startTime: number;
  currentStep: number;
  totalSteps: number;
  stepStartTimes: Record<number, number>;
  stepEndTimes: Record<number, number>;
  answers: QuizAnswer[];
  dropOffPoint?: number;
  completed: boolean;
  leadCaptured: boolean;
  utmParams?: Record<string, string>;
  deviceInfo?: DeviceInfo;
}

class RealAnalyticsSystem {
  private currentSession: QuizSession | null = null;
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;

  // Set user ID for analytics
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  // Initialize session when quiz starts
  initializeSession(quiz: Quiz, utmParams: Record<string, string> = {}): string {
    const sessionId = crypto.randomUUID();
    const deviceInfo = this.getDeviceInfo();
    
    this.currentSession = {
      id: sessionId,
      quizId: quiz.id,
      startTime: Date.now(),
      currentStep: 0,
      totalSteps: quiz.questions?.length || 0,
      stepStartTimes: { 0: Date.now() },
      stepEndTimes: {},
      answers: [],
      completed: false,
      leadCaptured: false,
      utmParams,
      deviceInfo
    };

    // Track quiz view
    this.trackEvent('view', {
      quizName: quiz.name,
      totalQuestions: quiz.questions?.length || 0
    });

    // Track quiz start
    this.trackEvent('start', {
      quizName: quiz.name,
      startTime: this.currentSession.startTime
    });

    this.persistSession();
    return sessionId;
  }

  // Track step/question view
  async trackQuestionView(stepIndex: number, question: any) {
    if (!this.currentSession) return;

    // End previous step timing
    if (this.currentSession.currentStep !== stepIndex && this.currentSession.stepStartTimes[this.currentSession.currentStep]) {
      this.currentSession.stepEndTimes[this.currentSession.currentStep] = Date.now();
    }

    // Start new step timing
    this.currentSession.currentStep = stepIndex;
    this.currentSession.stepStartTimes[stepIndex] = Date.now();

    await this.trackEvent('question_view', {
      stepIndex,
      questionId: question.id,
      questionType: question.type,
      questionTitle: question.title
    });

    await this.persistSession();
  }

  // Track question answer
  async trackQuestionAnswer(stepIndex: number, question: any, answer: any, timeSpent: number) {
    if (!this.currentSession) return;

    const newAnswer = {
      questionId: question.id,
      value: answer
    };

    this.currentSession.answers.push(newAnswer);
    this.currentSession.stepEndTimes[stepIndex] = Date.now();

    await this.trackEvent('question_answer', {
      stepIndex,
      questionId: question.id,
      questionType: question.type,
      answer,
      timeSpent,
      totalTimeElapsed: Date.now() - this.currentSession.startTime
    });

    await this.persistSession();
  }

  // Track drop off
  async trackDropOff(stepIndex: number, reason?: string) {
    if (!this.currentSession) return;

    this.currentSession.dropOffPoint = stepIndex;

    await this.trackEvent('drop_off', {
      stepIndex,
      reason,
      timeSpent: Date.now() - this.currentSession.startTime,
      completionPercentage: (stepIndex / this.currentSession.totalSteps) * 100
    });

    await this.persistSession();
  }

  // Track quiz completion
  async trackCompletion(result: Result) {
    if (!this.currentSession) return;

    this.currentSession.completed = true;
    this.currentSession.stepEndTimes[this.currentSession.currentStep] = Date.now();

    const totalTime = Date.now() - this.currentSession.startTime;

    await this.trackEvent('complete', {
      totalTime,
      totalQuestions: this.currentSession.totalSteps,
      score: result.score,
      outcomeKey: result.outcomeKey,
      answers: result.answers
    });

    await this.persistSession();
  }

  // Track lead capture
  async trackLeadCapture(lead: Lead) {
    if (!this.currentSession) return;

    this.currentSession.leadCaptured = true;

    await this.trackEvent('lead_capture', {
      leadId: lead.id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      captureTime: Date.now() - this.currentSession.startTime
    });

    await this.persistSession();
  }

  // Generic event tracking
  private async trackEvent(eventType: AnalyticsEvent['eventType'], eventData: any) {
    if (!this.currentSession) return;

    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      quizId: this.currentSession.quizId,
      sessionId: this.currentSession.id,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      deviceInfo: this.currentSession.deviceInfo,
      utmParams: this.currentSession.utmParams,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };

    this.events.push(event);
    await this.persistEvents();
  }

  // Persist session to Supabase
  private async persistSession() {
    if (!this.currentSession) return;
    
    try {
      const { error } = await supabase
        .from('analytics_sessions')
        .upsert({
          session_id: this.currentSession.id,
          quiz_id: this.currentSession.quizId,
          user_id: this.userId,
          start_time: this.currentSession.startTime,
          current_step: this.currentSession.currentStep,
          total_steps: this.currentSession.totalSteps,
          step_start_times: this.currentSession.stepStartTimes,
          step_end_times: this.currentSession.stepEndTimes,
          answers: this.currentSession.answers,
          drop_off_point: this.currentSession.dropOffPoint,
          completed: this.currentSession.completed,
          lead_captured: this.currentSession.leadCaptured,
          utm_params: this.currentSession.utmParams,
          device_info: this.currentSession.deviceInfo
        });
      
      if (error) {
        console.error('Error persisting session to Supabase:', error);
      } else {
        console.log('Analytics session saved:', this.currentSession.id);
      }
    } catch (error) {
      console.error('Error persisting session:', error);
    }
  }

  // Persist events to Supabase
  private async persistEvents() {
    try {
      // Save all new events to Supabase
      const newEvents = this.events.filter(event => !event.id.includes('saved-'));
      
      if (newEvents.length > 0) {
        const eventsToSave = newEvents.map(event => ({
          quiz_id: event.quizId,
          session_id: event.sessionId,
          user_id: this.userId,
          event_type: event.eventType,
          event_data: event.eventData,
          device_info: event.deviceInfo,
          utm_params: event.utmParams,
          referrer: event.referrer,
          user_agent: event.userAgent
        }));
        
        const { error } = await supabase
          .from('analytics_events')
          .insert(eventsToSave);
        
        if (error) {
          console.error('Error saving events to Supabase:', error);
        } else {
          console.log('Analytics events saved:', newEvents.length);
          // Mark events as saved
          newEvents.forEach(event => {
            event.id = `saved-${event.id}`;
          });
        }
      }
    } catch (error) {
      console.error('Error persisting events:', error);
    }
  }

  // Get device information
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent) && !isMobile;
    const isDesktop = !isMobile && !isTablet;

    let os = 'Unknown';
    if (userAgent.includes('windows')) os = 'Windows';
    else if (userAgent.includes('mac')) os = 'macOS';
    else if (userAgent.includes('linux')) os = 'Linux';
    else if (userAgent.includes('android')) os = 'Android';
    else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) os = 'iOS';

    let browser = 'Unknown';
    if (userAgent.includes('chrome')) browser = 'Chrome';
    else if (userAgent.includes('firefox')) browser = 'Firefox';
    else if (userAgent.includes('safari')) browser = 'Safari';
    else if (userAgent.includes('edge')) browser = 'Edge';

    return {
      isMobile,
      isTablet,
      isDesktop,
      os,
      browser,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  // Get analytics data for dashboard from Supabase
  async getAnalyticsData(quizId: string, userId: string, dateRangeStart?: Date, dateRangeEnd?: Date) {
    try {
      // Fetch events from Supabase
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', userId);
      
      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return null;
      }

      // Fetch sessions from Supabase
      const { data: sessions, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', userId);
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return null;
      }

      // Apply date filter if provided
      const filteredEvents = dateRangeStart || dateRangeEnd 
        ? events.filter((e: any) => {
            const eventDate = new Date(e.created_at);
            if (dateRangeStart && eventDate < dateRangeStart) return false;
            if (dateRangeEnd && eventDate > dateRangeEnd) return false;
            return true;
          })
        : events;

      const filteredSessions = dateRangeStart || dateRangeEnd
        ? sessions.filter((s: any) => {
            const sessionDate = new Date(s.created_at);
            if (dateRangeStart && sessionDate < dateRangeStart) return false;
            if (dateRangeEnd && sessionDate > dateRangeEnd) return false;
            return true;
          })
        : sessions;

      // Calculate metrics
      const totalViews = filteredEvents.filter((e: any) => e.event_type === 'view').length;
      const totalStarts = filteredEvents.filter((e: any) => e.event_type === 'start').length;
      const totalCompletions = filteredEvents.filter((e: any) => e.event_type === 'complete').length;
      const totalLeads = filteredEvents.filter((e: any) => e.event_type === 'lead_capture').length;
      const totalDropOffs = filteredEvents.filter((e: any) => e.event_type === 'drop_off').length;

      const conversionRate = totalStarts > 0 ? Math.round((totalLeads / totalStarts) * 100) : 0;
      const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0;
      const dropOffRate = totalStarts > 0 ? Math.round((totalDropOffs / totalStarts) * 100) : 0;

      // Calculate average completion time
      const completedSessions = filteredSessions.filter((s: any) => s.completed);
      const avgCompletionTime = completedSessions.length > 0 
        ? completedSessions.reduce((acc: number, s: any) => {
            const lastStepTime = Math.max(...Object.values(s.step_end_times));
            return acc + (lastStepTime - s.start_time);
          }, 0) / completedSessions.length / 1000 / 60 // Convert to minutes
        : 0;

      // Device breakdown
      const deviceBreakdown = this.calculateDeviceBreakdown(filteredSessions);

      // Time spent per question
      const timeSpentData = this.calculateTimeSpentPerQuestion(filteredSessions);

      // Drop-off analysis
      const dropOffPoints = this.calculateDropOffPoints(filteredSessions);

      // Daily data for the last 7 days
      const dailyData = this.calculateDailyData(filteredEvents);

      return {
        totalViews,
        totalStarts,
        totalCompletions,
        totalLeads,
        conversionRate,
        completionRate,
        dropOffRate,
        avgCompletionTime,
        deviceBreakdown,
        timeSpentData,
        dropOffPoints,
        dailyData,
        rawEvents: filteredEvents,
        rawSessions: filteredSessions
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return null;
    }
  }

  private calculateDeviceBreakdown(sessions: QuizSession[]) {
    const breakdown = {
      mobile: 0,
      tablet: 0,
      desktop: 0
    };

    sessions.forEach(session => {
      if (session.deviceInfo?.isMobile) breakdown.mobile++;
      else if (session.deviceInfo?.isTablet) breakdown.tablet++;
      else if (session.deviceInfo?.isDesktop) breakdown.desktop++;
    });

    const total = sessions.length;
    return [
      { 
        device: 'Mobile', 
        count: breakdown.mobile, 
        percentage: total > 0 ? Math.round((breakdown.mobile / total) * 100) : 0 
      },
      { 
        device: 'Desktop', 
        count: breakdown.desktop, 
        percentage: total > 0 ? Math.round((breakdown.desktop / total) * 100) : 0 
      },
      { 
        device: 'Tablet', 
        count: breakdown.tablet, 
        percentage: total > 0 ? Math.round((breakdown.tablet / total) * 100) : 0 
      }
    ];
  }

  private calculateTimeSpentPerQuestion(sessions: QuizSession[]) {
    const questionTimes: Record<number, number[]> = {};

    sessions.forEach(session => {
      for (let step = 0; step < session.totalSteps; step++) {
        const startTime = session.stepStartTimes[step];
        const endTime = session.stepEndTimes[step];
        
        if (startTime && endTime) {
          const timeSpent = (endTime - startTime) / 1000; // Convert to seconds
          if (!questionTimes[step]) questionTimes[step] = [];
          questionTimes[step].push(timeSpent);
        }
      }
    });

    return Object.entries(questionTimes).map(([step, times]) => ({
      question: `Pergunta ${parseInt(step) + 1}`,
      avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    }));
  }

  private calculateDropOffPoints(sessions: QuizSession[]) {
    const dropOffCounts: Record<number, number> = {};
    const totalStarted = sessions.length;

    sessions.forEach(session => {
      if (session.dropOffPoint !== undefined) {
        dropOffCounts[session.dropOffPoint] = (dropOffCounts[session.dropOffPoint] || 0) + 1;
      }
    });

    return Object.entries(dropOffCounts).map(([step, count]) => ({
      step: parseInt(step) + 1,
      dropoffRate: totalStarted > 0 ? Math.round((count / totalStarted) * 100) : 0
    }));
  }

  private calculateDailyData(events: AnalyticsEvent[]) {
    const dailyStats: Record<string, any> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        date: dateStr,
        views: 0,
        starts: 0,
        completions: 0,
        leads: 0
      };
    }

    // Count events by day
    events.forEach(event => {
      const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
      if (dailyStats[eventDate]) {
        switch (event.eventType) {
          case 'view':
            dailyStats[eventDate].views++;
            break;
          case 'start':
            dailyStats[eventDate].starts++;
            break;
          case 'complete':
            dailyStats[eventDate].completions++;
            break;
          case 'lead_capture':
            dailyStats[eventDate].leads++;
            break;
        }
      }
    });

    return Object.values(dailyStats);
  }

  // Clear analytics data (for testing)
  clearAnalyticsData() {
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_sessions');
    this.events = [];
    this.currentSession = null;
  }
}

// Export singleton instance
export const realAnalytics = new RealAnalyticsSystem();