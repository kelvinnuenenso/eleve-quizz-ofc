import { useState } from 'react';
import { responsesApi } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { errorHandler } from '@/lib/errorHandling';
import type { Result, QuizAnswer } from '@/types/quiz';

interface QuizResponseData {
  quizId: string;
  answers: QuizAnswer[];
  completedAt?: string;
  score?: number;
  outcomeKey?: string;
  sessionId?: string;
  utm?: Record<string, string>;
  meta?: Record<string, any>;
}

interface QuizResponseHandlerProps {
  quizId: string;
  onResponseSaved?: (responseId: string) => void;
}

export const QuizResponseHandler = ({ quizId, onResponseSaved }: QuizResponseHandlerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const saveResponse = async (responseData: QuizResponseData) => {
    if (!user) {
      console.warn('User not authenticated, cannot save response to Supabase');
      return null;
    }

    setSaving(true);
    try {
      const resultData: Omit<Result, 'id' | 'createdAt'> = {
        quizId: responseData.quizId,
        userId: user.id,
        startedAt: new Date().toISOString(),
        completedAt: responseData.completedAt || new Date().toISOString(),
        score: responseData.score || 0,
        answers: responseData.answers,
        outcomeKey: responseData.outcomeKey,
        sessionId: responseData.sessionId,
        utm: responseData.utm,
        meta: responseData.meta
      };

      const response = await responsesApi.create(resultData);

      if (onResponseSaved) {
        onResponseSaved(response.id);
      }

      toast({
        title: "Resposta salva!",
        description: "Sua resposta foi salva com sucesso."
      });

      return response;
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'QuizResponseHandler.saveResponse',
        userId: user.id,
        quizId: responseData.quizId
      });
      
      toast({
        title: "Erro ao salvar resposta",
        description: "Não foi possível salvar sua resposta. Tente novamente.",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveMultipleResponses = async (responses: QuizResponseData[]) => {
    if (!user) {
      console.warn('User not authenticated, cannot save responses to Supabase');
      return [];
    }

    setSaving(true);
    try {
      const savedResponses = await Promise.all(
        responses.map(responseData => {
          const resultData: Omit<Result, 'id' | 'createdAt'> = {
            quizId: responseData.quizId,
            userId: user.id,
            startedAt: new Date().toISOString(),
            completedAt: responseData.completedAt || new Date().toISOString(),
            score: responseData.score || 0,
            answers: responseData.answers,
            outcomeKey: responseData.outcomeKey,
            sessionId: responseData.sessionId,
            utm: responseData.utm,
            meta: responseData.meta
          };
          
          return responsesApi.create(resultData);
        })
      );

      toast({
        title: "Respostas salvas!",
        description: `${savedResponses.length} respostas foram salvas com sucesso.`
      });

      return savedResponses;
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'QuizResponseHandler.saveMultipleResponses',
        userId: user.id,
        responseCount: responses.length
      });
      
      toast({
        title: "Erro ao salvar respostas",
        description: "Não foi possível salvar algumas respostas. Tente novamente.",
        variant: "destructive"
      });
      return [];
    } finally {
      setSaving(false);
    }
  };

  return {
    saveResponse,
    saveMultipleResponses,
    saving
  };
};

export default QuizResponseHandler;