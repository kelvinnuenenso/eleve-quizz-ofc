// Script para gerar dados de analytics reais de teste
import { realAnalytics, AnalyticsEvent, QuizSession } from './analytics';
import { Quiz, Result, Lead } from '@/types/quiz';

export function generateTestAnalyticsData(quizId: string) {
  console.log('🚀 Gerando dados de analytics de teste para quiz:', quizId);
  
  // Simular dados dos últimos 7 dias
  const events: AnalyticsEvent[] = [];
  const sessions: QuizSession[] = [];
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Gerar dados para os últimos 7 dias
  for (let day = 6; day >= 0; day--) {
    const dayStart = now - (day * oneDay);
    const dayEnd = dayStart + oneDay;
    
    // Gerar entre 5-15 sessões por dia
    const sessionsPerDay = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < sessionsPerDay; i++) {
      const sessionId = crypto.randomUUID();
      const sessionStart = dayStart + Math.random() * oneDay;
      
      // Criar sessão
      const session: QuizSession = {
        id: sessionId,
        quizId,
        startTime: sessionStart,
        currentStep: 0,
        totalSteps: 4,
        stepStartTimes: { 0: sessionStart },
        stepEndTimes: {},
        answers: [],
        completed: Math.random() > 0.3, // 70% completion rate
        leadCaptured: Math.random() > 0.4, // 60% lead capture rate
        utmParams: {
          utm_source: ['google', 'facebook', 'direct', 'email'][Math.floor(Math.random() * 4)],
          utm_medium: ['cpc', 'social', 'organic', 'email'][Math.floor(Math.random() * 4)]
        },
        deviceInfo: {
          isMobile: Math.random() > 0.4,
          isTablet: Math.random() > 0.8,
          isDesktop: Math.random() > 0.6,
          os: ['Windows', 'iOS', 'Android', 'macOS'][Math.floor(Math.random() * 4)],
          browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
          screenWidth: 1920,
          screenHeight: 1080,
          viewportWidth: 1200,
          viewportHeight: 800
        }
      };
      
      sessions.push(session);
      
      // Evento de visualização
      events.push({
        id: crypto.randomUUID(),
        quizId,
        sessionId,
        eventType: 'view',
        eventData: { quizName: 'Quiz de Teste', totalQuestions: 4 },
        timestamp: new Date(sessionStart).toISOString(),
        deviceInfo: session.deviceInfo,
        utmParams: session.utmParams,
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      
      // Evento de início
      events.push({
        id: crypto.randomUUID(),
        quizId,
        sessionId,
        eventType: 'start',
        eventData: { quizName: 'Quiz de Teste', startTime: sessionStart },
        timestamp: new Date(sessionStart + 1000).toISOString(),
        deviceInfo: session.deviceInfo,
        utmParams: session.utmParams,
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      
      // Simular respostas às perguntas
      let currentTime = sessionStart + 2000;
      for (let q = 0; q < 4; q++) {
        const timeSpent = Math.random() * 30000 + 10000; // 10-40 segundos por pergunta
        currentTime += timeSpent;
        
        session.stepEndTimes[q] = currentTime;
        session.answers.push({
          questionId: `q${q + 1}`,
          value: ['Sim', 'Não', 'Talvez'][Math.floor(Math.random() * 3)]
        });
        
        events.push({
          id: crypto.randomUUID(),
          quizId,
          sessionId,
          eventType: 'question_answer',
          eventData: {
            stepIndex: q,
            questionId: `q${q + 1}`,
            questionType: 'multiple_choice',
            answer: session.answers[q].value,
            timeSpent: timeSpent,
            totalTimeElapsed: currentTime - sessionStart
          },
          timestamp: new Date(currentTime).toISOString(),
          deviceInfo: session.deviceInfo,
          utmParams: session.utmParams,
          referrer: 'https://google.com',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
      }
      
      // Se completou o quiz
      if (session.completed) {
        events.push({
          id: crypto.randomUUID(),
          quizId,
          sessionId,
          eventType: 'complete',
          eventData: {
            totalTime: currentTime - sessionStart,
            totalQuestions: 4,
            score: Math.floor(Math.random() * 100),
            outcomeKey: ['iniciante', 'intermediario', 'avancado'][Math.floor(Math.random() * 3)],
            answers: session.answers
          },
          timestamp: new Date(currentTime + 1000).toISOString(),
          deviceInfo: session.deviceInfo,
          utmParams: session.utmParams,
          referrer: 'https://google.com',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
      }
      
      // Se capturou lead
      if (session.leadCaptured && session.completed) {
        events.push({
          id: crypto.randomUUID(),
          quizId,
          sessionId,
          eventType: 'lead_capture',
          eventData: {
            leadId: crypto.randomUUID(),
            email: `test${i}@example.com`,
            name: `Usuário Teste ${i}`,
            captureTime: currentTime - sessionStart
          },
          timestamp: new Date(currentTime + 2000).toISOString(),
          deviceInfo: session.deviceInfo,
          utmParams: session.utmParams,
          referrer: 'https://google.com',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
      }
    }
  }
  
  // Salvar no localStorage
  const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
  const existingSessions = JSON.parse(localStorage.getItem('analytics_sessions') || '[]');
  
  // Filtrar eventos existentes do mesmo quiz para evitar duplicatas
  const filteredEvents = existingEvents.filter((e: AnalyticsEvent) => e.quizId !== quizId);
  const filteredSessions = existingSessions.filter((s: QuizSession) => s.quizId !== quizId);
  
  // Adicionar novos dados
  const allEvents = [...filteredEvents, ...events];
  const allSessions = [...filteredSessions, ...sessions];
  
  localStorage.setItem('analytics_events', JSON.stringify(allEvents));
  localStorage.setItem('analytics_sessions', JSON.stringify(allSessions));
  
  console.log(`✅ Gerados ${events.length} eventos e ${sessions.length} sessões para o quiz ${quizId}`);
  console.log(`📊 Estatísticas geradas:`);
  console.log(`- Visualizações: ${events.filter(e => e.eventType === 'view').length}`);
  console.log(`- Inícios: ${events.filter(e => e.eventType === 'start').length}`);
  console.log(`- Conclusões: ${events.filter(e => e.eventType === 'complete').length}`);
  console.log(`- Leads: ${events.filter(e => e.eventType === 'lead_capture').length}`);
  
  return {
    events: events.length,
    sessions: sessions.length,
    views: events.filter(e => e.eventType === 'view').length,
    starts: events.filter(e => e.eventType === 'start').length,
    completions: events.filter(e => e.eventType === 'complete').length,
    leads: events.filter(e => e.eventType === 'lead_capture').length
  };
}

// Função para limpar dados de teste
export function clearTestAnalyticsData(quizId?: string) {
  if (quizId) {
    // Limpar apenas dados de um quiz específico
    const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const existingSessions = JSON.parse(localStorage.getItem('analytics_sessions') || '[]');
    
    const filteredEvents = existingEvents.filter((e: AnalyticsEvent) => e.quizId !== quizId);
    const filteredSessions = existingSessions.filter((s: QuizSession) => s.quizId !== quizId);
    
    localStorage.setItem('analytics_events', JSON.stringify(filteredEvents));
    localStorage.setItem('analytics_sessions', JSON.stringify(filteredSessions));
    
    console.log(`🗑️ Dados de analytics do quiz ${quizId} removidos`);
  } else {
    // Limpar todos os dados
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_sessions');
    console.log('🗑️ Todos os dados de analytics removidos');
  }
}