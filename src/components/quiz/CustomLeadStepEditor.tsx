import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
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

interface CustomLeadStepEditorProps {
  step: QuizStep;
  index: number;
  onUpdate: (stepId: string, updates: Partial<QuizStep>) => void;
  onDelete: (stepId: string) => void;
}

export function CustomLeadStepEditor({ step, index, onUpdate, onDelete }: CustomLeadStepEditorProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newField, setNewField] = useState('');
  
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

  const data = step.data as CustomLeadStepData;

  const addField = () => {
    if (newField.trim() && !data.fields.includes(newField.trim())) {
      onUpdate(step.id, {
        data: {
          ...data,
          fields: [...data.fields, newField.trim()]
        }
      });
      setNewField('');
    }
  };

  const removeField = (field: string) => {
    onUpdate(step.id, {
      data: {
        ...data,
        fields: data.fields.filter(f => f !== field)
      }
    });
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
                  onClick={() => onDelete(step.id)}
                  className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Step title */}
            <Input
              value={data.title}
              onChange={(e) => onUpdate(step.id, { 
                data: { ...data, title: e.target.value } 
              })}
              placeholder="Título da etapa..."
              className="text-lg font-medium"
            />

            {/* Fields configuration */}
            <div className="space-y-3">
              <Label>Campos para coleta</Label>
              <div className="flex flex-wrap gap-2">
                {data.fields.map((field) => (
                  <Badge 
                    key={field} 
                    variant="outline" 
                    className="flex items-center gap-1 pl-2 pr-1 py-1"
                  >
                    <span className="flex items-center gap-1">
                      {getFieldIcon(field)}
                      {getFieldLabel(field)}
                    </span>
                    <button 
                      onClick={() => removeField(field)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  placeholder="Adicionar campo personalizado..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addField();
                    }
                  }}
                />
                <Button onClick={addField} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Settings panel */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Configurações avançadas</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  {isSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {isSettingsOpen && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`button-text-${step.id}`}>Texto do botão</Label>
                    <Input
                      id={`button-text-${step.id}`}
                      value={data.buttonText}
                      onChange={(e) => onUpdate(step.id, { 
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
                      onChange={(e) => onUpdate(step.id, { 
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
                      onChange={(e) => onUpdate(step.id, { 
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
                      onCheckedChange={(checked) => onUpdate(step.id, { 
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
}