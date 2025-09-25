import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Send, 
  Phone,
  Users,
  Target,
  Clock,
  BarChart3,
  Settings,
  Eye,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Save,
  Download,
  Upload,
  Smartphone,
  Globe,
  Zap,
  Filter,
  Calendar,
  TrendingUp
} from 'lucide-react';
import type { Quiz, QuizOutcome } from '@/types/quiz';

interface WhatsAppRedirectManagerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface WhatsAppRedirectRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RedirectCondition[];
  action: RedirectAction;
  schedule?: RedirectSchedule;
  analytics: RedirectAnalytics;
}

interface RedirectCondition {
  id: string;
  type: 'score' | 'outcome' | 'profile' | 'time' | 'device' | 'location' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains' | 'in_list';
  value: string | number | string[];
  weight?: number;
}

interface RedirectAction {
  type: 'whatsapp_direct' | 'whatsapp_group' | 'whatsapp_business' | 'custom_url';
  phoneNumber?: string;
  groupInviteCode?: string;
  businessId?: string;
  customUrl?: string;
  message: string;
  delay?: number;
  showConfirmation: boolean;
  trackingParams?: Record<string, string>;
}

interface RedirectSchedule {
  enabled: boolean;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  fallbackAction?: RedirectAction;
}

interface RedirectAnalytics {
  totalTriggers: number;
  successfulRedirects: number;
  failedRedirects: number;
  conversionRate: number;
  lastTriggered?: Date;
  averageResponseTime: number;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
}

interface RedirectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'support' | 'marketing' | 'lead_qualification';
  conditions: RedirectCondition[];
  action: RedirectAction;
  tags: string[];
}

