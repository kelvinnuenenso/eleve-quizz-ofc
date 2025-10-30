import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, Mail, Phone } from 'lucide-react';
import { LeadCaptureQuestion } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';
import { realAnalytics } from '@/lib/analytics';
import { realPixelSystem } from '@/lib/pixelSystem';

interface LeadCaptureFormProps {
  question: LeadCaptureQuestion;
  sessionId: string;
  quizId: string;
  onCapture: (leadId: string) => void;
  theme?: any;
}

export function LeadCaptureForm({ 
  question, 
  sessionId, 
  quizId,
  onCapture,
  theme 
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { fields, introText, successMessage, errorMessage: componentErrorMessage, buttonText } = question.settings;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (fields.name && !formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (fields.email) {
      if (!formData.email?.trim()) {
        newErrors.email = 'E-mail é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'E-mail inválido';
      }
    }
    
    if (fields.phone && formData.phone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6 + (digits.length > 10 ? 1 : 0))}-${digits.slice(6 + (digits.length > 10 ? 1 : 0))}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleChange('phone', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Save lead to Supabase
      const leadData = {
        session_id: sessionId,
        quiz_id: quizId,
        name: fields.name ? formData.name : undefined,
        email: fields.email ? formData.email : undefined,
        phone: fields.phone ? formData.phone : undefined,
        utm_source: realPixelSystem.getPersistedUTMParameters().utm_source || '',
        utm_medium: realPixelSystem.getPersistedUTMParameters().utm_medium || '',
        utm_campaign: realPixelSystem.getPersistedUTMParameters().utm_campaign || '',
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      };

      const { data: lead, error } = await supabase
        .from('quiz_leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;

      // Track lead capture in analytics
      await realAnalytics.trackLeadCapture({
        id: lead.id,
        quizId: quizId,
        resultId: sessionId, // Using session ID as result ID for now
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        createdAt: new Date().toISOString()
      });

      // Track lead capture in pixels
      realPixelSystem.trackLeadCapture(
        { id: quizId, name: 'Quiz' } as any, 
        { 
          email: leadData.email,
          name: leadData.name
        }
      );

      // Update session with lead_captured = true
      const { error: sessionError } = await supabase
        .from('analytics_sessions')
        .update({ lead_captured: true })
        .eq('session_id', sessionId);

      if (sessionError) {
        console.error('Error updating session:', sessionError);
      }

      setIsSuccess(true);
      onCapture(lead.id);
    } catch (error) {
      setErrorMessage(componentErrorMessage || 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.');
      console.error('Error submitting lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCardStyles = () => ({
    backgroundColor: theme?.cardBackground || '#FFFFFF',
    borderRadius: theme?.borderRadius || '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  });

  const getButtonStyles = () => ({
    background: theme?.gradient 
      ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
      : theme?.primary || '#2563EB',
    color: theme?.cardBackground || '#FFFFFF',
    borderRadius: theme?.buttonStyle === 'pill' ? '999px' : theme?.borderRadius || '12px'
  });

  if (isSuccess) {
    return (
      <Card className="p-6 text-center" style={getCardStyles()}>
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold mb-2">Sucesso!</h3>
        <p className="text-muted-foreground">
          {successMessage || 'Seus dados foram salvos com sucesso!'}
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {question.title || 'Coleta de Lead'}
        </h2>
        <p className="text-muted-foreground">
          {introText || 'Preencha seus dados para continuar'}
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {fields.name && (
        <div>
          <label htmlFor="name" className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" />
            Nome
          </label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Seu nome completo"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
      )}

      {fields.email && (
        <div>
          <label htmlFor="email" className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4" />
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="seu@email.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      )}

      {fields.phone && (
        <div>
          <label htmlFor="phone" className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            Telefone
          </label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isSubmitting}
        style={getButtonStyles()}
        className="w-full font-semibold"
      >
        {isSubmitting ? 'Enviando...' : (buttonText || 'Enviar')}
      </Button>
    </form>
  );
}