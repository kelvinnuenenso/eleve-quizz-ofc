import { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { QuizStep, CustomLeadStepData } from '@/types/quiz';
import { QuestionEditor } from './QuestionEditor';
import { supabase } from '@/integrations/supabase/client';

// SortableStepItem component
function SortableStepItem({ 
  step, 
  index, 
  onUpdateStep, 
  onDeleteStep,
  isSettingsOpen,
  toggleSettings,
  newField,
  updateNewField,
  addField,
  removeField
}: {
  step: QuizStep;
  index: number;
  onUpdateStep: (stepId: string, updates: Partial<QuizStep>) => void;
  onDeleteStep: (stepId: string) => void;
  isSettingsOpen: Record<string, boolean>;
  toggleSettings: (stepId: string) => void;
  newField: Record<string, string>;
  updateNewField: (stepId: string, value: string) => void;
  addField: (stepId: string, data: CustomLeadStepData) => void;
  removeField: (stepId: string, data: CustomLeadStepData, field: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldIcon = (field: string) => {
    switch (field.toLowerCase()) {
      case 'name':
        return <User className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
      case 'phone':
        return <Phone className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field.toLowerCase()) {
      case 'name':
        return 'Nome';
      case 'email':
        return 'E-mail';
      case 'whatsapp':
        return 'WhatsApp';
      case 'phone':
        return 'Telefone';
      default:
        return field;
    }
  };

  if (step.type === 'custom_lead' || step.type === 'lead_registration') {
    const data = step.data as CustomLeadStepData;
    
    return (
      <div ref={setNodeRef} style={style} className="group">
        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-4">
            {/* Drag handle */}
            <div 
              className="flex flex-col items-center gap-2 mt-2 cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                {index + 1}
              </div>
            </div>

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
                    className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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
                <Label>Campos para coleta</Label>
                <div className="flex flex-wrap gap-2">
                  {data.fields.map((field) => {
                    const fieldLabel = typeof field === 'string' ? field : field.label;
                    return (
                      <Badge 
                        key={fieldLabel} 
                        variant="outline" 
                        className="flex items-center gap-1 pl-2 pr-1 py-1"
                      >
                        <span className="flex items-center gap-1">
                          {getFieldIcon(fieldLabel)}
                          {getFieldLabel(fieldLabel)}
                        </span>
                        <button 
                          onClick={() => removeField(step.id, data, fieldLabel)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </Badge>
                    );
                  })}
                </div>

                {/* For lead_registration steps, don't allow adding new fields */}
                {step.type !== 'lead_registration' && (
                  <div className="flex gap-2">
                    <Input
                      value={newField[step.id] || ''}
                      onChange={(e) => updateNewField(step.id, e.target.value)}
                      placeholder="Adicionar campo personalizado..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addField(step.id, data);
                        }
                      }}
                    />
                    <Button onClick={() => addField(step.id, data)} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Settings panel */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Configurações avançadas</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSettings(step.id)}
                  >
                    {isSettingsOpen[step.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {isSettingsOpen[step.id] && (
                  <div className="space-y-4">
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

                    <div className="flex items-center space-x-2">
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
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  } else {
    // For question steps, we might need to render them differently
    // This is a placeholder - you might want to render actual question components here
    return (
      <div ref={setNodeRef} style={style} className="group">
        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {step.type === 'question' ? 'Pergunta' : 'Resultado'}
              </Badge>
              <span className="text-sm text-muted-foreground">{step.title}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteStep(step.id)}
              className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}

interface StepListEditorProps {
  steps: QuizStep[];
  questions: any[]; // Assuming questions are still needed
  onUpdateStep: (stepId: string, updates: Partial<QuizStep>) => void;
  onDeleteStep: (stepId: string) => void;
  onDragEnd: (event: any) => void;
  quizId: string; // Add quizId to save order to Supabase
}

export function StepListEditor({ steps, questions, onUpdateStep, onDeleteStep, onDragEnd, quizId }: StepListEditorProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState<Record<string, boolean>>({});
  const [newField, setNewField] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleSettings = (stepId: string) => {
    setIsSettingsOpen(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const updateNewField = (stepId: string, value: string) => {
    setNewField(prev => ({
      ...prev,
      [stepId]: value
    }));
  };

  const addField = (stepId: string, data: CustomLeadStepData) => {
    const field = newField[stepId]?.trim();
    if (field && !data.fields.includes(field)) {
      onUpdateStep(stepId, {
        data: {
          ...data,
          fields: [...data.fields, field]
        }
      });
      updateNewField(stepId, '');
    }
  };

  const removeField = (stepId: string, data: CustomLeadStepData, field: string) => {
    onUpdateStep(stepId, {
      data: {
        ...data,
        fields: data.fields.filter(f => (typeof f === 'string' ? f !== field : f.label !== field))
      }
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex(step => step.id === active.id);
      const newIndex = steps.findIndex(step => step.id === over?.id);

      if (oldIndex !== newIndex) {
        // Update the order in the UI first
        const newSteps = arrayMove(steps, oldIndex, newIndex);
        // We need to pass this back to the parent component to update the state
        
        // Save the new order to Supabase
        try {
          // Update each step with its new order
          const updates = newSteps.map((step, index) => ({
            id: step.id,
            order: index
          }));

          // Update all steps in Supabase
          for (const update of updates) {
            const { error } = await supabase
              .from('quiz_steps')
              .update({ order: update.order })
              .eq('id', update.id)
              .eq('quiz_id', quizId);

            if (error) {
              console.error('Error updating step order:', error);
              throw error;
            }
          }

          console.log('Step order updated successfully');
        } catch (error) {
          console.error('Error saving step order to Supabase:', error);
        }
      }
    }

    // Call the parent's onDragEnd handler
    onDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={steps.map(step => step.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {steps.map((step, index) => (
            <SortableStepItem
              key={step.id}
              step={step}
              index={index}
              onUpdateStep={onUpdateStep}
              onDeleteStep={onDeleteStep}
              isSettingsOpen={isSettingsOpen}
              toggleSettings={toggleSettings}
              newField={newField}
              updateNewField={updateNewField}
              addField={addField}
              removeField={removeField}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}