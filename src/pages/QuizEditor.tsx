import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveQuiz, loadQuiz, deleteQuiz } from '@/lib/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { quizService } from '@/lib/quizService';
import { Quiz, Question, QuestionType, QuizStep, CustomLeadStepData } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';
import { ThemeEditor } from '@/components/quiz/ThemeEditor';
import { OutcomeEditor } from '@/components/quiz/OutcomeEditor';
import { AnalyticsDashboard } from '@/components/quiz/AnalyticsDashboard';
import { EnhancedAnalytics } from '@/components/quiz/EnhancedAnalytics';
import { VisualQuizEditor } from '@/components/quiz/visual-editor/VisualQuizEditor';
import { StageEditor } from '@/components/quiz/StageEditor';
import { PixelsManager, PixelSettings } from '@/components/quiz/PixelsManager';
import { EngagementManager } from '@/components/quiz/engagement/EngagementManager';
import { WebhookManager } from '@/components/integrations/WebhookManager';
import { StepListEditor } from '@/components/quiz/StepListEditor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { generateUniquePublicId } from '@/lib/supabaseQuiz';

import {
  Plus, Save, Eye, Copy, ArrowLeft, ExternalLink, Settings, BarChart3, Palette, Trophy, Trash2, Play, Zap, Target, Crown, Check, X, Clock, Loader2, Globe, GripVertical, User, Mail, Phone
} from 'lucide-react';

// Validation and utility functions
const validateQuizForPublishing = (quiz: Quiz): string[] => {
  const errors: string[] = [];
  
  if (!quiz.name?.trim()) {
    errors.push('Quiz name is required');
  }
  
  if (!quiz.steps || quiz.steps.length === 0) {
    errors.push('At least one step is required');
  }
  
  // Validate each step
  if (quiz.steps) {
    for (let i = 0; i < quiz.steps.length; i++) {
      const step = quiz.steps[i];
      if (!step.name?.trim()) {
        errors.push(`Step ${i + 1} name is required`);
      }
      
      // Validate lead registration steps
      if (step.type === 'lead_registration' && (!step.components || step.components.length === 0)) {
        errors.push(`Lead registration step '${step.name}' must have components`);
      }
    }
  }
  
  // Only validate empty steps for non-lead registration steps
  quiz.steps?.forEach((stage, index) => {
    // Allow lead registration steps to be empty as they're handled differently
    if (stage.type !== 'lead_registration' && stage.components.length === 0) {
      errors.push(`Etapa ${index + 1} está vazia`);
    }
  });
  
  return errors;
};



