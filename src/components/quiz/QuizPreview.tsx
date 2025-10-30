import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Quiz, QuizAnswer, QuizStep, Component } from '@/types/quiz';
import { ArrowRight, ArrowLeft, Star, Smartphone, Monitor, Play, PartyPopper, UserPlus } from 'lucide-react';

interface QuizPreviewProps {
  quiz: Quiz;
  onClose: () => void;
}

const QuizPreview = ({ quiz, onClose }: QuizPreviewProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  // Reset selected options when step changes
  const resetSelection = () => {
    setSelectedOptions([]);
    setInputValues({});
    setSliderValues({});
  };

  // Get current step based on whether we're using steps or questions
  const currentStep = quiz.steps?.[currentStepIndex] || {
    id: `question-${currentStepIndex}`,
    type: 'question',
    name: quiz.questions?.[currentStepIndex]?.title || `Pergunta ${currentStepIndex + 1}`,
    title: quiz.questions?.[currentStepIndex]?.title || `Pregunta ${currentStepIndex + 1}`,
    components: [],
  } as QuizStep;

  // Convert questions to components for backward compatibility
  const getComponentsForStep = (step: QuizStep) => {
    if (step.components && step.components.length > 0) {
      return step.components;
    }
    
    // If this is a question-based step, convert the question to components
    if (quiz.questions && quiz.questions[currentStepIndex]) {
      const question = quiz.questions[currentStepIndex];
      return convertQuestionToComponents(question);
    }
    
    return [];
  };

  // Convert a question to components for rendering
  const convertQuestionToComponents = (question: any) => {
    const components: Component[] = [];
    
    // Add title component
    components.push({
      id: `title-${question.id}`,
      type: 'title',
      content: {
        text: question.title,
        level: 'h1'
      }
    });
    
    // Add description if exists
    if (question.description) {
      components.push({
        id: `desc-${question.id}`,
        type: 'text',
        content: {
          text: question.description,
          style: 'normal'
        }
      });
    }
    
    // Add input component based on question type
    switch (question.type) {
      case 'single':
      case 'multiple':
        components.push({
          id: `choice-${question.id}`,
          type: 'multiple_choice',
          content: {
            question: question.title,
            options: question.options || [],
            allowMultiple: question.type === 'multiple',
            required: question.required
          }
        });
        break;
        
      case 'nps':
      case 'slider':
        components.push({
          id: `slider-${question.id}`,
          type: 'level_slider',
          content: {
            label: question.title,
            min: question.settings?.min || (question.type === 'nps' ? 0 : 1),
            max: question.settings?.max || (question.type === 'nps' ? 10 : 10),
            step: question.settings?.step || 1,
            defaultValue: question.settings?.defaultValue || 5
          }
        });
        break;
        
      case 'rating':
        components.push({
          id: `rating-${question.id}`,
          type: 'rating',
          content: {
            label: question.title
          }
        });
        break;
        
      case 'email':
      case 'phone':
      case 'short_text':
      case 'long_text':
        components.push({
          id: `input-${question.id}`,
          type: 'input',
          content: {
            label: question.title,
            type: question.type === 'email' ? 'email' : 
                  question.type === 'phone' ? 'tel' : 
                  question.type === 'long_text' ? 'textarea' : 'text',
            placeholder: question.settings?.placeholder || 
                        (question.type === 'email' ? 'seu@email.com' :
                         question.type === 'phone' ? '(11) 99999-9999' :
                         'Digite sua resposta...'),
            required: question.required
          }
        });
        break;
        
      case 'lead_capture':
        components.push({
          id: `lead-${question.id}`,
          type: 'lead_capture',
          content: {},
          properties: {
            fields: question.settings?.fields || {
              name: true,
              email: true,
              phone: true
            },
            introText: question.settings?.introText || question.title,
            successMessage: question.settings?.successMessage || 'Dados salvos com sucesso!',
            errorMessage: question.settings?.errorMessage || 'Ocorreu um erro ao salvar seus dados.',
            buttonText: question.settings?.buttonText || 'Enviar'
          }
        });
        break;
        
      default:
        components.push({
          id: `default-${question.id}`,
          type: 'text',
          content: {
            text: 'Tipo de pergunta não suportado no preview.',
            style: 'normal'
          }
        });
    }
    
    return components;
  };

  const components = getComponentsForStep(currentStep);
  
  const totalSteps = quiz.steps?.length || quiz.questions?.length || 0;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleAnswer = (componentId: string, value: any) => {
    const newAnswers = [
      ...answers,
      { questionId: componentId, value }
    ];
    setAnswers(newAnswers);

    if (!isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
      resetSelection();
    } else {
      // Show result preview
      alert('Quiz completo! Em um quiz real, o usuário seria direcionado para a página de resultado.');
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      // Remove the last answer
      setAnswers(answers.slice(0, -1));
      resetSelection();
    }
  };

  // Get theme styles
  const getThemeStyles = () => ({
    backgroundColor: quiz.theme?.background || '#FAFAFA',
    color: quiz.theme?.text || '#1F2937',
    fontFamily: quiz.theme?.fontFamily || 'Inter, sans-serif',
    minHeight: '100vh'
  });

  const getCardStyles = () => ({
    backgroundColor: quiz.theme?.cardBackground || '#FFFFFF',
    borderRadius: quiz.theme?.borderRadius || '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  });

  const getButtonStyles = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const baseStyles = {
      borderRadius: quiz.theme?.buttonStyle === 'pill' ? '999px' : quiz.theme?.borderRadius || '12px',
      transition: 'all 0.2s ease-in-out'
    };

    if (variant === 'primary') {
      return {
        ...baseStyles,
        background: quiz.theme?.gradient 
          ? `linear-gradient(135deg, ${quiz.theme.primary}, ${quiz.theme.accent})`
          : quiz.theme?.primary || '#2563EB',
        color: quiz.theme?.cardBackground || '#FFFFFF',
        border: 'none'
      };
    }

    if (variant === 'outline') {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        borderColor: quiz.theme?.primary || '#2563EB',
        color: quiz.theme?.text || '#1F2937',
        borderWidth: '2px'
      };
    }

    return baseStyles;
  };

  // Helper function to add opacity to hex colors
  const addOpacityToHex = (hex: string, opacity: number) => {
    if (!hex || !hex.startsWith('#')) return '';
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } catch (e) {
      return '';
    }
  };

  // Helper function to generate slider gradient
  const getSliderGradient = (primaryColor: string, currentValue: number, min: number, max: number) => {
    const percentage = ((currentValue - min) / (max - min)) * 100;
    return `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`;
  };

  const renderComponent = (component: Component) => {
    const { type, content, properties } = component;

    switch (type) {
      case 'title':
        const level = content?.level || 'h1';
        const TitleTag = level as keyof JSX.IntrinsicElements;
        
        return (
          <TitleTag 
            style={{
              color: quiz.theme?.text || '#1F2937',
              fontFamily: quiz.theme?.fontFamily || 'Inter, sans-serif',
              textAlign: quiz.theme?.centerAlign ? 'center' as const : 'left' as const
            }}
            className={`font-bold mb-4 ${{
              h1: 'text-3xl md:text-4xl',
              h2: 'text-2xl md:text-3xl',
              h3: 'text-xl md:text-2xl',
              default: 'text-lg'
            }[level] || 'text-lg'} text-center`}
          >
            {content?.text || 'Título'}
          </TitleTag>
        );

      case 'text':
        return (
          <p 
            style={{
              color: quiz.theme?.text || '#1F2937',
              fontFamily: quiz.theme?.fontFamily || 'Inter, sans-serif',
              textAlign: quiz.theme?.centerAlign ? 'center' : 'left'
            }}
            className={`mb-6 ${{
              subtitle: 'text-lg text-muted-foreground',
              small: 'text-sm',
              default: 'text-base'
            }[content?.style || 'default'] || 'text-base'} text-center`}
          >
            {content?.text || 'Texto do parágrafo...'}
          </p>
        );

      case 'button':
        return (
          <div className="mb-6 flex justify-center">
            <Button
              style={getButtonStyles(content?.variant || 'primary')}
              size="lg"
              className="min-w-[200px] font-semibold hover:scale-105 transition-transform"
            >
              {content?.text || 'Clique aqui'}
              {content?.action === 'next' && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        );

      case 'input':
        const inputId = `input-${component.id}`;
        const inputType = content?.type || 'text';
        
        return (
          <div className="mb-6 space-y-3 max-w-md mx-auto">
            {content?.label && (
              <label 
                htmlFor={inputId}
                style={{ color: quiz.theme?.text || '#1F2937' }}
                className="block text-sm font-medium text-center"
              >
                {content.label}
                {content?.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            
            {inputType === 'textarea' ? (
              <Textarea
                id={inputId}
                placeholder={content?.placeholder || 'Digite sua resposta...'}
                value={inputValues[component.id] || ''}
                onChange={(e) => setInputValues(prev => ({ ...prev, [component.id]: e.target.value }))}
                className="text-lg py-3 w-full"
                style={{
                  borderRadius: quiz.theme?.borderRadius || '8px',
                  borderColor: quiz.theme?.primary || '#E5E7EB'
                }}
                rows={4}
              />
            ) : (
              <Input
                id={inputId}
                type={inputType}
                placeholder={content?.placeholder || 'Digite sua resposta...'}
                value={inputValues[component.id] || ''}
                onChange={(e) => setInputValues(prev => ({ ...prev, [component.id]: e.target.value }))}
                className="text-lg py-3 w-full"
                style={{
                  borderRadius: quiz.theme?.borderRadius || '8px',
                  borderColor: quiz.theme?.primary || '#E5E7EB'
                }}
              />
            )}
            
            <Button
              style={getButtonStyles('primary')}
              size="lg"
              className="w-full mt-2"
              onClick={() => handleAnswer(component.id, inputValues[component.id] || '')}
              disabled={!inputValues[component.id]}
            >
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'multiple_choice':
        // Calculate colors with opacity
        let descriptionColor = '#6B7280';
        if (quiz.theme?.text) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.text, 0.5);
          if (colorWithOpacity) {
            descriptionColor = colorWithOpacity;
          }
        }
        
        return (
          <div className="mb-8 space-y-4 max-w-2xl mx-auto">
            {content?.question && (
              <h3 
                style={{ color: quiz.theme?.text || '#1F2937' }}
                className="text-xl font-semibold mb-4 text-center"
              >
                {content.question}
              </h3>
            )}
            
            {content?.description && (
              <p 
                style={{ color: descriptionColor }}
                className="text-base mb-6 text-center"
              >
                {content.description}
              </p>
            )}

            <div className="space-y-3">
              {(content?.options || []).map((option: any, optIndex: number) => {
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <Button
                    key={`${option.id || optIndex}`}
                    variant="outline"
                    className="w-full p-4 h-auto text-left justify-start transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      ...getButtonStyles(isSelected ? 'primary' : 'outline'),
                      backgroundColor: isSelected 
                        ? (quiz.theme?.gradient 
                            ? `linear-gradient(135deg, ${quiz.theme.primary}, ${quiz.theme.accent})`
                            : quiz.theme?.primary || '#2563EB')
                        : 'transparent',
                      color: isSelected 
                        ? quiz.theme?.cardBackground || '#FFFFFF'
                        : quiz.theme?.text || '#1F2937'
                    }}
                    onClick={() => {
                      if (content?.allowMultiple) {
                        const newSelection = isSelected
                          ? selectedOptions.filter(id => id !== option.id)
                          : [...selectedOptions, option.id];
                        setSelectedOptions(newSelection);
                      } else {
                        setSelectedOptions([option.id]);
                        // For single choice, automatically submit
                        setTimeout(() => handleAnswer(component.id, option.id), 100);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-medium">{option.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>

            {content?.allowMultiple && selectedOptions.length > 0 && (
              <Button
                style={getButtonStyles('primary')}
                size="lg"
                className="w-full mt-4 font-semibold"
                onClick={() => handleAnswer(component.id, selectedOptions)}
              >
                Continuar ({selectedOptions.length} selecionadas)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        );

      case 'level_slider':
        const sliderId = component.id;
        const min = content?.min || 1;
        const max = content?.max || 10;
        const step = content?.step || 1;
        const currentValue = sliderValues[sliderId] || content?.defaultValue || Math.floor((min + max) / 2);

        // Calculate colors with opacity
        let sliderDescriptionColor = '#6B7280';
        if (quiz.theme?.text) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.text, 0.5);
          if (colorWithOpacity) {
            sliderDescriptionColor = colorWithOpacity;
          }
        }

        return (
          <div className="mb-8 space-y-4 max-w-2xl mx-auto">
            {(content?.label || content?.question) && (
              <h3 
                style={{ color: quiz.theme?.text || '#1F2937' }}
                className="text-xl font-semibold mb-4 text-center"
              >
                {content.label || content.question}
              </h3>
            )}
            
            {content?.description && (
              <p 
                style={{ color: sliderDescriptionColor }}
                className="text-base mb-6 text-center"
              >
                {content.description}
              </p>
            )}

            <div className="px-2 space-y-4">
              <div className="relative">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={currentValue}
                  onChange={(e) => setSliderValues(prev => ({ 
                    ...prev, 
                    [sliderId]: parseInt(e.target.value) 
                  }))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: getSliderGradient(quiz.theme?.primary || '#2563EB', currentValue, min, max),
                    WebkitAppearance: 'none',
                    height: '12px',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
              </div>
            
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: quiz.theme?.text ? addOpacityToHex(quiz.theme.text, 0.5) || '#9CA3AF' : '#9CA3AF' }}>{min}</span>
                <div 
                  className="px-4 py-2 rounded-full font-semibold text-lg"
                  style={{
                    backgroundColor: quiz.theme?.primary || '#2563EB',
                    color: quiz.theme?.cardBackground || '#FFFFFF'
                  }}
                >
                  {currentValue}
                </div>
                <span style={{ color: quiz.theme?.text ? addOpacityToHex(quiz.theme.text, 0.5) || '#9CA3AF' : '#9CA3AF' }}>{max}</span>
              </div>
              
              <Button
                style={getButtonStyles('primary')}
                size="lg"
                className="w-full mt-2"
                onClick={() => handleAnswer(component.id, currentValue)}
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="mb-8 space-y-4 max-w-md mx-auto">
            {content?.label && (
              <h3 
                style={{ color: quiz.theme?.text || '#1F2937' }}
                className="text-xl font-semibold mb-4 text-center"
              >
                {content.label}
              </h3>
            )}
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="outline"
                  size="lg"
                  className="w-12 h-12 hover:bg-yellow-100 hover:border-yellow-400"
                  onClick={() => {
                    handleAnswer(component.id, rating);
                  }}
                >
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </Button>
              ))}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Clique nas estrelas para avaliar
            </div>
          </div>
        );

      case 'confetti':
        return (
          <div className="mb-6 text-center max-w-md mx-auto">
            <PartyPopper 
              className="w-16 h-16 mx-auto animate-bounce"
              style={{ color: quiz.theme?.primary || '#2563EB' }}
            />
            <p 
              style={{ color: quiz.theme?.text || '#1F2937' }}
              className="mt-2 text-lg font-medium"
            >
              🎉 Parabéns! 🎉
            </p>
          </div>
        );

      case 'lead_capture':
        return (
          <div className="mb-8 max-w-md mx-auto space-y-4">
            <h3 
              style={{ color: quiz.theme?.text || '#1F2937' }}
              className="text-xl font-semibold mb-2 text-center"
            >
              {properties?.introText || 'Preencha seus dados'}
            </h3>
            
            <div className="space-y-3">
              {properties?.fields?.name && (
                <Input
                  placeholder="Nome completo"
                  value={inputValues[`name-${component.id}`] || ''}
                  onChange={(e) => setInputValues(prev => ({ ...prev, [`name-${component.id}`]: e.target.value }))}
                  className="text-lg py-3 w-full"
                  style={{
                    borderRadius: quiz.theme?.borderRadius || '8px',
                    borderColor: quiz.theme?.primary || '#E5E7EB'
                  }}
                />
              )}
              
              {properties?.fields?.email && (
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={inputValues[`email-${component.id}`] || ''}
                  onChange={(e) => setInputValues(prev => ({ ...prev, [`email-${component.id}`]: e.target.value }))}
                  className="text-lg py-3 w-full"
                  style={{
                    borderRadius: quiz.theme?.borderRadius || '8px',
                    borderColor: quiz.theme?.primary || '#E5E7EB'
                  }}
                />
              )}
              
              {properties?.fields?.phone && (
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={inputValues[`phone-${component.id}`] || ''}
                  onChange={(e) => setInputValues(prev => ({ ...prev, [`phone-${component.id}`]: e.target.value }))}
                  className="text-lg py-3 w-full"
                  style={{
                    borderRadius: quiz.theme?.borderRadius || '8px',
                    borderColor: quiz.theme?.primary || '#E5E7EB'
                  }}
                />
              )}
            </div>
            
            <Button
              style={getButtonStyles('primary')}
              size="lg"
              className="w-full mt-2"
              onClick={() => {
                const leadData = {};
                if (properties?.fields?.name) {
                  Object.assign(leadData, { name: inputValues[`name-${component.id}`] || '' });
                }
                if (properties?.fields?.email) {
                  Object.assign(leadData, { email: inputValues[`email-${component.id}`] || '' });
                }
                if (properties?.fields?.phone) {
                  Object.assign(leadData, { phone: inputValues[`phone-${component.id}`] || '' });
                }
                handleAnswer(component.id, leadData);
              }}
              disabled={
                (properties?.fields?.name && !inputValues[`name-${component.id}`]) ||
                (properties?.fields?.email && !inputValues[`email-${component.id}`]) ||
                (properties?.fields?.phone && !inputValues[`phone-${component.id}`])
              }
            >
              {properties?.buttonText || 'Enviar'} <UserPlus className="w-4 h-4 ml-2" />
            </Button>
            
            {properties?.successMessage && (
              <p className="text-sm text-center text-green-600 mt-2">
                {properties.successMessage}
              </p>
            )}
          </div>
        );

      default:
        // Calculate colors with opacity
        let defaultBorderColor = '#E5E7EB';
        if (quiz.theme?.primary) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.primary, 0.25);
          if (colorWithOpacity) {
            defaultBorderColor = colorWithOpacity;
          }
        }
        
        let defaultTextColor = '#9CA3AF';
        if (quiz.theme?.text) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.text, 0.4);
          if (colorWithOpacity) {
            defaultTextColor = colorWithOpacity;
          }
        }

        return (
          <div 
            className="mb-4 p-4 border-2 border-dashed rounded-lg text-center max-w-md mx-auto"
            style={{ 
              borderColor: defaultBorderColor,
              color: defaultTextColor
            }}
          >
            <p>Componente {type} será renderizado aqui</p>
          </div>
        );
    }
  };

  const containerClass = deviceView === 'mobile' 
    ? 'max-w-sm mx-auto' 
    : 'max-w-2xl mx-auto';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Preview Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Preview do Quiz</h2>
            <p className="text-sm text-muted-foreground">{quiz.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        {/* Quiz Preview */}
        <div 
          className="p-6"
          style={getThemeStyles()}
        >
          <div className={containerClass}>
            {/* Progress Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">EQ</span>
                  </div>
                  <span className="font-semibold text-primary text-sm">Preview Mode</span>
                </div>
                <Badge variant="secondary">
                  {currentStepIndex + 1} de {totalSteps}
                </Badge>
              </div>
              {quiz.settings?.progressBar !== false && (
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{
                    backgroundColor: quiz.theme?.primary ? `${quiz.theme.primary}20` : undefined
                  }}
                />
              )}
            </div>

            {/* Question Card */}
            <Card 
              className="p-6 shadow-lg border-0"
              style={getCardStyles()}
            >
              <div className="mb-6">
                <h1 className={`text-2xl font-bold mb-4 ${deviceView === 'mobile' ? 'text-xl' : 'md:text-3xl'} text-center`}>
                  {currentStep.title}
                </h1>
                <p className="text-muted-foreground text-center text-lg">
                  {currentStep.name}
                </p>
              </div>

              {/* Render all components for this step */}
              <div className="space-y-6">
                {components.map((component) => (
                  <div key={component.id}>
                    {renderComponent(component)}
                  </div>
                ))}
                
                {components.length === 0 && (
                  <div className="text-center py-8">
                    <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Etapa vazia</h3>
                    <p className="text-muted-foreground">Adicione componentes para começar.</p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-6 pt-4 border-t flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={goBack}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                
                {!isLastStep && components.length > 0 && (
                  <Button 
                    variant="default"
                    onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                    className="flex items-center gap-2"
                    style={getButtonStyles('primary')}
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPreview;