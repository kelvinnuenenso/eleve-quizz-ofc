import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { realAnalytics } from '@/lib/analytics';
import { realPixelSystem } from '@/lib/pixelSystem';

interface CustomLeadFormProps {
  stepData: any;
  sessionId: string;
  quizId: string;
  onSubmit: (leadData: Record<string, string>) => void;
  theme?: any;
}

export function CustomLeadForm({ stepData, sessionId, quizId, onSubmit, theme }: CustomLeadFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { title, fields, buttonText, successMessage, errorMessage: formErrorMessage, required } = stepData;

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
    
    fields.forEach((field: string) => {
      if (required && !formData[field]?.trim()) {
        newErrors[field] = `${getFieldLabel(field)} é obrigatório`;
      }
      
      // Specific validation for email
      if (field === 'email' && formData[field]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field])) {
          newErrors[field] = 'E-mail inválido';
        }
      }
      
      // Specific validation for phone/whatsapp
      if ((field === 'phone' || field === 'whatsapp') && formData[field]) {
        // Basic phone validation (you might want to adjust this)
        if (!/^\(\d{2}\) \d{4,5}-\d{4}$/.test(formData[field])) {
          newErrors[field] = 'Telefone inválido';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6 + (digits.length > 10 ? 1 : 0))}-${digits.slice(6 + (digits.length > 10 ? 1 : 0))}`;
  };

  const handlePhoneChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleChange(field, formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Save lead to Supabase
      const leadData: any = {
        quiz_id: quizId,
        result_id: sessionId, // Using session ID as result ID for now
        created_at: new Date().toISOString()
      };
      
      // Add fields to lead data
      fields.forEach((field: string) => {
        if (formData[field]) {
          leadData[field] = formData[field];
        }
      });
      
      // Add UTM parameters if available
      const utmParams = realPixelSystem.getPersistedUTMParameters();
      if (utmParams.utm_source) leadData.utm_source = utmParams.utm_source;
      if (utmParams.utm_medium) leadData.utm_medium = utmParams.utm_medium;
      if (utmParams.utm_campaign) leadData.utm_campaign = utmParams.utm_campaign;
      
      const { data: lead, error } = await supabase
        .from('quiz_leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;

      // Track lead capture in analytics
      await realAnalytics.trackEvent('Lead', {
        quiz_id: quizId,
        session_id: sessionId,
        lead_email: formData.email || '',
        source: utmParams.utm_source || '',
        timestamp: new Date().toISOString()
      });

      // Track lead capture in pixels
      realPixelSystem.trackLeadCapture(
        { id: quizId, name: 'Quiz' } as any, 
        { 
          email: formData.email || '',
          name: formData.name || ''
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
      onSubmit(formData);
    } catch (error) {
      setErrorMessage(formErrorMessage || 'Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.');
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
        return field.charAt(0).toUpperCase() + field.slice(1);
    }
  };

  const renderField = (field: string) => {
    if (field === 'email') {
      return (
        <div key={field}>
          <Label htmlFor={field} className="flex items-center gap-2">
            {getFieldIcon(field)}
            {getFieldLabel(field)}
          </Label>
          <Input
            id={field}
            type="email"
            value={formData[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder="seu@email.com"
            className={errors[field] ? 'border-red-500' : ''}
          />
          {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
        </div>
      );
    }
    
    if (field === 'phone' || field === 'whatsapp') {
      return (
        <div key={field}>
          <Label htmlFor={field} className="flex items-center gap-2">
            {getFieldIcon(field)}
            {getFieldLabel(field)}
          </Label>
          <Input
            id={field}
            value={formData[field] || ''}
            onChange={(e) => handlePhoneChange(field, e)}
            placeholder="(00) 00000-0000"
            className={errors[field] ? 'border-red-500' : ''}
          />
          {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
        </div>
      );
    }
    
    return (
      <div key={field}>
        <Label htmlFor={field} className="flex items-center gap-2">
          {getFieldIcon(field)}
          {getFieldLabel(field)}
        </Label>
        <Input
          id={field}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={getFieldLabel(field)}
          className={errors[field] ? 'border-red-500' : ''}
        />
        {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
      </div>
    );
  };

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
          {title || 'Coleta de Informações'}
        </h2>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {fields.map((field: string) => renderField(field))}
      </div>

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