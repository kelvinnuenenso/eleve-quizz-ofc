import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuizStep } from '@/types/quiz';
import { User, Mail, Phone } from 'lucide-react';

interface LeadRegistrationStepProps {
  step: QuizStep;
  onUpdate: (stepId: string, updates: Partial<QuizStep>) => void;
  onRemoveField?: (fieldIndex: number) => void;
}

export function LeadRegistrationStep({ step, onUpdate }: LeadRegistrationStepProps) {
  // Default fields for lead registration
  const defaultFields = [
    { 
      label: "Nome", 
      type: "text", 
      placeholder: "Digite seu nome completo",
      required: true,
      icon: "user"
    },
    { 
      label: "E-mail", 
      type: "email", 
      placeholder: "seuemail@email.com",
      required: true,
      icon: "mail"
    },
    { 
      label: "WhatsApp", 
      type: "tel", 
      placeholder: "(00) 00000-0000",
      required: false,
      icon: "phone"
    }
  ];

  // Get fields from step data or use defaults
  const fields = step.data?.fields && Array.isArray(step.data.fields) 
    ? step.data.fields 
    : defaultFields;

  const getFieldIcon = (field: any) => {
    const fieldIcon = field.icon;
    
    switch (fieldIcon?.toLowerCase()) {
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
  };

  const updateField = (index: number, updates: Partial<any>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    
    onUpdate(step.id, { 
      data: { 
        ...step.data, 
        fields: updatedFields 
      } 
    });
  };

  const addField = () => {
    const newField = { 
      label: "Novo Campo", 
      type: "text", 
      placeholder: "Digite...", 
      required: false,
      icon: "user"
    };
    
    const updatedFields = [...fields, newField];
    onUpdate(step.id, { 
      data: { 
        ...step.data, 
        fields: updatedFields 
      } 
    });
  };

  const removeField = (index: number) => {
    // Don't allow removing the first three default fields
    if (index < 3) return;
    
    const updatedFields = fields.filter((_: any, i: number) => i !== index);
    onUpdate(step.id, { 
      data: { 
        ...step.data, 
        fields: updatedFields 
      } 
    });
  };

  const updateStepData = (updates: Partial<any>) => {
    onUpdate(step.id, { 
      data: { 
        ...step.data, 
        ...updates 
      } 
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Step header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Etapa Cadastro de Lead</h3>
              <p className="text-sm text-muted-foreground">Coleta de informações do participante</p>
            </div>
          </div>
        </div>

        {/* Step title */}
        <div className="space-y-2">
          <Label htmlFor={`step-title-${step.id}`}>Título da Etapa</Label>
          <Input
            id={`step-title-${step.id}`}
            value={step.data?.title || step.title || 'Etapa Cadastro de Lead'}
            onChange={(e) => updateStepData({ title: e.target.value })}
            placeholder="Título da etapa..."
          />
        </div>

        {/* Fields configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Campos para coleta</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addField}
            >
              Adicionar Campo
            </Button>
          </div>
          
          <div className="space-y-3">
            {fields.map((field: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded">
                    {getFieldIcon(field)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Label"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="border rounded px-2 h-8 text-sm w-full"
                      >
                        <option value="text">Texto</option>
                        <option value="email">E-mail</option>
                        <option value="tel">Telefone</option>
                        <option value="number">Número</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Placeholder"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`required-${index}`} className="text-xs">
                        Obrigatório
                      </Label>
                    </div>
                    
                    {/* Only allow removing custom fields, not the default ones */}
                    {index >= 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step settings */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`button-text-${step.id}`}>Texto do botão</Label>
              <Input
                id={`button-text-${step.id}`}
                value={step.data?.buttonText || 'Enviar'}
                onChange={(e) => updateStepData({ buttonText: e.target.value })}
                placeholder="Texto do botão..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`success-message-${step.id}`}>Mensagem de sucesso</Label>
              <Input
                id={`success-message-${step.id}`}
                value={step.data?.successMessage || 'Dados salvos com sucesso!'}
                onChange={(e) => updateStepData({ successMessage: e.target.value })}
                placeholder="Mensagem de sucesso..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`error-message-${step.id}`}>Mensagem de erro</Label>
            <Input
              id={`error-message-${step.id}`}
              value={step.data?.errorMessage || 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.'}
              onChange={(e) => updateStepData({ errorMessage: e.target.value })}
              placeholder="Mensagem de erro..."
            />
          </div>
        </div>
      </div>
    </Card>
  );
}