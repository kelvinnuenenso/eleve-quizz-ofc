import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, Mail, Phone } from 'lucide-react';
import { LeadCaptureComponent as LeadCaptureComponentType } from '@/types/quiz';

interface LeadCaptureComponentProps {
  component: LeadCaptureComponentType;
  onSubmit?: (data: Record<string, string>) => void;
  theme?: any;
}

export function LeadCaptureComponent({ 
  component, 
  onSubmit,
  theme 
}: LeadCaptureComponentProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { fields, introText, successMessage, errorMessage: componentErrorMessage, buttonText } = component.properties;

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
      if (onSubmit) {
        await onSubmit(formData);
        setIsSuccess(true);
      }
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

  const getFieldIcon = (fieldName: string, fieldIcon?: string) => {
    // Use the field's specific icon if provided
    if (fieldIcon) {
      switch (fieldIcon.toLowerCase()) {
        case 'user':
          return <User className="w-5 h-5 text-blue-500" />;
        case 'mail':
        case 'email':
          return <Mail className="w-5 h-5 text-green-500" />;
        case 'phone':
        case 'whatsapp':
          return <Phone className="w-5 h-5 text-purple-500" />;
        default:
          return <User className="w-5 h-5 text-gray-500" />;
      }
    }
    
    // Fallback to field name-based icons
    switch (fieldName.toLowerCase()) {
      case 'name':
      case 'nome':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'email':
      case 'e-mail':
        return <Mail className="w-5 h-5 text-green-500" />;
      case 'phone':
      case 'telefone':
      case 'whatsapp':
        return <Phone className="w-5 h-5 text-purple-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFieldHelperText = (fieldName: string) => {
    switch (fieldName.toLowerCase()) {
      case 'name':
      case 'nome':
        return 'Digite seu nome completo';
      case 'email':
      case 'e-mail':
        return 'Digite seu e-mail principal';
      case 'phone':
      case 'telefone':
      case 'whatsapp':
        return 'Digite seu número de WhatsApp';
      default:
        return '';
    }
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
    <Card className="p-6" style={getCardStyles()}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Coleta de Lead</h2>
        <p className="text-muted-foreground">
          {introText || 'Preencha seus dados para continuar'}
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.name && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getFieldIcon('name', 'user')}
              </div>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Seu nome completo"
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">Digite seu nome completo</p>
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
        )}

        {fields.phone && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getFieldIcon('phone', 'phone')}
              </div>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">Digite seu número de WhatsApp</p>
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>
        )}

        {fields.email && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getFieldIcon('email', 'mail')}
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">Digite seu e-mail principal</p>
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isSubmitting}
          style={getButtonStyles()}
          className="w-full font-semibold py-6 text-lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Enviando...
            </>
          ) : (buttonText || 'Enviar')}
        </Button>
      </form>
    </Card>
  );
}