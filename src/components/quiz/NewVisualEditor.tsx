import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragStartEvent, 
  DragEndEvent, 
  DragOverEvent,
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCorners,
  UniqueIdentifier
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Quiz, QuizStep, Component, ComponentType } from '@/types/quiz';
import { useQuizLoader } from '@/hooks/useQuizLoader';
import { useThemes } from '@/hooks/useThemes';
import { useToast } from '@/hooks/use-toast';

import { EnhancedComponentLibrary } from './visual-editor/EnhancedComponentLibrary';
import { VisualToolbar } from './visual-editor/VisualToolbar';
import { RealQuizPreview } from './RealQuizPreview';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { 
  Play, Save, Eye, Settings, Wand2, CheckCircle, AlertCircle, 
  Layers, Plus, Trash2, Copy, Move, Edit3, Monitor, Tablet, Smartphone 
} from 'lucide-react';

interface NewVisualEditorProps {
  quiz: Quiz;
  onUpdate: (quiz: Quiz) => void;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onNavigateToTheme: () => void;
}

export function NewVisualEditor({
  quiz,
  onUpdate,
  onSave,
  onPreview,
  onPublish,
  onNavigateToTheme
}: NewVisualEditorProps) {
  // Estados principais
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string>('');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draggedComponentType, setDraggedComponentType] = useState<ComponentType | null>(null);
  const [quizVersion, setQuizVersion] = useState<number>(0); // Add this state
  
  // Histórico para undo/redo
  const [history, setHistory] = useState<Quiz[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  const { toast } = useToast();
  const { savedThemes, applyThemeToQuiz } = useThemes();
  const { autoLoadQuizContent, needsAutoLoad, saveQuizTheme, createStepsFromQuestions } = useQuizLoader(quiz);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Estados derivados
  const currentStep = quiz.steps?.find(step => step.id === activeStepId);

  // Funções auxiliares de histórico
  const addToHistory = useCallback((newQuiz: Quiz) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...newQuiz });
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
    setIsDirty(true);
  }, [history, historyIndex]);

  const updateQuiz = useCallback((updater: (quiz: Quiz) => Quiz) => {
    const newQuiz = {
      ...updater(quiz),
      updatedAt: new Date().toISOString()
    };
    onUpdate(newQuiz);
    addToHistory(newQuiz);
    setQuizVersion(prev => prev + 1); // Increment quizVersion
  }, [quiz, onUpdate, addToHistory]);

  // Funções de controle
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousQuiz = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdate(previousQuiz);
      setIsDirty(true);
      toast({
        title: "Desfeito",
        description: "Última ação foi desfeita."
      });
    }
  }, [history, historyIndex, onUpdate, toast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextQuiz = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onUpdate(nextQuiz);
      setIsDirty(true);
      toast({
        title: "Refeito",
        description: "Ação foi refeita."
      });
    }
  }, [history, historyIndex, onUpdate, toast]);

  // Function to add a component to the current step
  const addComponentToStep = useCallback((componentType: ComponentType) => {
    if (!currentStep) return;
    
    // Create a new component based on the type
    const newComponent: Component = {
      id: `component-${Date.now()}`,
      type: componentType,
      content: {},
      style: {}
    };
    
    // Add default content based on component type
    switch (componentType) {
      case 'text':
        newComponent.content = { text: 'Novo texto', style: 'normal' };
        break;
      case 'title':
        newComponent.content = { text: 'Novo título', level: 'h2' };
        break;
      case 'image':
        newComponent.content = { src: '', alt: 'Imagem', width: '100%' };
        break;
      case 'button':
        newComponent.content = { text: 'Clique aqui', style: 'primary', action: 'next' };
        break;
      case 'input':
        newComponent.content = { label: 'Sua resposta', type: 'text', required: false };
        break;
      case 'multiple_choice':
        newComponent.content = {
          question: 'Qual sua preferência?',
          options: [
            { id: '1', label: 'Opção A', score: 10 },
            { id: '2', label: 'Opção B', score: 5 }
          ],
          allowMultiple: false,
          required: true
        };
        break;
      case 'level_slider':
        newComponent.content = {
          label: 'Avalie de 1 a 10',
          min: 1,
          max: 10,
          step: 1,
          defaultValue: 5
        };
        break;
      case 'lead_capture':
        newComponent.content = {};
        newComponent.properties = {
          fields: {
            name: true,
            email: true,
            phone: false
          },
          introText: 'Quer receber seu resultado?',
          successMessage: 'Dados salvos com sucesso!',
          errorMessage: 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.',
          buttonText: 'Enviar'
        };
        break;
      case 'lead_registration':
        // Create a complete lead registration component with predefined fields
        newComponent.type = 'lead_capture';
        newComponent.content = {};
        newComponent.properties = {
          fields: {
            name: true,
            email: true,
            phone: true
          },
          introText: 'Etapa Cadastro de Lead',
          successMessage: 'Dados salvos com sucesso!',
          errorMessage: 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.',
          buttonText: 'Enviar'
        };
        break;
      default:
        // For other components, use minimal default content
        break;
    }
    
    // Update the quiz with the new component
    updateQuiz(quiz => ({
      ...quiz,
      steps: quiz.steps?.map(step => 
        step.id === currentStep.id 
          ? { ...step, components: [...step.components, newComponent] }
          : step
      ) || []
    }));
    
    // Select the newly added component
    setSelectedComponentId(newComponent.id);
    
    toast({
      title: "Componente adicionado",
      description: `Componente ${componentType} foi adicionado à etapa.`
    });
  }, [currentStep, updateQuiz, toast]);

  // ✅ SINCRONIZAR COM PERGUNTAS - MODIFIED VERSION
  const handleSyncWithQuestions = useCallback(() => {
    if (!quiz.questions || quiz.questions.length === 0) {
      toast({
        title: "Nenhuma pergunta encontrada",
        description: "Adicione perguntas na aba Perguntas primeiro.",
        variant: "destructive"
      });
      return;
    }

    // Process questions and Lead Registration steps from the Questions tab
    const processedSteps: QuizStep[] = [];
    
    // Keep track of existing steps to preserve non-question steps
    const existingSteps = quiz.steps || [];
    
    // Add existing non-question steps (like introduction, result, etc.) at the beginning
    const introStep = existingSteps.find(step => step.id === 'step-intro');
    if (introStep) {
      processedSteps.push(introStep);
    }

    // Process questions and Lead Registration steps from the Questions tab
    quiz.questions.forEach((question) => {
      if (question.type === 'lead_capture') {
        // Handle Lead Registration step
        // Check if there's already a step with this ID
        const existingStep = existingSteps.find(step => step.id === question.id);
        if (existingStep && existingStep.type === 'lead_registration') {
          // Update existing Lead Registration step
          processedSteps.push(existingStep);
        } else {
          // Create new Lead Registration step
          const leadStep: QuizStep = {
            id: question.id, // Use the question ID directly
            type: 'lead_registration', // Use new lead_registration type instead of custom_lead
            name: question.title,
            title: question.title,
            components: [
              {
                id: `comp-lead-title-${question.id}`,
                type: 'title',
                content: {
                  text: question.settings?.introText || question.title,
                  level: 'h2'
                }
              },
              {
                id: `comp-lead-form-${question.id}`,
                type: 'lead_capture' as ComponentType,
                content: {},
                properties: {
                  fields: {
                    name: question.settings?.fields?.name ?? true,
                    email: question.settings?.fields?.email ?? true,
                    phone: question.settings?.fields?.phone ?? true
                  },
                  introText: question.settings?.introText || question.title,
                  successMessage: question.settings?.successMessage || 'Dados salvos com sucesso!',
                  errorMessage: question.settings?.errorMessage || 'Ocorreu um erro ao salvar seus dados.',
                  buttonText: question.settings?.buttonText || 'Enviar'
                }
              }
            ],
            data: {
              title: question.settings?.introText || question.title,
              fields: [
                { label: "Nome", type: "text", placeholder: "Digite seu nome completo" },
                { label: "E-mail", type: "email", placeholder: "seuemail@email.com" },
                { label: "WhatsApp", type: "tel", placeholder: "(00) 00000-0000" }
              ],
              buttonText: question.settings?.buttonText || 'Enviar',
              successMessage: question.settings?.successMessage || 'Dados salvos com sucesso!',
              errorMessage: question.settings?.errorMessage || 'Ocorreu um erro ao salvar seus dados.',
              required: question.required || false
            }
          };
          processedSteps.push(leadStep);
        }
      } else {
        // Handle regular question - look for existing step first
        const existingStep = existingSteps.find(step => step.id === question.id);
        if (existingStep) {
          processedSteps.push(existingStep);
        } else {
          // Create new step if it doesn't exist
          const step: QuizStep = {
            id: question.id, // Use question ID directly (already a UUID)
            type: 'question',
            name: question.title,
            title: question.title,
            components: [
              // Componente da pergunta principal - COMPLETO E AUTO-SUFICIENTE
              {
                id: `comp-question-${question.id}`,
                type: question.type === 'single' || question.type === 'multiple' ? 'multiple_choice' as const : 
                      question.type === 'slider' || question.type === 'nps' ? 'level_slider' as const :
                      ['short_text', 'long_text', 'email', 'phone'].includes(question.type) ? 'input' as const : 'text' as const,
                content: {
                  // For multiple choice - incluir TODOS os dados necessários
                  ...(question.type === 'single' || question.type === 'multiple' ? {
                    question: question.title,
                    description: question.description || '',
                    options: question.options?.map(opt => ({
                      id: opt.id,
                      label: opt.label,
                      score: opt.score || 0,
                      value: opt.value || opt.label
                    })) || [
                      { id: '1', label: 'Opção A', score: 10, value: 'A' },
                      { id: '2', label: 'Opção B', score: 5, value: 'B' }
                    ],
                    allowMultiple: question.type === 'multiple',
                    required: question.required || false,
                    // Referência para sincronização (opcional)
                    _sourceQuestionId: question.id,
                    _sourceQuestionType: question.type
                  } : question.type === 'slider' || question.type === 'nps' ? {
                    label: question.title,
                    question: question.title,
                    description: question.description || '',
                    min: question.type === 'nps' ? 0 : (question.settings?.min || 1),
                    max: question.type === 'nps' ? 10 : (question.settings?.max || 10),
                    step: question.settings?.step || 1,
                    defaultValue: question.type === 'nps' ? 5 : (question.settings?.defaultValue || 5),
                    required: question.required || false,
                    // Referência para sincronização (opcional)
                    _sourceQuestionId: question.id,
                    _sourceQuestionType: question.type
                  } : ['short_text', 'long_text', 'email', 'phone'].includes(question.type) ? {
                    label: question.title,
                    type: question.type === 'email' ? 'email' : question.type === 'phone' ? 'tel' : 
                          question.type === 'long_text' ? 'textarea' : 'text',
                    placeholder: question.settings?.placeholder || 'Digite sua resposta...',
                    required: question.required || false,
                    // Referência para sincronização (opcional)
                    _sourceQuestionId: question.id,
                    _sourceQuestionType: question.type
                  } : {
                    text: question.title,
                    style: 'normal',
                    // Referência para sincronização (opcional)
                    _sourceQuestionId: question.id,
                    _sourceQuestionType: question.type
                  })
                }
              }
            ]
          };
          processedSteps.push(step);
        }
      }
    });

    // Add existing non-question steps (like result) at the end
    const resultStep = existingSteps.find(step => step.id === 'step-result');
    if (resultStep) {
      processedSteps.push(resultStep);
    }

    // Update the quiz with processed steps
    const updatedQuiz = { ...quiz, steps: processedSteps };
    
    onUpdate(updatedQuiz);
    setActiveStepId(processedSteps[0]?.id || '');
    setIsInitialized(true);
    
    // Adicionar ao histórico
    addToHistory(updatedQuiz);
    
    toast({
      title: "Quiz sincronizado!",
      description: `Atualizado fluxo com ${processedSteps.length} etapas baseadas nas suas perguntas.`
    });
  }, [quiz.questions, quiz, quiz.steps, onUpdate, toast, addToHistory, setActiveStepId]);

  // Verificar se o quiz precisa ser auto-gerado
  const needsAutoGeneration = useMemo(() => {
    return needsAutoLoad(quiz) && !isInitialized;
  }, [quiz, isInitialized, needsAutoLoad]);

  // Função para gerar quiz automaticamente com tema e perguntas
  const generateQuizFromContent = useCallback(() => {
    if (needsAutoLoad(quiz)) {
      setIsAutoGenerating(true);
      
      try {
        const loadedQuiz = autoLoadQuizContent(quiz);
        onUpdate(loadedQuiz);
        
        setActiveStepId(loadedQuiz.steps?.[0]?.id || '');
        setIsInitialized(true);
        
        // Adicionar ao histórico
        setHistory([loadedQuiz]);
        setHistoryIndex(0);
        
        toast({
          title: "Quiz carregado automaticamente!",
          description: `Tema aplicado e ${loadedQuiz.steps?.length || 0} etapas criadas.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Erro ao carregar quiz:', error);
        toast({
          title: "Erro no carregamento automático",
          description: "Não foi possível carregar o quiz. Configure manualmente.",
          variant: "destructive"
        });
      } finally {
        setIsAutoGenerating(false);
      }
    }
  }, [quiz, needsAutoLoad, autoLoadQuizContent, onUpdate, toast]);

  // Auto-inicialização quando necessário
  useEffect(() => {
    if (needsAutoGeneration && !isAutoGenerating) {
      console.log('🚀 Auto-gerando quiz com perguntas e tema...');
      generateQuizFromContent();
    } else if (!isInitialized && quiz.steps && quiz.steps.length > 0) {
      // Se já tem steps, apenas inicializar
      setActiveStepId(quiz.steps[0]?.id || '');
      setIsInitialized(true);
      setHistory([quiz]);
      setHistoryIndex(0);
    } else if (!isInitialized && !needsAutoGeneration) {
      // Não há conteúdo para gerar, inicializar vazio
      setIsInitialized(true);
      setHistory([quiz]);
      setHistoryIndex(0);
    }
  }, [needsAutoGeneration, isAutoGenerating, generateQuizFromContent, isInitialized, quiz]);

  // Gerenciamento de etapas
  const handleStepAdd = useCallback(() => {
    const newStep: QuizStep = {
      id: crypto.randomUUID(), // Generate clean UUID without prefix
      type: 'question',
      name: `Etapa ${(quiz.steps?.length || 0) + 1}`,
      title: 'Nova Etapa',
      components: []
    };
    
    updateQuiz(q => ({
      ...q,
      steps: [...(q.steps || []), newStep]
    }));
    
    setActiveStepId(newStep.id);
    
    toast({
      title: "Etapa criada",
      description: `Nova etapa "${newStep.name}" foi criada.`
    });
  }, [quiz.steps, updateQuiz, toast]);

  const handleStepDelete = useCallback((stepId: string) => {
    updateQuiz(quiz => ({
      ...quiz,
      steps: (quiz.steps || []).filter(step => step.id !== stepId)
    }));
    
    if (activeStepId === stepId) {
      const remainingSteps = quiz.steps?.filter(step => step.id !== stepId) || [];
      setActiveStepId(remainingSteps[0]?.id || '');
    }
    
    toast({
      title: "Etapa removida",
      description: "A etapa foi removida do quiz."
    });
  }, [quiz.steps, activeStepId, updateQuiz, toast]);

  // Function to add a complete lead registration step
  const addLeadRegistrationStep = useCallback(() => {
    const newStep: QuizStep = {
      id: crypto.randomUUID(), // Generate clean UUID without prefix
      type: 'lead_registration', // Using lead_registration type for lead registration steps
      name: 'Etapa Cadastro de Lead',
      title: 'Etapa Cadastro de Lead',
      components: [
        {
          id: `comp-lead-title-${Date.now()}`,
          type: 'title',
          content: {
            text: 'Etapa Cadastro de Lead',
            level: 'h2'
          }
        },
        {
          id: `comp-lead-description-${Date.now()}`,
          type: 'text',
          content: {
            text: 'Preencha seus dados abaixo para continuar',
            style: 'normal'
          }
        },
        {
          id: `comp-lead-form-${Date.now()}`,
          type: 'lead_capture',
          content: {},
          properties: {
            fields: {
              name: true,
              email: true,
              phone: true
            },
            introText: 'Preencha seus dados abaixo',
            successMessage: 'Dados salvos com sucesso!',
            errorMessage: 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.',
            buttonText: 'Enviar'
          }
        }
      ],
      data: {
        title: 'Etapa Cadastro de Lead',
        fields: [
          { label: "Nome", type: "text", placeholder: "Digite seu nome completo" },
          { label: "E-mail", type: "email", placeholder: "seuemail@email.com" },
          { label: "WhatsApp", type: "tel", placeholder: "(00) 00000-0000" }
        ],
        buttonText: 'Enviar',
        successMessage: 'Dados salvos com sucesso!',
        errorMessage: 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.',
        required: true
      }
    };
    
    updateQuiz(q => ({
      ...q,
      steps: [...(q.steps || []), newStep]
    }));
    
    setActiveStepId(newStep.id);
    
    toast({
      title: "Etapa de Lead criada",
      description: `Etapa "Cadastro de Lead" foi adicionada ao quiz.`
    });
  }, [updateQuiz, toast, setActiveStepId]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data?.current?.type) {
      setDraggedComponentType(active.data.current.type as ComponentType);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    // If we're dragging a component from the sidebar over the preview area
    if (over && over.id === 'preview-drop-zone' && active.data?.current?.type && currentStep) {
      return;
    }
    
    // If we're reordering components within the preview
    if (active.id !== over?.id && currentStep) {
      const activeIndex = currentStep.components.findIndex(c => c.id === active.id);
      const overIndex = currentStep.components.findIndex(c => c.id === over?.id);
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        // Update the component order in the quiz
        updateQuiz(quiz => {
          const steps = [...(quiz.steps || [])];
          const stepIndex = steps.findIndex(s => s.id === currentStep.id);
          
          if (stepIndex !== -1) {
            const newComponents = arrayMove(currentStep.components, activeIndex, overIndex);
            steps[stepIndex] = {
              ...steps[stepIndex],
              components: newComponents
            };
          }
          
          return {
            ...quiz,
            steps
          };
        });
      }
    }
  }, [currentStep, updateQuiz]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset drag state
    setDraggedComponentType(null);
    
    // Check if we're dropping on a valid target (the preview area)
    if (over && over.id === 'preview-drop-zone' && active.data?.current?.type && currentStep) {
      const componentType = active.data.current.type as ComponentType;
      addComponentToStep(componentType);
    }
  }, [currentStep, addComponentToStep]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const componentCount = currentStep?.components.length || 0;

  // Renderização condicional baseada no estado
  if (!isInitialized || isAutoGenerating) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {isAutoGenerating ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Wand2 className="w-8 h-8 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isAutoGenerating ? 'Gerando Quiz...' : 'Preparando Editor'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isAutoGenerating 
              ? 'Aplicando tema e criando etapas baseadas nas suas perguntas...'
              : 'Carregando configurações e preparando o canvas visual...'
            }
          </p>
          {needsAutoGeneration && !isAutoGenerating && (
            <Button onClick={generateQuizFromContent} className="gap-2">
              <Wand2 className="w-4 h-4" />
              Gerar Quiz Automaticamente
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Toolbar superior */}
        <VisualToolbar
          quiz={quiz}
          isDirty={isDirty}
          autoSaving={autoSaving}
          canUndo={canUndo}
          canRedo={canRedo}
          componentCount={componentCount}
          onUpdateName={(name) => updateQuiz(q => ({ ...q, name }))}
          onSave={onSave}
          onPreview={onPreview}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSyncWithQuestions={handleSyncWithQuestions}
          onPublish={onPublish}
        />

        {/* Layout principal */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Painel esquerdo: Biblioteca e Etapas */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
              <div className="h-full border-r bg-muted/20 flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Etapas do Quiz</h3>
                    <Button size="sm" variant="outline" onClick={handleStepAdd}>
                      <Plus className="w-3 h-3 mr-1" />
                      Nova
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {quiz.steps?.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          activeStepId === step.id 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-background hover:bg-muted border-muted-foreground/20'
                        }`}
                        onClick={() => setActiveStepId(step.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {step.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {step.components.length}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="text-xs">
                          Nenhuma etapa criada. Clique em "Nova" para começar.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <EnhancedComponentLibrary 
                    onComponentAdd={addComponentToStep} 
                    userPlan={'premium'}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Painel central: Canvas com Preview Real */}
            <ResizablePanel defaultSize={50} minSize={40} maxSize={60}>
              <div className="h-full bg-slate-50 flex flex-col">
                {/* Controles de visualização */}
                <div className="p-3 border-b bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {currentStep?.name || 'Selecione uma etapa'}
                    </span>
                  </div>
                  <div className="flex items-center border rounded-lg p-1">
                    <Button 
                      variant={previewMode === 'desktop' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={previewMode === 'tablet' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={previewMode === 'mobile' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Canvas com Preview Real */}
                <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
                  {currentStep ? (
                    <div className="w-full h-full flex items-center justify-center" id="preview-drop-zone">
                      {/* Device Frame Container */}
                      <div 
                        className="bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-300 w-full max-w-4xl"
                        style={{
                          minHeight: '600px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {/* Device Frame Header */}
                        <div className="border-b bg-muted/30 p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {previewMode === 'desktop' && <Monitor className="w-4 h-4" />}
                            {previewMode === 'tablet' && <Tablet className="w-4 h-4" />}
                            {previewMode === 'mobile' && <Smartphone className="w-4 h-4" />}
                            <span className="text-xs font-medium capitalize">{previewMode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                        
                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                          <PreviewErrorBoundary>
                            <RealQuizPreview 
                              key={`preview-${activeStepId}-${quiz.updatedAt || quizVersion || Date.now()}`}
                              quiz={quiz}
                              activeStepId={currentStep.id}
                              deviceView={previewMode}
                              className="w-full"
                            />
                          </PreviewErrorBoundary>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma Etapa Selecionada</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Selecione uma etapa na barra lateral ou crie uma nova para começar
                        </p>
                        <Button onClick={handleStepAdd}>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeira Etapa
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Painel direito: Propriedades */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
              <div className="h-full border-l bg-card">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm">Propriedades do Quiz</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Informações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Etapas:</span>
                        <Badge variant="secondary">{quiz.steps?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Perguntas:</span>
                        <Badge variant="secondary">{quiz.questions?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={quiz.status === 'published' ? 'default' : 'secondary'}>
                          {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Tema Aplicado</h4>
                    <div className="space-y-2">
                      {quiz.theme ? (
                        <div className="p-3 rounded border bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: quiz.theme.primary }}
                            />
                            <span className="text-sm font-medium">Tema Personalizado</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cores, fontes e estilos aplicados
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Settings className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            Configure um tema na aba Tema
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={onNavigateToTheme}
                          >
                            Ir para Tema
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Preview</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      O preview mostra exatamente como seu quiz será exibido quando publicado.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={onPreview}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Abrir Preview Completo
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </DndContext>
  );
}