export function WhatsAppRedirectManager({ quiz, onQuizUpdate }: WhatsAppRedirectManagerProps) {
  const [redirectRules, setRedirectRules] = useState<WhatsAppRedirectRule[]>([]);
  const [templates, setTemplates] = useState<RedirectTemplate[]>([]);
  const [isTestingRedirect, setIsTestingRedirect] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedRule, setSelectedRule] = useState<string>('');

  useEffect(() => {
    initializeTemplates();
    loadExistingRules();
  }, [quiz]);

  const initializeTemplates = () => {
    const defaultTemplates: RedirectTemplate[] = [
      {
        id: 'high_score_sales',
        name: 'Vendas - Alta Pontuação',
        description: 'Redireciona usuários com alta pontuação para vendas',
        category: 'sales',
        conditions: [
          {
            id: 'score_high',
            type: 'score',
            field: 'total_score',
            operator: 'greater_than',
            value: 80,
            weight: 1
          }
        ],
        action: {
          type: 'whatsapp_business',
          businessId: 'your_business_id',
          message: 'Olá! Vi que você teve um excelente resultado no nosso quiz. Gostaria de conversar sobre como podemos ajudar você ainda mais?',
          showConfirmation: true,
          delay: 2000,
          trackingParams: {
            source: 'quiz_high_score',
            campaign: 'sales_qualified'
          }
        },
        tags: ['sales', 'high-intent', 'qualified']
      },
      {
        id: 'support_needed',
        name: 'Suporte - Ajuda Necessária',
        description: 'Redireciona usuários que precisam de suporte',
        category: 'support',
        conditions: [
          {
            id: 'outcome_help',
            type: 'outcome',
            field: 'result_type',
            operator: 'equals',
            value: 'needs_help',
            weight: 1
          }
        ],
        action: {
          type: 'whatsapp_direct',
          phoneNumber: '+5511999999999',
          message: 'Olá! Notei que você pode precisar de ajuda. Estou aqui para esclarecer suas dúvidas. Como posso ajudar?',
          showConfirmation: true,
          delay: 1000,
          trackingParams: {
            source: 'quiz_support',
            type: 'help_needed'
          }
        },
        tags: ['support', 'help', 'assistance']
      },
      {
        id: 'lead_qualification',
        name: 'Qualificação de Lead',
        description: 'Qualifica leads baseado no perfil',
        category: 'lead_qualification',
        conditions: [
          {
            id: 'profile_match',
            type: 'profile',
            field: 'target_audience',
            operator: 'equals',
            value: 'decision_maker',
            weight: 0.8
          },
          {
            id: 'company_size',
            type: 'custom',
            field: 'company_size',
            operator: 'in_list',
            value: ['medium', 'large', 'enterprise'],
            weight: 0.6
          }
        ],
        action: {
          type: 'whatsapp_group',
          groupInviteCode: 'your_group_code',
          message: 'Parabéns! Você se qualificou para nosso grupo exclusivo de líderes. Vamos conversar sobre estratégias?',
          showConfirmation: true,
          delay: 3000,
          trackingParams: {
            source: 'quiz_qualified',
            segment: 'decision_makers'
          }
        },
        tags: ['qualification', 'decision-maker', 'exclusive']
      },
      {
        id: 'marketing_nurture',
        name: 'Nutrição de Marketing',
        description: 'Nutre leads com potencial médio',
        category: 'marketing',
        conditions: [
          {
            id: 'score_medium',
            type: 'score',
            field: 'total_score',
            operator: 'between',
            value: [40, 79],
            weight: 1
          }
        ],
        action: {
          type: 'whatsapp_direct',
          phoneNumber: '+5511888888888',
          message: 'Oi! Obrigado por participar do nosso quiz. Que tal receber dicas personalizadas baseadas no seu resultado?',
          showConfirmation: true,
          delay: 5000,
          trackingParams: {
            source: 'quiz_nurture',
            score_range: 'medium'
          }
        },
        tags: ['nurturing', 'medium-intent', 'education']
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadExistingRules = () => {
    // Carregar regras existentes do localStorage ou API
    const savedRules = localStorage.getItem(`whatsapp_rules_${quiz.id}`);
    if (savedRules) {
      try {
        const rules = JSON.parse(savedRules);
        setRedirectRules(rules);
      } catch (error) {
        console.error('Erro ao carregar regras:', error);
      }
    }
  };

  const createNewRule = () => {
    const newRule: WhatsAppRedirectRule = {
      id: `rule_${Date.now()}`,
      name: 'Nova Regra',
      description: '',
      enabled: true,
      priority: redirectRules.length + 1,
      conditions: [{
        id: `condition_${Date.now()}`,
        type: 'score',
        field: 'total_score',
        operator: 'greater_than',
        value: 50,
        weight: 1
      }],
      action: {
        type: 'whatsapp_direct',
        phoneNumber: '',
        message: 'Olá! Obrigado por participar do nosso quiz.',
        showConfirmation: true,
        delay: 2000,
        trackingParams: {}
      },
      analytics: {
        totalTriggers: 0,
        successfulRedirects: 0,
        failedRedirects: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        deviceBreakdown: {},
        locationBreakdown: {}
      }
    };

    setRedirectRules([...redirectRules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<WhatsAppRedirectRule>) => {
    setRedirectRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    setRedirectRules(rules => rules.filter(rule => rule.id !== ruleId));
  };

  const addConditionToRule = (ruleId: string) => {
    const newCondition: RedirectCondition = {
      id: `condition_${Date.now()}`,
      type: 'score',
      field: 'total_score',
      operator: 'greater_than',
      value: 0,
      weight: 1
    };

    const rule = redirectRules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, {
        conditions: [...rule.conditions, newCondition]
      });
    }
  };

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<RedirectCondition>) => {
    const rule = redirectRules.find(r => r.id === ruleId);
    if (rule) {
      const updatedConditions = rule.conditions.map(condition =>
        condition.id === conditionId ? { ...condition, ...updates } : condition
      );
      updateRule(ruleId, { conditions: updatedConditions });
    }
  };

  const removeCondition = (ruleId: string, conditionId: string) => {
    const rule = redirectRules.find(r => r.id === ruleId);
    if (rule) {
      const updatedConditions = rule.conditions.filter(c => c.id !== conditionId);
      updateRule(ruleId, { conditions: updatedConditions });
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newRule: WhatsAppRedirectRule = {
      id: `rule_${Date.now()}`,
      name: template.name,
      description: template.description,
      enabled: true,
      priority: redirectRules.length + 1,
      conditions: template.conditions.map(condition => ({
        ...condition,
        id: `condition_${Date.now()}_${condition.id}`
      })),
      action: { ...template.action },
      analytics: {
        totalTriggers: 0,
        successfulRedirects: 0,
        failedRedirects: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        deviceBreakdown: {},
        locationBreakdown: {}
      }
    };

    setRedirectRules([...redirectRules, newRule]);
  };

  const testRedirect = async (ruleId: string) => {
    setIsTestingRedirect(true);
    
    const rule = redirectRules.find(r => r.id === ruleId);
    if (!rule) return;

    // Simular diferentes cenários de teste
    const testScenarios = [
      {
        name: 'Usuário com alta pontuação',
        data: { total_score: 95, result_type: 'expert', device: 'mobile' },
        shouldTrigger: rule.conditions.some(c => c.type === 'score' && c.operator === 'greater_than' && 95 > Number(c.value))
      },
      {
        name: 'Usuário com baixa pontuação',
        data: { total_score: 25, result_type: 'beginner', device: 'desktop' },
        shouldTrigger: rule.conditions.some(c => c.type === 'score' && c.operator === 'less_than' && 25 < Number(c.value))
      },
      {
        name: 'Usuário com resultado específico',
        data: { total_score: 60, result_type: 'needs_help', device: 'mobile' },
        shouldTrigger: rule.conditions.some(c => c.type === 'outcome' && c.value === 'needs_help')
      }
    ];

    const results = testScenarios.map(scenario => {
      const triggered = evaluateConditions(rule.conditions, scenario.data);
      return {
        ...scenario,
        triggered,
        passed: triggered === scenario.shouldTrigger,
        whatsappUrl: triggered ? generateWhatsAppUrl(rule.action, scenario.data) : null
      };
    });

    setTestResults(results);
    setTimeout(() => setIsTestingRedirect(false), 2000);
  };

  const evaluateConditions = (conditions: RedirectCondition[], data: Record<string, any>): boolean => {
    return conditions.every(condition => {
      const fieldValue = data[condition.field];
      const conditionValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          return fieldValue === conditionValue;
        case 'not_equals':
          return fieldValue !== conditionValue;
        case 'greater_than':
          return Number(fieldValue) > Number(conditionValue);
        case 'less_than':
          return Number(fieldValue) < Number(conditionValue);
        case 'between':
          const [min, max] = Array.isArray(conditionValue) ? conditionValue : [0, 100];
          return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
        case 'contains':
          return String(fieldValue).includes(String(conditionValue));
        case 'in_list':
          return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
        default:
          return false;
      }
    });
  };

  const generateWhatsAppUrl = (action: RedirectAction, userData: Record<string, any>): string => {
    let baseUrl = '';
    let message = action.message;

    // Personalizar mensagem com dados do usuário
    Object.entries(userData).forEach(([key, value]) => {
      message = message.replace(`{{${key}}}`, String(value));
    });

    const encodedMessage = encodeURIComponent(message);

    switch (action.type) {
      case 'whatsapp_direct':
        baseUrl = `https://wa.me/${action.phoneNumber?.replace(/\D/g, '')}?text=${encodedMessage}`;
        break;
      case 'whatsapp_business':
        baseUrl = `https://wa.me/${action.businessId}?text=${encodedMessage}`;
        break;
      case 'whatsapp_group':
        baseUrl = `https://chat.whatsapp.com/${action.groupInviteCode}`;
        break;
      case 'custom_url':
        baseUrl = action.customUrl || '';
        break;
    }

    // Adicionar parâmetros de tracking
    if (action.trackingParams && Object.keys(action.trackingParams).length > 0) {
      const params = new URLSearchParams(action.trackingParams);
      baseUrl += baseUrl.includes('?') ? '&' : '?';
      baseUrl += params.toString();
    }

    return baseUrl;
  };

  const saveRules = () => {
    localStorage.setItem(`whatsapp_rules_${quiz.id}`, JSON.stringify(redirectRules));
    
    // Atualizar quiz com configurações de redirecionamento
    const updatedQuiz = {
      ...quiz,
      settings: {
        ...quiz.settings,
        whatsappRedirect: {
          enabled: redirectRules.some(r => r.enabled),
          rules: redirectRules
        }
      }
    };

    onQuizUpdate(updatedQuiz);
  };

  const exportRules = () => {
    const config = {
      rules: redirectRules,
      templates: templates.filter(t => !['high_score_sales', 'support_needed', 'lead_qualification', 'marketing_nurture'].includes(t.id)),
      quiz_id: quiz.id,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-redirect-${quiz.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.rules) {
          setRedirectRules(config.rules);
        }
        if (config.templates) {
          setTemplates(prev => [...prev, ...config.templates]);
        }
      } catch (error) {
        console.error('Erro ao importar configurações:', error);
      }
    };
    reader.readAsText(file);
  };

  const getOutcomeOptions = () => {
    if (!quiz.outcomes) return [];
    return Object.entries(quiz.outcomes).map(([key, outcome]) => ({
      value: key,
      label: outcome.title
    }));
  };

  const getAnalyticsSummary = () => {
    const totalTriggers = redirectRules.reduce((sum, rule) => sum + rule.analytics.totalTriggers, 0);
    const totalSuccessful = redirectRules.reduce((sum, rule) => sum + rule.analytics.successfulRedirects, 0);
    const averageConversion = totalTriggers > 0 ? (totalSuccessful / totalTriggers) * 100 : 0;

    return {
      totalTriggers,
      totalSuccessful,
      averageConversion: Math.round(averageConversion * 100) / 100,
      activeRules: redirectRules.filter(r => r.enabled).length
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            WhatsApp Redirect
          </h3>
          <p className="text-muted-foreground">
            Configure redirecionamentos automáticos baseados em pontuação e perfil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importRules}
            className="hidden"
            id="import-rules"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-rules')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportRules}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={saveRules}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const summary = getAnalyticsSummary();
          return (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Regras Ativas</p>
                      <p className="text-2xl font-bold">{summary.activeRules}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Triggers</p>
                      <p className="text-2xl font-bold">{summary.totalTriggers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Redirecionamentos</p>
                      <p className="text-2xl font-bold">{summary.totalSuccessful}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                      <p className="text-2xl font-bold">{summary.averageConversion}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="testing">Testes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Regras de Redirecionamento</h4>
            <Button onClick={createNewRule}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="space-y-4">
            {redirectRules.map(rule => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                      />
                      <div>
                        <Input
                          value={rule.name}
                          onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                          className="font-semibold"
                        />
                        <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      </div>
                      <Badge variant="outline">
                        Prioridade {rule.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testRedirect(rule.id)}
                        disabled={isTestingRedirect}
                      >
                        {isTestingRedirect ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Condições */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Condições</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addConditionToRule(rule.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {rule.conditions.map((condition, index) => (
                      <div key={condition.id} className="flex items-center gap-2 p-3 border rounded-lg">
                        {index > 0 && (
                          <Badge variant="outline">E</Badge>
                        )}

                        <Select
                          value={condition.type}
                          onValueChange={(value: any) => updateCondition(rule.id, condition.id, { type: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="score">Pontuação</SelectItem>
                            <SelectItem value="outcome">Resultado</SelectItem>
                            <SelectItem value="profile">Perfil</SelectItem>
                            <SelectItem value="time">Tempo</SelectItem>
                            <SelectItem value="device">Dispositivo</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>

                        {condition.type === 'score' && (
                          <Select
                            value={condition.field}
                            onValueChange={(value) => updateCondition(rule.id, condition.id, { field: value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Campo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="total_score">Pontuação Total</SelectItem>
                              <SelectItem value="percentage_score">Pontuação %</SelectItem>
                              <SelectItem value="category_score">Por Categoria</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {condition.type === 'outcome' && (
                          <Select
                            value={condition.field}
                            onValueChange={(value) => updateCondition(rule.id, condition.id, { field: value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Resultado" />
                            </SelectTrigger>
                            <SelectContent>
                              {getOutcomeOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <Select
                          value={condition.operator}
                          onValueChange={(value: any) => updateCondition(rule.id, condition.id, { operator: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Igual a</SelectItem>
                            <SelectItem value="not_equals">Diferente de</SelectItem>
                            <SelectItem value="greater_than">Maior que</SelectItem>
                            <SelectItem value="less_than">Menor que</SelectItem>
                            <SelectItem value="between">Entre</SelectItem>
                            <SelectItem value="contains">Contém</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          value={String(condition.value)}
                          onChange={(e) => updateCondition(rule.id, condition.id, { value: e.target.value })}
                          placeholder="Valor"
                          className="w-24"
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCondition(rule.id, condition.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Ação */}
                  <div className="space-y-3">
                    <Label>Ação de Redirecionamento</Label>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={rule.action.type}
                          onValueChange={(value: any) => updateRule(rule.id, {
                            action: { ...rule.action, type: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp_direct">WhatsApp Direto</SelectItem>
                            <SelectItem value="whatsapp_business">WhatsApp Business</SelectItem>
                            <SelectItem value="whatsapp_group">Grupo WhatsApp</SelectItem>
                            <SelectItem value="custom_url">URL Personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {rule.action.type === 'whatsapp_direct' && 'Número do WhatsApp'}
                          {rule.action.type === 'whatsapp_business' && 'ID do Business'}
                          {rule.action.type === 'whatsapp_group' && 'Código do Grupo'}
                          {rule.action.type === 'custom_url' && 'URL Personalizada'}
                        </Label>
                        <Input
                          value={
                            rule.action.phoneNumber || 
                            rule.action.businessId || 
                            rule.action.groupInviteCode || 
                            rule.action.customUrl || 
                            ''
                          }
                          onChange={(e) => {
                            const updates: Partial<RedirectAction> = {};
                            if (rule.action.type === 'whatsapp_direct') updates.phoneNumber = e.target.value;
                            if (rule.action.type === 'whatsapp_business') updates.businessId = e.target.value;
                            if (rule.action.type === 'whatsapp_group') updates.groupInviteCode = e.target.value;
                            if (rule.action.type === 'custom_url') updates.customUrl = e.target.value;
                            
                            updateRule(rule.id, {
                              action: { ...rule.action, ...updates }
                            });
                          }}
                          placeholder={
                            rule.action.type === 'whatsapp_direct' ? '+5511999999999' :
                            rule.action.type === 'whatsapp_business' ? 'your_business_id' :
                            rule.action.type === 'whatsapp_group' ? 'group_invite_code' :
                            'https://example.com'
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea
                        value={rule.action.message}
                        onChange={(e) => updateRule(rule.id, {
                          action: { ...rule.action, message: e.target.value }
                        })}
                        placeholder="Mensagem que será enviada..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {{`campo`}} para personalizar com dados do usuário (ex: {{`total_score`}}, {{`result_type`}})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={rule.action.showConfirmation}
                          onCheckedChange={(showConfirmation) => updateRule(rule.id, {
                            action: { ...rule.action, showConfirmation }
                          })}
                        />
                        <Label>Mostrar confirmação</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label>Delay (ms):</Label>
                        <Input
                          type="number"
                          value={rule.action.delay || 0}
                          onChange={(e) => updateRule(rule.id, {
                            action: { ...rule.action, delay: Number(e.target.value) }
                          })}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Analytics da Regra */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Triggers</p>
                      <p className="text-lg font-semibold">{rule.analytics.totalTriggers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Sucessos</p>
                      <p className="text-lg font-semibold text-green-600">{rule.analytics.successfulRedirects}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Falhas</p>
                      <p className="text-lg font-semibold text-red-600">{rule.analytics.failedRedirects}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Taxa</p>
                      <p className="text-lg font-semibold">{rule.analytics.conversionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {redirectRules.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h4>
                  <p className="text-muted-foreground mb-4">
                    Crie regras para redirecionar usuários automaticamente para o WhatsApp
                  </p>
                  <Button onClick={createNewRule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Regra
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Templates de Redirecionamento</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.category === 'sales' && <Target className="w-4 h-4" />}
                        {template.category === 'support' && <Phone className="w-4 h-4" />}
                        {template.category === 'marketing' && <Send className="w-4 h-4" />}
                        {template.category === 'lead_qualification' && <Users className="w-4 h-4" />}
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Condições: {template.conditions.length}</span>
                    <span>Tipo: {template.action.type}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => applyTemplate(template.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aplicar Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Teste de Redirecionamentos</h4>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        {result.name}
                      </CardTitle>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'Passou' : 'Falhou'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Dados de Teste</Label>
                      <div className="text-sm text-muted-foreground">
                        {Object.entries(result.data).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Deveria Disparar</Label>
                        <div className="text-sm">
                          {result.shouldTrigger ? 'Sim' : 'Não'}
                        </div>
                      </div>
                      <div>
                        <Label>Disparou</Label>
                        <div className="text-sm">
                          {result.triggered ? 'Sim' : 'Não'}
                        </div>
                      </div>
                    </div>

                    {result.whatsappUrl && (
                      <div>
                        <Label>URL Gerada</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={result.whatsappUrl}
                            readOnly
                            className="text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(result.whatsappUrl)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(result.whatsappUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {testResults.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold mb-2">Nenhum teste executado</h4>
                <p className="text-muted-foreground mb-4">
                  Execute testes nas regras para validar o comportamento dos redirecionamentos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Analytics de Redirecionamento</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Regra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {redirectRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.analytics.totalTriggers} triggers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {rule.analytics.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rule.analytics.successfulRedirects}/{rule.analytics.totalTriggers}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>Mobile</span>
                    </div>
                    <span className="font-semibold">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Desktop</span>
                    </div>
                    <span className="font-semibold">25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WhatsAppRedirectManager;