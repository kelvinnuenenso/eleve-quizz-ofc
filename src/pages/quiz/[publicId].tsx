import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'multiple-select' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  correctAnswers?: string[];
}

interface Quiz {
  id: string;
  public_id: string;
  title: string;
  description?: string;
  questions: Question[];
  settings: {
    show_results?: boolean;
    collect_email?: boolean;
    collect_name?: boolean;
    time_limit?: number;
    facebook_pixel_id?: string;
    google_analytics_id?: string;
  };
}

interface QuizAnswer {
  questionId: string;
  answer: string | number | boolean | string[];
}

interface PublicQuizPageProps {
  quiz: Quiz | null;
  error?: string;
}

export default function PublicQuizPage({ quiz, error }: PublicQuizPageProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    [key: string]: unknown;
  } | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (quiz) {
      setStartTime(new Date());
      
      // Configurar timer se houver limite de tempo
      if (quiz.settings.time_limit) {
        setTimeRemaining(quiz.settings.time_limit * 60); // converter minutos para segundos
      }

      // Disparar evento de início do quiz
      trackEvent('quiz_started', {
        quiz_id: quiz.id,
        quiz_title: quiz.title
      });
    }
  }, [quiz]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Tempo esgotado, submeter automaticamente
      handleSubmit();
    }
  }, [timeRemaining]);

  const trackEvent = async (eventName: string, eventData: Record<string, unknown>) => {
    if (!quiz) return;

    try {
      await fetch(`/api/pixels/${quiz.public_id}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName,
          event_data: eventData,
          page_url: window.location.href,
          referrer: document.referrer,
          session_id: sessionStorage.getItem('quiz_session_id') || undefined
        }),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | number | boolean | string[]) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
      } else {
        return [...prev, { questionId, answer }];
      }
    });
  };

  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.answer;
  };

  const handleNext = () => {
    if (!quiz) return;

    const currentQ = quiz.questions[currentQuestion];
    const currentAnswer = getCurrentAnswer(currentQ.id);

    if (!currentAnswer && currentAnswer !== false && currentAnswer !== 0) {
      toast.error('Por favor, responda a pergunta antes de continuar');
      return;
    }

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      trackEvent('question_answered', {
        question_id: currentQ.id,
        question_number: currentQuestion + 1,
        answer: currentAnswer
      });
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return;

    // Validar campos obrigatórios
    if (quiz.settings.collect_name && !respondentName.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    if (quiz.settings.collect_email && !respondentEmail.trim()) {
      toast.error('Por favor, informe seu email');
      return;
    }

    if (quiz.settings.collect_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) {
      toast.error('Por favor, informe um email válido');
      return;
    }

    setIsSubmitting(true);

    try {
      const completionTime = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 1000) : undefined;

      const response = await fetch(`/api/quizzes/${quiz.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respondent_name: respondentName.trim() || undefined,
          respondent_email: respondentEmail.trim() || undefined,
          answers,
          completion_time: completionTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        setIsCompleted(true);
        
        trackEvent('quiz_completed', {
          quiz_id: quiz.id,
          score: data.data.score,
          completion_time: completionTime,
          total_questions: quiz.questions.length
        });

        toast.success('Quiz concluído com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao submeter quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Erro ao submeter quiz. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const shareQuiz = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: quiz?.title,
          text: quiz?.description,
          url: url,
        });
      } catch (error) {
        // Fallback para clipboard
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Quiz não encontrado</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Quiz Concluído!</CardTitle>
            <CardDescription>Obrigado por participar do nosso quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.settings.show_results && (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-blue-600">
                  {results.score}%
                </div>
                <p className="text-gray-600">
                  Você acertou {Math.round((results.score / 100) * quiz.questions.length)} de {quiz.questions.length} perguntas
                </p>
                {results.completion_time && (
                  <p className="text-sm text-gray-500">
                    Tempo de conclusão: {formatTime(results.completion_time)}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button onClick={shareQuiz} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar Quiz
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refazer Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-600 mb-4">{quiz.description}</p>
          )}
          
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="text-sm text-gray-500">
              Pergunta {currentQuestion + 1} de {quiz.questions.length}
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center text-sm text-orange-600">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
          
          <Progress value={progress} className="w-full max-w-md mx-auto" />
        </div>

        {/* Formulário inicial (se necessário) */}
        {currentQuestion === 0 && (quiz.settings.collect_name || quiz.settings.collect_email) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações do Participante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quiz.settings.collect_name && (
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
              )}
              {quiz.settings.collect_email && (
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pergunta atual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQ.type === 'multiple-choice' && (
              <RadioGroup
                value={getCurrentAnswer(currentQ.id) || ''}
                onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
              >
                {currentQ.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQ.type === 'true-false' && (
              <RadioGroup
                value={getCurrentAnswer(currentQ.id)?.toString() || ''}
                onValueChange={(value) => handleAnswerChange(currentQ.id, value === 'true')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">Verdadeiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">Falso</Label>
                </div>
              </RadioGroup>
            )}

            {currentQ.type === 'multiple-select' && (
              <div className="space-y-2">
                {currentQ.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`checkbox-${index}`}
                      checked={(getCurrentAnswer(currentQ.id) || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const currentAnswers = getCurrentAnswer(currentQ.id) || [];
                        if (checked) {
                          handleAnswerChange(currentQ.id, [...currentAnswers, option]);
                        } else {
                          handleAnswerChange(currentQ.id, currentAnswers.filter((a: string) => a !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`checkbox-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {currentQ.type === 'text' && (
              <Textarea
                value={getCurrentAnswer(currentQ.id) || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder="Digite sua resposta..."
                rows={4}
              />
            )}
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>
          
          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Enviando...' : 'Finalizar Quiz'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Próxima
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { publicId } = context.params!;

  try {
    // First try to fetch from our REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5173'}/api/quizzes/public/${publicId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return {
          props: {
            quiz: data.data
          }
        };
      }
    }

    // Fallback to Supabase direct query
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('public_id', publicId)
      .eq('status', 'published')
      .single();

    if (error || !quiz) {
      return {
        props: {
          quiz: null,
          error: 'Quiz não encontrado ou não está publicado'
        }
      };
    }

    return {
      props: {
        quiz
      }
    };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return {
      props: {
        quiz: null,
        error: 'Erro ao carregar quiz'
      }
    };
  }
};