const QuizEditor = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'stages' | 'questions' | 'outcomes' | 'theme' | 'settings' | 'pixels' | 'analytics' | 'engagement' | 'integrations'>('stages');

  console.log('[QuizEditor] 🎯 Mounted - QuizId:', quizId);
  console.log('[QuizEditor] 👤 User:', user?.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    console.log('[QuizEditor] 🔄 useEffect triggered - QuizId:', quizId, 'User:', user?.id);
    
    if (!quizId) {
      console.log('[QuizEditor] ⚠️ No quizId provided');
      return;
    }

    const loadQuizData = async () => {
      console.log('[QuizEditor] 🔍 Starting to load quiz...');
      try {
        // First try to load from Supabase
        if (user) {
          console.log('[QuizEditor] 💾 Loading from Supabase...');
          const { quiz: loadedQuiz, error } = await quizService.loadQuiz(quizId, user.id);
          if (loadedQuiz) {
            console.log('[QuizEditor] ✅ Quiz loaded from Supabase:', loadedQuiz.name);
            setQuiz(loadedQuiz);
            setLoading(false);
            return;
          }
          
          if (error) {
            console.error('[QuizEditor] ❌ Error loading from Supabase:', error);
          }
        } else {
          console.log('[QuizEditor] ⚠️ No user, skipping Supabase');
        }

        // Fallback to local storage
        console.log('[QuizEditor] 💾 Trying localStorage fallback...');
        const loadedQuiz = await loadQuiz(quizId);
        if (loadedQuiz) {
          console.log('[QuizEditor] ✅ Quiz loaded from localStorage:', loadedQuiz.name);
        } else {
          console.log('[QuizEditor] ❌ Quiz not found in localStorage');
        }
        setQuiz(loadedQuiz);
      } catch (error) {
        console.error('[QuizEditor] ❌ Critical error loading quiz:', error);
        toast({
          title: "Erro ao carregar quiz",
          description: "Não foi possível carregar o quiz.",
          variant: "destructive"
        });
      } finally {
        console.log('[QuizEditor] ✅ Loading finished');
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, user, toast]);

  const handleSave = async () => {
    if (!quiz || !user) {
      toast({
        title: "Erro ao salvar",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Basic validation before save
    if (!quiz.name || quiz.name.trim() === '') {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, defina um nome para o quiz antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Iniciando salvamento do quiz:', quiz.id);
      console.log('📊 Dados do quiz:', {
        id: quiz.id,
        name: quiz.name,
        status: quiz.status,
        questionsCount: quiz.questions?.length || 0,
        stepsCount: quiz.steps?.length || 0
      });
      
      const { success, error } = await quizService.saveQuiz(quiz, user.id);
      
      if (success) {
        console.log('✅ Quiz salvo com sucesso!');
        toast({
          title: "✅ Quiz salvo!",
          description: "Todas as alterações foram salvas com sucesso.",
          duration: 3000
        });
      } else {
        console.error('❌ Erro ao salvar quiz:', error);
        throw new Error(error || "Failed to save quiz");
      }
    } catch (error) {
      console.error('❌ Erro crítico ao salvar quiz:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz || !user) {
      toast({
        title: "Erro ao publicar",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Validation before publishing
    const errors = validateQuizForPublishing(quiz);
    if (errors.length > 0) {
      console.warn('⚠️ Erros de validação:', errors);
      toast({
        title: "⚠️ Erro na validação",
        description: `Corrija os seguintes problemas:\n• ${errors.join('\n• ')}`,
        variant: "destructive",
        duration: 6000
      });
      return;
    }

    setSaving(true);
    try {
      console.log('🚀 Iniciando publicação do quiz:', quiz.id);
      console.log('📊 Dados do quiz para publicação:', {
        id: quiz.id,
        name: quiz.name,
        publicId: quiz.publicId,
        stepsCount: quiz.steps?.length || 0
      });
      
      const { success, publicId, error } = await quizService.publishQuiz(quiz, user.id);
      
      if (success && publicId) {
        const quizUrl = `${window.location.origin}/q/${publicId}`;
        console.log('✅ Quiz publicado com sucesso! URL:', quizUrl);
        
        toast({
          title: "🎉 Quiz publicado!",
          description: `Disponível em: ${quizUrl}`,
          duration: 5000
        });
        
        // Update the quiz in state
        setQuiz(prev => prev ? {
          ...prev,
          status: 'published',
          publicId,
          updatedAt: new Date().toISOString()
        } : null);
      } else {
        console.error('❌ Erro ao publicar quiz:', error);
        throw new Error(error || "Failed to publish quiz");
      }
    } catch (error) {
      console.error('❌ Erro crítico ao publicar quiz:', error);
      toast({
        title: "❌ Erro ao publicar",
        description: error instanceof Error ? error.message : "Não foi possível publicar o quiz.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quiz || !user || !window.confirm('Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.')) return;

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz.id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Also delete from local storage
      await deleteQuiz(quiz.id);
      toast({
        title: "Quiz excluído",
        description: "O quiz foi excluído com sucesso."
      });
      navigate('/app');
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o quiz.",
        variant: "destructive"
      });
    }
  };

  const addQuestion = () => {
    if (!quiz) return;

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      idx: quiz.questions.length + 1,
      type: 'single',
      title: 'Nova pergunta',
      description: '',
      options: [
        { id: '1', label: 'Opção A', score: 10 },
        { id: '2', label: 'Opção B', score: 5 }
      ],
      required: true
    };

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!quiz) return;

    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    });
  };

  const deleteQuestion = (questionId: string) => {
    if (!quiz) return;

    setQuiz({
      ...quiz,
      questions: quiz.questions
        .filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, idx: index + 1 }))
    });
  };

  const duplicateQuestion = (questionId: string) => {
    if (!quiz) return;

    const questionToDuplicate = quiz.questions.find(q => q.id === questionId);
    if (!questionToDuplicate) return;

    const newQuestion: Question = {
      ...questionToDuplicate,
      id: crypto.randomUUID(),
      idx: quiz.questions.length + 1,
      title: `${questionToDuplicate.title} (cópia)`,
      options: questionToDuplicate.options?.map(opt => ({
        ...opt,
        id: crypto.randomUUID()
      }))
    };

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    });

    toast({
      title: "Pergunta duplicada",
      description: "Uma cópia da pergunta foi criada."
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && quiz) {
      const oldIndex = quiz.questions.findIndex(q => q.id === active.id);
      const newIndex = quiz.questions.findIndex(q => q.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Reorder the questions
        const reorderedQuestions = arrayMove(quiz.questions, oldIndex, newIndex).map((q, index) => ({
          ...q,
          idx: index + 1
        }));

        setQuiz({
          ...quiz,
          questions: reorderedQuestions
        });
      }
    }
  };

  const copyPublicLink = () => {
    if (!quiz) return;
    
    const url = `${window.location.origin}/q/${quiz.publicId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link público do quiz foi copiado."
    });
  };

  // Add this new interface for unified items
  interface QuizItem {
    id: string;
    type: 'question' | 'custom_lead' | 'lead_registration';
    data: any;
    stepId?: string;
  }

  // Add this new function to handle drag end for unified items
  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && quiz) {
      // Create a unified list of items (questions + lead registration steps)
      const items: QuizItem[] = [];
      
      // Add questions
      quiz.questions.forEach((question) => {
        items.push({
          id: question.id,
          type: 'question',
          data: question
        });
      });
      
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Reorder the items
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Extract questions in new order
        const reorderedQuestions: Question[] = reorderedItems
          .filter(item => item.type === 'question')
          .map((item, index) => ({
            ...item.data,
            idx: index + 1
          }));
        
        // Update the quiz state
        setQuiz({
          ...quiz,
          questions: reorderedQuestions
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz não encontrado</h1>
          <Button onClick={() => navigate('/app')}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Remove the debug components section */}
      
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className={`px-4 py-4 max-w-[90vw] mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
            <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-4'}`}>
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => navigate('/app')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {!isMobile && 'Voltar'}
              </Button>
              
              <div className={isMobile ? 'text-center' : ''}>
                <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>{quiz.name}</h1>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    {quiz.questions.length} perguntas • {quiz.steps?.length || 0} etapas
                  </p>
                )}
              </div>
            </div>

            <div className={`flex items-center ${isMobile ? 'w-full justify-center flex-wrap gap-1' : 'gap-3'}`}>
              <Badge 
                variant={quiz.status === 'published' ? 'default' : 'secondary'}
                className={quiz.status === 'published' ? 'bg-green-100 text-green-800' : ''}
              >
                {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
              </Badge>

              {!isMobile && (
                <Button variant="outline" size="sm" onClick={() => window.open(`/q/${quiz.publicId}`, '_blank')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}

              <Button variant="outline" size={isMobile ? "sm" : "sm"} onClick={copyPublicLink}>
                <Copy className="w-4 h-4 mr-2" />
                {!isMobile && 'Copiar link'}
              </Button>

              <Button onClick={handleSave} disabled={saving} size={isMobile ? "sm" : "sm"}>
                <Save className="w-4 h-4 mr-2" />
                {!isMobile ? (saving ? 'Salvando...' : 'Salvar') : ''}
              </Button>

              <Button 
                onClick={handlePublish} 
                className="bg-green-600 hover:bg-green-700" 
                size={isMobile ? "sm" : "sm"}
              >
                {!isMobile ? (quiz.status === 'published' ? 'Republicar' : 'Publicar') : 'Pub'}
              </Button>

              {!isMobile && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                  className="opacity-50 hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="stages" className="space-y-4">
            <div className="w-full overflow-x-auto">
              <TabsList className="w-full min-w-max justify-start rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger 
                  value="questions" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Perguntas
                </TabsTrigger>
                <TabsTrigger 
                  value="theme" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Personalização Visual
                </TabsTrigger>
                <TabsTrigger 
                  value="stages" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Editor de Quiz + Componentes
                </TabsTrigger>
                <TabsTrigger 
                  value="engagement" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Engajamento
                </TabsTrigger>
                <TabsTrigger 
                  value="outcomes" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Resultados do Quiz
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </TabsTrigger>
                <TabsTrigger 
                  value="pixels" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Pixels
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="integrations" 
                  className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Gerenciar Webhooks
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-8">
              <TabsContent value="questions" className="mt-0">
                <div className="max-w-[90vw] mx-auto space-y-6">
                  {/* Show steps list if steps exist */}
                  {quiz && quiz.steps && quiz.steps.length > 0 && (
                    <StepListEditor
                      steps={quiz.steps}
                      questions={quiz.questions}
                      onUpdateStep={(stepId, updates) => {
                        setQuiz(prevQuiz => {
                          if (!prevQuiz || !prevQuiz.steps) return prevQuiz;
                          
                          const updatedSteps = prevQuiz.steps.map(step => 
                            step.id === stepId ? { ...step, ...updates } : step
                          );
                          
                          return {
                            ...prevQuiz,
                            steps: updatedSteps
                          };
                        });
                      }}
                      onDeleteStep={(stepId) => {
                        setQuiz(prevQuiz => {
                          if (!prevQuiz || !prevQuiz.steps) return prevQuiz;
                          
                          const updatedSteps = prevQuiz.steps.filter(step => step.id !== stepId);
                          
                          return {
                            ...prevQuiz,
                            steps: updatedSteps
                          };
                        });
                      }}
                      onDragEnd={(event) => {
                        // Handle drag end if needed
                        console.log('Step drag end:', event);
                      }}
                      quizId={quiz.id}
                    />
                  )}

                  {quiz && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleItemDragEnd}
                    >
                      <div className="space-y-6">
                        {/* Create unified list of items */}
                        {(() => {
                          // Create a unified list of items (questions only, including lead registration questions)
                          const items: QuizItem[] = [];
                          
                          // Add questions
                          quiz.questions.forEach((question) => {
                            items.push({
                              id: question.id,
                              type: question.type === 'lead_capture' ? 'lead_registration' : 'question',
                              data: question
                            });
                          });
                          
                          // Sort items by their index/position
                          items.sort((a, b) => {
                            if (a.type === 'question' && b.type === 'question') {
                              return a.data.idx - b.data.idx;
                            } else if (a.type === 'lead_registration' && b.type === 'lead_registration') {
                              return a.data.idx - b.data.idx;
                            } else if (a.type === 'question' && b.type === 'lead_registration') {
                              // Questions come before lead registration steps
                              return -1;
                            } else {
                              return 1;
                            }
                          });
                          
                          return (
                            <SortableContext
                              items={items.map(item => item.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {items.map((item, index) => {
                                if (item.type === 'question') {
                                  return (
                                    <SortableItem key={item.id} id={item.id}>
                                      <QuestionEditor
                                        question={item.data}
                                        index={item.data.idx - 1}
                                        onUpdate={updateQuestion}
                                        onDelete={deleteQuestion}
                                        onDuplicate={duplicateQuestion}
                                      />
                                    </SortableItem>
                                  );
                                } else {
                                  // For lead registration items, we need to create a step-like object
                                  const leadStep: QuizStep = {
                                    id: item.data.id,
                                    type: 'lead_registration',
                                    name: item.data.title,
                                    title: item.data.title,
                                    components: [],
                                    data: {
                                      title: item.data.settings?.introText || item.data.title,
                                      fields: [
                                        { label: "Nome", type: "text", placeholder: "Digite seu nome completo", icon: "user" },
                                        { label: "E-mail", type: "email", placeholder: "seuemail@email.com", icon: "mail" },
                                        { label: "WhatsApp", type: "tel", placeholder: "(00) 00000-0000", icon: "phone" }
                                      ],
                                      buttonText: item.data.settings?.buttonText || 'Enviar',
                                      successMessage: item.data.settings?.successMessage || 'Dados salvos com sucesso!',
                                      errorMessage: item.data.settings?.errorMessage || 'Ocorreu um erro ao salvar seus dados.',
                                      required: item.data.required || false
                                    }
                                  };
                                  
                                  return (
                                    <SortableItem key={item.id} id={item.id}>
                                      <CustomLeadItem
                                        step={leadStep}
                                        onUpdateStep={(stepId, updates) => {
                                          // Update the question in the questions list
                                          setQuiz(prevQuiz => {
                                            if (!prevQuiz) return prevQuiz;
                                            
                                            const updatedQuestions = prevQuiz.questions.map(question => 
                                              question.id === stepId ? { 
                                                ...question, 
                                                title: updates.data?.title || question.title,
                                                settings: {
                                                  ...question.settings,
                                                  introText: updates.data?.title || question.settings?.introText,
                                                  buttonText: updates.data?.buttonText || question.settings?.buttonText,
                                                  successMessage: updates.data?.successMessage || question.settings?.successMessage,
                                                  errorMessage: updates.data?.errorMessage || question.settings?.errorMessage,
                                                }
                                              } : question
                                            );
                                            
                                            return {
                                              ...prevQuiz,
                                              questions: updatedQuestions
                                            };
                                          });
                                        }}
                                        onDeleteStep={(stepId) => {
                                          // Delete the question from the questions list
                                          setQuiz(prevQuiz => {
                                            if (!prevQuiz) return prevQuiz;
                                            
                                            const updatedQuestions = prevQuiz.questions.filter(question => question.id !== stepId);
                                            
                                            return {
                                              ...prevQuiz,
                                              questions: updatedQuestions
                                            };
                                          });
                                        }}
                                      />
                                    </SortableItem>
                                  );
                                }
                              })}
                            </SortableContext>
                          );
                        })()}
                      </div>
                    </DndContext>
                  )}

                  {/* Add Step Button */}
                  {quiz && (
                    <Card className="p-8 text-center border-dashed">
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button onClick={addQuestion} variant="outline" size="lg">
                          <Plus className="w-5 h-5 mr-2" />
                          Adicionar nova pergunta
                        </Button>
                        <Button 
                          onClick={() => {
                            // Check if a lead registration step already exists
                            const existingLeadStep = quiz.questions.find(q => q.type === 'lead_capture' && q.title === 'Etapa Cadastro de Lead');
                            
                            if (existingLeadStep) {
                              // If it exists, show a message and don't add another one
                              toast({
                                title: "Etapa já existe",
                                description: "Já existe uma Etapa Cadastro de Lead no quiz.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Add Lead Registration step with predefined template
                            const newStepId = crypto.randomUUID(); // Clean UUID without prefix
                            
                            // Add to questions list (not steps) so it's only added when synced
                            const newQuestion: Question = {
                              id: newStepId,
                              idx: quiz.questions.length + 1,
                              type: 'lead_capture',
                              title: 'Etapa Cadastro de Lead',
                              settings: {
                                fields: {
                                  name: true,
                                  email: true,
                                  phone: true
                                },
                                introText: 'Etapa Cadastro de Lead',
                                successMessage: 'Dados salvos com sucesso!',
                                errorMessage: 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.',
                                buttonText: 'Enviar'
                              },
                              required: true
                            };
                            
                            setQuiz({
                              ...quiz,
                              questions: [...quiz.questions, newQuestion]
                            });
                          }} 
                          variant="outline" 
                          size="lg"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Adicionar Etapa Cadastro de Lead
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="theme" className="mt-0">
                <div className="max-w-[90vw] mx-auto">
                  <ThemeEditor
                    theme={quiz.theme || { primary: '#2563EB', background: '#FFFFFF', text: '#0B0B0B' }}
                    onUpdate={(theme) => setQuiz({ ...quiz, theme })}
                    quizId={quiz.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="stages" className="mt-0">
                <StageEditor 
                  quiz={quiz}
                  onUpdate={setQuiz}
                  onSave={handleSave}
                  onPreview={() => window.open(`/q/${quiz.publicId}`, '_blank')}
                  onPublish={handlePublish}
                  onNavigateToTheme={() => setActiveTab('theme')}
                />
              </TabsContent>

              <TabsContent value="engagement" className="mt-0">
                <div className="max-w-[90vw] mx-auto">
                  <EngagementManager 
                    theme={quiz.theme || { primary: '#2563EB', background: '#FFFFFF', text: '#0B0B0B' }}
                    onUpdate={(theme) => setQuiz({ ...quiz, theme })}
                    quizId={quiz.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="outcomes" className="mt-0">
                <div className="max-w-[90vw] mx-auto">
                  <OutcomeEditor
                    outcomes={quiz.outcomes || {}}
                    quiz={quiz}
                    onUpdate={(outcomes) => setQuiz({ ...quiz, outcomes })}
                    onQuizUpdate={(updates) => setQuiz({ ...quiz, ...updates })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="max-w-[90vw] mx-auto space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome do Quiz</label>
                        <Input
                          value={quiz.name}
                          onChange={(e) => setQuiz({ ...quiz, name: e.target.value })}
                          placeholder="Digite o nome do quiz"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Descrição</label>
                        <Textarea
                          value={quiz.description || ''}
                          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                          placeholder="Descreva brevemente seu quiz"
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Link Público</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">URL Padrão do Quiz</label>
                        <div className="flex gap-2">
                          <Input
                            value={`${window.location.origin}/q/${quiz.publicId}`}
                            readOnly
                            className="bg-muted"
                          />
                          <Button variant="outline" onClick={copyPublicLink}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" onClick={() => window.open(`/q/${quiz.publicId}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pixels" className="mt-0">
                <div className="max-w-[90vw] mx-auto">
                  <PixelsManager
                    pixelSettings={quiz.pixelSettings || {}}
                    onUpdate={(settings) => setQuiz({ ...quiz, pixelSettings: settings })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <div className="max-w-[90vw] mx-auto">
                  <EnhancedAnalytics quizId={quiz.id} />
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0">
                <div className="max-w-[90vw] mx-auto">
                  <WebhookManager quizId={quiz.id} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </header>
    </div>
  );
};

export default QuizEditor;

const SortableItem = ({ children, id }: { children: React.ReactNode; id: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div 
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
};

interface CustomLeadItemProps {
  step: QuizStep;
  onUpdateStep: (stepId: string, updates: Partial<QuizStep>) => void;
  onDeleteStep: (stepId: string) => void;
}

const CustomLeadItem = ({ step, onUpdateStep, onDeleteStep }: CustomLeadItemProps) => {
  // Handle both old and new data structures
  const isLegacyData = Array.isArray(step.data.fields) && typeof step.data.fields[0] === 'string';
  const data = step.data as any;
  
  // Convert legacy data to new format if needed
  const fields = isLegacyData 
    ? data.fields.map((field: string) => {
        switch (field) {
          case 'name': return { label: "Nome", type: "text", placeholder: "Digite seu nome", icon: "user" };
          case 'email': return { label: "E-mail", type: "email", placeholder: "seuemail@email.com", icon: "mail" };
          case 'whatsapp': 
          case 'phone': return { label: "WhatsApp", type: "tel", placeholder: "(00) 00000-0000", icon: "phone" };
          default: return { label: field, type: "text", placeholder: `Digite seu ${field}`, icon: "user" };
        }
      })
    : data.fields || [
        { label: "Nome", type: "text", placeholder: "Digite seu nome completo", icon: "user" },
        { label: "E-mail", type: "email", placeholder: "seuemail@email.com", icon: "mail" },
        { label: "WhatsApp", type: "tel", placeholder: "(00) 00000-0000", icon: "phone" }
      ];
  
  const getFieldIcon = (field: any) => {
    const fieldType = typeof field === 'string' ? field : field.type;
    const fieldLabel = typeof field === 'string' ? field : field.label;
    const fieldIcon = typeof field === 'object' && field.icon ? field.icon : null;
    
    // Use the field's specific icon if provided
    if (fieldIcon) {
      switch (fieldIcon.toLowerCase()) {
        case 'user':
          return <User className="w-4 h-4" />;
        case 'mail':
        case 'email':
          return <Mail className="w-4 h-4" />;
        case 'phone':
        case 'whatsapp':
          return <Phone className="w-4 h-4" />;
        default:
          return <User className="w-4 h-4" />;
      }
    }
    
    // Fallback to field type/label-based icons
    switch (fieldType?.toLowerCase() || fieldLabel?.toLowerCase()) {
      case 'name':
      case 'text':
        return <User className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
      case 'phone':
      case 'tel':
        return <Phone className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getFieldLabel = (field: any) => {
    if (typeof field === 'string') {
      switch (field.toLowerCase()) {
        case 'name': return 'Nome';
        case 'email': return 'E-mail';
        case 'whatsapp': return 'WhatsApp';
        case 'phone': return 'Telefone';
        default: return field;
      }
    }
    return field.label || field;
  };

  const updateField = (index: number, updates: Partial<any>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    
    onUpdateStep(step.id, { 
      data: { 
        ...data, 
        fields: updatedFields 
      } 
    });
  };

  const addField = () => {
    const updatedFields = [...fields, { label: "Novo Campo", type: "text", placeholder: "Digite...", icon: "user" }];
    onUpdateStep(step.id, { 
      data: { 
        ...data, 
        fields: updatedFields 
      } 
    });
  };

  const removeField = (index: number) => {
    // Don't allow removing all fields - keep at least the three default ones
    if (fields.length <= 3) {
      // If trying to remove one of the default fields, just return
      return;
    }
    
    const updatedFields = fields.filter((_: any, i: number) => i !== index);
    onUpdateStep(step.id, { 
      data: { 
        ...data, 
        fields: updatedFields 
      } 
    });
  };

  return (
    <Card className="p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-4">
          {/* Step type and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Etapa Cadastro de Lead</Badge>
              <span className="text-sm text-muted-foreground">Etapa de coleta de informações</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteStep(step.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Step title */}
          <Input
            value={data.title}
            onChange={(e) => onUpdateStep(step.id, { 
              data: { ...data, title: e.target.value } 
            })}
            placeholder="Título da etapa..."
            className="text-lg font-medium"
          />

          {/* Fields configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Campos para coleta</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addField}
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Campo
              </Button>
            </div>
            
            <div className="space-y-2">
              {fields.map((field: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <div className="flex items-center gap-2 flex-1">
                    {getFieldIcon(field)}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Label"
                        className="h-8 text-sm"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="border rounded px-2 h-8 text-sm"
                      >
                        <option value="text">Texto</option>
                        <option value="email">E-mail</option>
                        <option value="tel">Telefone</option>
                        <option value="number">Número</option>
                      </select>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Placeholder"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  {/* Only allow removing custom fields, not the default ones */}
                  {index >= 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`button-text-${step.id}`}>Texto do botão</Label>
                <Input
                  id={`button-text-${step.id}`}
                  value={data.buttonText}
                  onChange={(e) => onUpdateStep(step.id, { 
                    data: { ...data, buttonText: e.target.value } 
                  })}
                  placeholder="Texto do botão..."
                />
              </div>

              <div>
                <Label htmlFor={`required-${step.id}`}>Obrigatório</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id={`required-${step.id}`}
                    checked={data.required}
                    onCheckedChange={(checked) => onUpdateStep(step.id, { 
                      data: { ...data, required: checked } 
                    })}
                  />
                  <Label htmlFor={`required-${step.id}`}>Tornar obrigatória</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor={`success-message-${step.id}`}>Mensagem de sucesso</Label>
              <Textarea
                id={`success-message-${step.id}`}
                value={data.successMessage}
                onChange={(e) => onUpdateStep(step.id, { 
                  data: { ...data, successMessage: e.target.value } 
                })}
                placeholder="Mensagem exibida após envio bem-sucedido..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor={`error-message-${step.id}`}>Mensagem de erro</Label>
              <Textarea
                id={`error-message-${step.id}`}
                value={data.errorMessage}
                onChange={(e) => onUpdateStep(step.id, { 
                  data: { ...data, errorMessage: e.target.value } 
                })}
                placeholder="Mensagem exibida em caso de erro..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
