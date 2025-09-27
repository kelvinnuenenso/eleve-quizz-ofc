import { DEMO_QUIZZES } from './demoData';
import { localDB } from './localStorage';
import { Quiz } from '@/types/quiz';

/**
 * Inicializa os dados demo no localStorage se não existirem
 */
export async function initializeDemoData(): Promise<void> {
  try {
    console.log('🚀 initializeDemoData called - START');
    
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('❌ localStorage not available, skipping demo data initialization');
      return;
    }
    console.log('✅ localStorage is available');

    // Verificar se já existem quizzes no localStorage
    const existingQuizzes = localDB.getAllQuizzes();
    console.log('📊 Existing quizzes count:', existingQuizzes.length);
    console.log('📋 Existing quizzes:', existingQuizzes.map(q => ({ id: q.id, publicId: q.publicId, title: q.title })));
    
    // Se não há quizzes ou não há o quiz demo específico, adicionar os dados demo
    const hasDemoQuiz = existingQuizzes.some(quiz => quiz.publicId === 'lead-magnet-digital');
    console.log('🎯 Has demo quiz (lead-magnet-digital):', hasDemoQuiz);
    
    if (!hasDemoQuiz) {
      console.log('🎯 Inicializando dados demo no localStorage...');
      
      // Adicionar cada quiz demo ao localStorage
      console.log('📦 DEMO_QUIZZES array:', DEMO_QUIZZES.length, 'quizzes');
      for (const demoQuiz of DEMO_QUIZZES) {
        console.log(`🔄 Processing quiz: ${demoQuiz.publicId}`);
        
        // Verificar se o quiz já existe antes de adicionar
        const existingQuiz = existingQuizzes.find(q => q.id === demoQuiz.id || q.publicId === demoQuiz.publicId);
        
        if (!existingQuiz) {
          console.log(`Saving demo quiz: ${demoQuiz.title} (${demoQuiz.publicId})`);
          const saveResult = localDB.saveQuiz(demoQuiz);
          
          if (saveResult) {
            console.log(`✅ Demo quiz saved successfully: ${demoQuiz.publicId}`);
            
            // Verify it was saved
            const savedQuizzes = localDB.getAllQuizzes();
            console.log(`Total quizzes after saving ${demoQuiz.publicId}:`, savedQuizzes.length);
            
            // Double-check the specific quiz exists
            const verifyQuiz = localDB.getQuizByPublicId(demoQuiz.publicId);
            console.log(`Verification - Quiz ${demoQuiz.publicId} exists:`, !!verifyQuiz);
          } else {
            console.error(`❌ Failed to save demo quiz: ${demoQuiz.publicId}`);
          }
        } else {
          console.log('⏭️ Quiz already exists, skipping:', demoQuiz.publicId);
        }
      }
      
      // Verify data was saved
      const updatedQuizzes = localDB.getAllQuizzes();
      console.log('Quizzes after save:', updatedQuizzes.length);
      
      const demoQuizExists = updatedQuizzes.some(quiz => quiz.publicId === 'lead-magnet-digital');
      console.log('Demo quiz exists after save:', demoQuizExists);
      
      console.log('🚀 Dados demo inicializados com sucesso!');
    } else {
      console.log('✅ Dados demo já existem no localStorage');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar dados demo:', error);
  }
}

/**
 * Força a reinicialização dos dados demo (útil para desenvolvimento)
 */
export function reinitializeDemoData(): void {
  try {
    console.log('🔄 Reinicializando dados demo...');
    
    // Remover quizzes demo existentes
    const existingQuizzes = localDB.getAllQuizzes();
    const demoQuizIds = DEMO_QUIZZES.map(q => q.id);
    
    existingQuizzes.forEach(quiz => {
      if (demoQuizIds.includes(quiz.id)) {
        localDB.deleteQuiz(quiz.id);
      }
    });
    
    // Adicionar novamente os dados demo
    DEMO_QUIZZES.forEach((demoQuiz: Quiz) => {
      localDB.saveQuiz(demoQuiz);
      console.log(`✅ Quiz demo readicionado: ${demoQuiz.name} (${demoQuiz.publicId})`);
    });
    
    console.log('🚀 Dados demo reinicializados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao reinicializar dados demo:', error);
  }
}

/**
 * Verifica se os dados demo estão disponíveis
 */
export function checkDemoDataAvailability(): boolean {
  try {
    const existingQuizzes = localDB.getAllQuizzes();
    return existingQuizzes.some(quiz => quiz.publicId === 'lead-magnet-digital');
  } catch (error) {
    console.error('❌ Erro ao verificar disponibilidade dos dados demo:', error);
    return false;
  }
}