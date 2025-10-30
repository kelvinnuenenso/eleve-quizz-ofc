import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Quiz, QuizStep, Component, QuizTheme } from '@/types/quiz';
import { FakeProgressBar } from './FakeProgressBar';
import { LeadCaptureComponent } from './LeadCaptureComponent';
import { Star, ArrowRight, Play, PartyPopper, Move, UserPlus } from 'lucide-react';

interface RealQuizPreviewProps {
  quiz: Quiz;
  activeStepId?: string;
  className?: string;
  deviceView?: 'desktop' | 'tablet' | 'mobile';
}

export function RealQuizPreview({ quiz, activeStepId, className = '', deviceView = 'desktop' }: RealQuizPreviewProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Create a stable string representation of the quiz for comparison
  const quizString = useMemo(() => JSON.stringify({
    ...quiz,
    steps: quiz.steps?.map(step => ({
      ...step,
      components: step.components.map(comp => ({
        ...comp,
        // Only include the properties that affect rendering
        id: comp.id,
        type: comp.type,
        content: comp.content,
        style: comp.style
      }))
    })) || []
  }), [quiz]);

  // Create a stable string representation of the current step for comparison
  const currentStepString = useMemo(() => {
    if (!activeStepId || !quiz.steps) return '';
    const step = quiz.steps.find(s => s.id === activeStepId);
    return step ? JSON.stringify({
      ...step,
      components: step.components.map(comp => ({
        ...comp,
        // Only include the properties that affect rendering
        id: comp.id,
        type: comp.type,
        content: comp.content,
        style: comp.style
      }))
    }) : '';
  }, [quiz.steps, activeStepId]);

  // Force re-render when quiz or current step changes
  const [quizVersion, setQuizVersion] = useState(0);
  
  useEffect(() => {
    setQuizVersion(prev => prev + 1);
  }, [quizString, currentStepString]); // Depend on both quiz and current step strings

  const currentStep = quiz.steps?.find(step => step.id === activeStepId) || quiz.steps?.[0];
  const stepIndex = quiz.steps?.findIndex(step => step.id === activeStepId) ?? 0;
  const progress = quiz.steps?.length ? ((stepIndex + 1) / quiz.steps.length) * 100 : 0;

  if (!currentStep) {
    return (
      <div className={`min-h-[600px] flex items-center justify-center ${className}`}>
        <Card className="p-8 text-center">
          <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma etapa selecionada</h3>
          <p className="text-muted-foreground">Selecione uma etapa na barra lateral para ver o preview.</p>
        </Card>
      </div>
    );
  }

  // Aplicar tema exatamente como no QuizRunner
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

  const getMaxWidth = () => {
    // Handle device-specific widths
    if (deviceView === 'mobile') {
      return 'max-w-sm';
    } else if (deviceView === 'tablet') {
      return 'max-w-2xl';
    }
    
    // Handle theme-specific widths
    switch (quiz.theme?.maxWidth) {
      case 'small': return 'max-w-xl';
      case 'medium': return 'max-w-2xl';
      case 'large': return 'max-w-4xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-full'; // Changed from max-w-2xl to max-w-full for better utilization
    }
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

  const renderComponent = (component: Component, index: number) => {
    const { type, content } = component;

    // Wrap each component with draggable wrapper
    const wrappedComponent = (element: React.ReactNode) => (
      <DraggableComponentWrapper 
        id={component.id}
        isDraggingEnabled={true}
      >
        {element}
      </DraggableComponentWrapper>
    );

    switch (type) {
      case 'title':
        const level = content?.level || 'h1';
        const TitleTag = level as keyof JSX.IntrinsicElements;
        const titleStyles = {
          color: quiz.theme?.text || '#1F2937',
          fontFamily: quiz.theme?.fontFamily || 'Inter, sans-serif',
          textAlign: quiz.theme?.centerAlign ? 'center' as const : 'left' as const
        };

        return wrappedComponent(
          <TitleTag 
            key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`}
            style={titleStyles}
            className={`font-bold mb-4 ${
              level === 'h1' ? 'text-3xl md:text-4xl' :
              level === 'h2' ? 'text-2xl md:text-3xl' :
              level === 'h3' ? 'text-xl md:text-2xl' : 'text-lg'
            } text-center`}
          >
            {content?.text || 'Título'}
          </TitleTag>
        );

      case 'text':
        return wrappedComponent(
          <p 
            key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`}
            style={{
              color: quiz.theme?.text || '#1F2937',
              fontFamily: quiz.theme?.fontFamily || 'Inter, sans-serif',
              textAlign: quiz.theme?.centerAlign ? 'center' : 'left'
            }}
            className={`mb-6 ${
              content?.style === 'subtitle' ? 'text-lg text-muted-foreground' :
              content?.style === 'small' ? 'text-sm' : 'text-base'
            } text-center`}
          >
            {content?.text || 'Texto do parágrafo...'}
          </p>
        );

      case 'button':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 flex justify-center">
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
        
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 space-y-3 max-w-md mx-auto">
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
        
        let badgeBgColor = '#F3F4F6';
        if (quiz.theme?.accent) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.accent, 0.1);
          if (colorWithOpacity) {
            badgeBgColor = colorWithOpacity;
          }
        }

        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-8 space-y-4 max-w-2xl mx-auto">
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
                    key={`${option.id || optIndex}-${quizVersion}`}
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
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-medium">{option.label}</span>
                      {option.score && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 text-xs"
                          style={{ 
                            backgroundColor: badgeBgColor,
                            color: quiz.theme?.text || '#1F2937'
                          }}
                        >
                          {option.score} pts
                        </Badge>
                      )}
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
        
        let sliderValueColor = '#6B7280';
        if (quiz.theme?.text) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.text, 0.5);
          if (colorWithOpacity) {
            sliderValueColor = colorWithOpacity;
          }
        }

        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-8 space-y-4 max-w-2xl mx-auto">
            {(content?.question || content?.label) && (
              <h3 
                style={{ color: quiz.theme?.text || '#1F2937' }}
                className="text-xl font-semibold mb-4 text-center"
              >
                {content.question || content.label}
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
                <span style={{ color: sliderValueColor }}>{min}</span>
                <div 
                  className="px-4 py-2 rounded-full font-semibold text-lg"
                  style={{
                    backgroundColor: quiz.theme?.primary || '#2563EB',
                    color: quiz.theme?.cardBackground || '#FFFFFF'
                  }}
                >
                  {currentValue}
                </div>
                <span style={{ color: sliderValueColor }}>{max}</span>
              </div>
            </div>
          </div>
        );

      case 'confetti':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 text-center max-w-md mx-auto">
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

      case 'rating':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-8 space-y-4 max-w-md mx-auto">
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
                  key={`${rating}-${quizVersion}`}
                  variant="outline"
                  size="lg"
                  className="w-12 h-12 hover:bg-yellow-100 hover:border-yellow-400"
                  onClick={() => {
                    // Handle rating selection if needed
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

      case 'image':
        // Calculate colors with opacity
        let imageBorderColor = '#E5E7EB';
        if (quiz.theme?.primary) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.primary, 0.25);
          if (colorWithOpacity) {
            imageBorderColor = colorWithOpacity;
          }
        }
        
        let imageTextColor = '#9CA3AF';
        if (quiz.theme?.text) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.text, 0.4);
          if (colorWithOpacity) {
            imageTextColor = colorWithOpacity;
          }
        }

        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            {content?.src ? (
              <img
                src={content.src}
                alt={content.alt || 'Imagem'}
                className="w-full h-auto rounded-lg shadow-md"
                style={{ borderRadius: quiz.theme?.borderRadius || '8px' }}
              />
            ) : (
              <div 
                className="w-full h-48 flex items-center justify-center border-2 border-dashed rounded-lg"
                style={{ 
                  borderColor: imageBorderColor,
                  borderRadius: quiz.theme?.borderRadius || '8px'
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p style={{ color: imageTextColor }}>
                    Imagem será exibida aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'lead_capture':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-md mx-auto">
            <LeadCaptureComponent 
              component={component as any}
              theme={quiz.theme}
              onSubmit={async (data) => {
                // This would be handled by the quiz runner in the actual implementation
                console.log('Lead capture submitted:', data);
              }}
            />
          </div>
        );

      case 'video':
        // Calculate colors with opacity
        let videoBorderColor = '#E5E7EB';
        if (quiz.theme?.primary) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.primary, 0.25);
          if (colorWithOpacity) {
            videoBorderColor = colorWithOpacity;
          }
        }
        
        let videoTextColor = '#9CA3AF';
        if (quiz.theme?.text) {
          const colorWithOpacity = addOpacityToHex(quiz.theme.text, 0.4);
          if (colorWithOpacity) {
            videoTextColor = colorWithOpacity;
          }
        }

        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            {content?.src ? (
              <div className="relative pt-[56.25%] rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <p style={{ color: videoTextColor }}>
                      Vídeo: {content.title || 'Reproduzir'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-48 flex items-center justify-center border-2 border-dashed rounded-lg"
                style={{ 
                  borderColor: videoBorderColor,
                  borderRadius: quiz.theme?.borderRadius || '8px'
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <p style={{ color: videoTextColor }}>
                    Vídeo será exibido aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'faq':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <h3 
              style={{ color: quiz.theme?.text || '#1F2937' }}
              className="text-xl font-semibold mb-4 text-center"
            >
              {content?.title || 'Perguntas Frequentes'}
            </h3>
            <div className="space-y-4">
              {(content?.items || []).map((item: any, index: number) => (
                <div key={`faq-${index}-${quizVersion}`} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{item.question}</h4>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonial':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <div className="border rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">"</div>
              <p className="mb-4">{content?.text || 'Depoimento do cliente'}</p>
              <div className="flex items-center justify-center gap-3">
                {content?.avatar && (
                  <img 
                    src={content.avatar} 
                    alt={content?.author || 'Autor'} 
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium">{content?.author || 'Nome do Cliente'}</div>
                  <div className="text-sm text-muted-foreground">{content?.role || 'Cargo'}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'carousel':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <div className="border rounded-lg p-4 text-center">
              <div className="h-48 flex items-center justify-center bg-muted/20 rounded mb-4">
                <div>🎠 Carousel Item</div>
              </div>
              <div className="flex justify-center gap-2">
                {(content?.items || []).map((_: any, index: number) => (
                  <div 
                    key={`dot-${index}-${quizVersion}`}
                    className="w-3 h-3 rounded-full bg-muted-foreground/30"
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'comparison':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <h3 
              style={{ color: quiz.theme?.text || '#1F2937' }}
              className="text-xl font-semibold mb-4 text-center"
            >
              {content?.title || 'Comparação'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <h4 className="font-medium mb-2">{content?.left?.title || 'Opção A'}</h4>
                <p className="text-sm">{content?.left?.description || 'Descrição A'}</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <h4 className="font-medium mb-2">{content?.right?.title || 'Opção B'}</h4>
                <p className="text-sm">{content?.right?.description || 'Descrição B'}</p>
              </div>
            </div>
          </div>
        );

      case 'chart':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <h3 
              style={{ color: quiz.theme?.text || '#1F2937' }}
              className="text-xl font-semibold mb-4 text-center"
            >
              {content?.title || 'Gráfico'}
            </h3>
            <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/10">
              <div>📊 Gráfico será exibido aqui</div>
            </div>
          </div>
        );

      case 'pricing':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <h3 
              style={{ color: quiz.theme?.text || '#1F2937' }}
              className="text-xl font-semibold mb-4 text-center"
            >
              {content?.title || 'Planos de Preços'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(content?.plans || []).map((plan: any, index: number) => (
                <div key={`plan-${index}-${quizVersion}`} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{plan.name || `Plano ${index + 1}`}</h4>
                  <div className="text-2xl font-bold mb-2">{plan.price || 'R$0'}</div>
                  <ul className="space-y-2 mb-4">
                    {(plan.features || []).map((feature: string, featIndex: number) => (
                      <li key={`feat-${featIndex}-${quizVersion}`} className="text-sm">✓ {feature}</li>
                    ))}
                  </ul>
                  <Button className="w-full" style={getButtonStyles('primary')}>
                    {plan.cta || 'Escolher'}</Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'marquee':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto overflow-hidden">
            <div className="bg-muted/20 py-3 rounded-lg">
              <div className="flex animate-marquee whitespace-nowrap">
                <span className="mx-4">{content?.text || 'Texto em movimento'}</span>
              </div>
            </div>
          </div>
        );

      case 'spacer':
        return wrappedComponent(
          <div 
            key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} 
            className="mb-6"
            style={{ height: content?.height || '2rem' }}
          />
        );

      case 'terms':
        return wrappedComponent(
          <div key={`${component.id}-${quizVersion}-${JSON.stringify(content)}`} className="mb-6 max-w-2xl mx-auto">
            <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
              <h3 
                style={{ color: quiz.theme?.text || '#1F2937' }}
                className="text-lg font-semibold mb-2"
              >
                {content?.title || 'Termos e Condições'}
              </h3>
              <p className="text-sm">{content?.text || 'Texto dos termos e condições...'}</p>
            </div>
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

        return wrappedComponent(
          <div 
            key={`${component.id}-${quizVersion}-${type}`} 
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

  return (
    <div 
      className={`min-h-[600px] flex items-center justify-center w-full ${className}`}
      style={getThemeStyles()}
    >
      {/* Barra de Progresso */}
      {quiz.theme?.showProgress && quiz.steps && quiz.steps.length > 1 && (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b p-4 w-full">
          <div className={`mx-auto ${getMaxWidth()}`}>
            {quiz.theme?.fakeProgress ? (
              <FakeProgressBar 
                theme={quiz.theme}
                currentStep={stepIndex}
                totalSteps={quiz.steps.length}
                isActive={true}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: quiz.theme?.text || '#1F2937' }}>
                    Etapa {stepIndex + 1} de {quiz.steps.length}
                  </span>
                  <span style={{ color: quiz.theme?.text || '#1F2937' }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{ 
                    backgroundColor: quiz.theme?.accent ? addOpacityToHex(quiz.theme.accent, 0.1) : '#E5E7EB'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 p-6 w-full flex items-center justify-center">
        <div className={`mx-auto w-full ${getMaxWidth()}`}>
          <Card 
            className={`p-8 md:p-12 shadow-xl border-0 w-full ${deviceView === 'mobile' ? 'p-4' : ''}`}
            style={getCardStyles()}
          >
            {/* Título da Etapa */}
            {currentStep.title && (
              <div className="mb-8 text-center">
                <h2 
                  style={{ 
                    color: quiz.theme?.text || '#1F2937',
                    fontFamily: quiz.theme?.fontFamily || 'Inter, sans-serif'
                  }}
                  className="text-2xl md:text-3xl font-bold"
                >
                  {currentStep.title}
                </h2>
                {quiz.steps && quiz.steps.length > 1 && (
                  <p 
                    style={{ color: quiz.theme?.text ? addOpacityToHex(quiz.theme.text, 0.4) || '#9CA3AF' : '#9CA3AF' }}
                    className="text-sm mt-2"
                  >
                    {stepIndex + 1} de {quiz.steps.length}
                  </p>
                )}
              </div>
            )}

            {/* Componentes da Etapa */}
            <div className="space-y-6">
              {/* Handle Lead Registration steps specifically */}
              {(currentStep.type === 'custom_lead' || currentStep.type === 'lead_registration') && currentStep.data ? (
                <div className="mb-6">
                  <LeadCaptureComponent 
                    component={{
                      id: `comp-${currentStep.id}`,
                      type: 'lead_capture',
                      properties: {
                        fields: currentStep.data.fields.reduce((acc: Record<string, boolean>, field: any) => {
                          const fieldName = typeof field === 'string' ? field : field.label.toLowerCase();
                          // Map field names to the expected format
                          let normalizedFieldName = fieldName;
                          if (fieldName.includes('nome')) normalizedFieldName = 'name';
                          if (fieldName.includes('email') || fieldName.includes('e-mail')) normalizedFieldName = 'email';
                          if (fieldName.includes('whatsapp') || fieldName.includes('phone') || fieldName.includes('telefone')) normalizedFieldName = 'phone';
                          acc[normalizedFieldName] = true;
                          return acc;
                        }, {}),
                        introText: currentStep.data.title,
                        successMessage: currentStep.data.successMessage,
                        errorMessage: currentStep.data.errorMessage,
                        buttonText: currentStep.data.buttonText
                      }
                    } as any}
                    theme={quiz.theme}
                    onSubmit={async (data) => {
                      // This would be handled by the quiz runner in the actual implementation
                      console.log('Lead capture submitted:', data);
                    }}
                  />
                </div>
              ) : currentStep.components.length === 0 ? (
                // Empty state with drop zone
                <div className="text-center py-8">
                  <DropZone id="empty-drop-zone" />
                  <p className="text-muted-foreground mt-2">Arraste componentes aqui para começar</p>
                </div>
              ) : (
                <>
                  {/* Drop zone at the top */}
                  <DropZone id="top-drop-zone" />
                  
                  {/* Render components with drop zones between them */}
                  {currentStep.components.map((component, index) => (
                    <Fragment key={component.id}>
                      {renderComponent(component, index)}
                      <DropZone id={`drop-zone-${component.id}`} />
                    </Fragment>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Draggable wrapper for components in the preview
const DraggableComponentWrapper = ({ 
  children, 
  id,
  isDraggingEnabled = true
}: { 
  children: React.ReactNode; 
  id: string;
  isDraggingEnabled?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggingEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className="relative group"
    >
      {isDraggingEnabled && (
        <div 
          {...listeners} 
          className="absolute top-2 right-2 p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          <Move className="w-4 h-4" />
        </div>
      )}
      {/* Selection indicator */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary rounded-lg pointer-events-none transition-colors"></div>
      {children}
    </div>
  );
};

// Drop zone for inserting between components
const DropZone = ({ id }: { id: string }) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
  });

  const style = {
    height: isOver && active ? '8px' : '2px',
    backgroundColor: isOver && active ? '#3b82f6' : 'transparent',
    transition: 'all 0.2s ease',
    margin: '4px 0',
    borderRadius: '2px',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="w-full"
    />
  );
};