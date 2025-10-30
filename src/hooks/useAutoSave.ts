import { useState, useEffect, useRef } from 'react';
import { Quiz } from '@/types/quiz';
import { saveQuizToSupabase } from '@/lib/supabaseQuiz';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveProps {
  quiz: Quiz;
  onSave?: () => void;
  delay?: number; // Debounce delay in milliseconds
}

export function useAutoSave({ quiz, onSave, delay = 3000 }: UseAutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const quizRef = useRef<Quiz>(quiz);

  // Update the quiz ref when quiz changes
  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  const triggerSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const success = await saveQuizToSupabase(quizRef.current);
      
      if (success) {
        setLastSaved(new Date());
        onSave?.();
        toast({
          title: 'Quiz salvo automaticamente',
          description: 'Suas alterações foram salvas com sucesso.',
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as alterações. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleSave = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, delay);
  };

  const cancelSave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSave();
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    scheduleSave,
    cancelSave,
    triggerSave,
  };
}