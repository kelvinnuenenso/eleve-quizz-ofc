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
  Webhook, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Save,
  Download,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Zap,
  Filter,
  Calendar,
  Activity,
  Link,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  AlertCircle,
  HelpCircle,
  FileText,
  Code,
  Terminal,
  Layers,
  Network,
  Send,
  History,
  BarChart3,
  Target,
  Globe,
  Lock,
  Unlock,
  Key,
  Shield
} from 'lucide-react';
import { webhookSystem, WebhookConfig, WebhookEvent, WebhookPayload } from '@/lib/webhookSystem';
import type { Quiz } from '@/types/quiz';

interface WebhookManagerProps {
  quiz?: Quiz;
  onQuizUpdate?: (quiz: Quiz) => void;
}

interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  url: string;
  events: WebhookEvent[];
  headers: Record<string, string>;
  category: 'crm' | 'email' | 'analytics' | 'automation' | 'custom';
  icon: string;
  documentation?: string;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: WebhookEvent;
  quizId: string;
  payload: WebhookPayload;
  responseStatus: number;
  responseBody: string | null;
  errorMessage: string | null;
  attemptCount: number;
  executedAt: string;
}

interface WebhookPayload {
  includeUserData: boolean;
  includeQuizData: boolean;
  includeAnswers: boolean;
  includeMetadata: boolean;
  customFields: Record<string, string>;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  timestamp: string;
  event: string;
  status: 'success' | 'failed' | 'retrying';
  statusCode?: number;
  responseTime: number;
  attempt: number;
  error?: string;
  payload: Record<string, unknown>;
}

interface WebhookManagerProps {
  quizId: string;
}

export const WebhookManager = ({ quizId }: WebhookManagerProps) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const { toast } = useToast();

  const [newWebhook, setNewWebhook] = useState<Partial<Webhook>>({
    name: '',
    url: '',
    events: [
      { type: 'quiz_started', enabled: true },
      { type: 'quiz_completed', enabled: true },
      { type: 'lead_captured', enabled: true },
      { type: 'result_generated', enabled: false }
    ],
    isActive: true,
    retryAttempts: 3,
    retryDelay: 5,
    headers: {},
    payload: {
      includeUserData: true,
      includeQuizData: true,
      includeAnswers: true,
      includeMetadata: false,
      customFields: {}
    }
  });

  useEffect(() => {
    loadWebhooks();
    loadWebhookLogs();
  }, [quizId]);

  const loadWebhooks = async () => {
    try {
      if (!quiz?.id) return;
      
      // Get real webhooks from the webhook system
      const realWebhooks = await webhookSystem.getWebhooks(quiz.id);
      setWebhooks(realWebhooks);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      setWebhooks([]); // Empty array for new users
    }
  };

  const loadLogs = () => {
    if (!quiz) return;
    
    const webhookLogs = webhookSystem.getWebhookLogs(quiz.id);
    setLogs(webhookLogs);
  };

  const addWebhook = () => {
    if (!quiz || !newWebhook.name || !newWebhook.url) return;

    const webhook: WebhookConfig = {
      id: `webhook_${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events || [],
      headers: newWebhook.headers || {},
      active: newWebhook.active ?? true,
      retryCount: newWebhook.retryCount || 3,
      timeoutSeconds: newWebhook.timeoutSeconds || 30
    };

    webhookSystem.registerWebhook(quiz.id, webhook);
    loadWebhooks();
    
    setNewWebhook({
      name: '',
      url: '',
      events: [],
      headers: {},
      active: true,
      retryCount: 3,
      timeoutSeconds: 30
    });
    setShowAddWebhook(false);
  };

  const updateWebhook = (webhookId: string, updates: Partial<WebhookConfig>) => {
    if (!quiz) return;

    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    const updatedWebhook = { ...webhook, ...updates };
    webhookSystem.registerWebhook(quiz.id, updatedWebhook);
    loadWebhooks();
  };

  const deleteWebhook = (webhookId: string) => {
    if (!quiz) return;

    webhookSystem.removeWebhook(quiz.id, webhookId);
    loadWebhooks();
  };

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    setIsTesting(true);
    
    try {
      const success = await webhookSystem.testWebhook(webhook);
      
      if (success) {
        // Simular log de sucesso
        const testLog: WebhookLog = {
          id: `test_${Date.now()}`,
          webhookId: webhook.id,
          webhookName: webhook.name,
          event: 'quiz_start',
          quizId: quiz?.id || 'test',
          payload: {
            event: 'quiz_start',
            timestamp: new Date().toISOString(),
            quiz: {
              id: quiz?.id || 'test',
              name: quiz?.name || 'Test Quiz',
              publicId: quiz?.publicId || 'test-123'
            },
            data: { test: true }
          },
          responseStatus: 200,
          responseBody: 'OK',
          errorMessage: null,
          attemptCount: 1,
          executedAt: new Date().toISOString()
        };
        
        setLogs(prev => [testLog, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setNewWebhook({
      name: template.name,
      url: template.url,
      events: template.events,
      headers: template.headers,
      active: true,
      retryCount: 3,
      timeoutSeconds: 30
    });
    setShowAddWebhook(true);
  };

  const exportWebhooks = () => {
    const config = {
      webhooks,
      templates: templates.filter(t => !['zapier_integration', 'hubspot_crm', 'mailchimp_audience'].includes(t.id)),
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhooks-${quiz?.name || 'quiz'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWebhooks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !quiz) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.webhooks) {
          config.webhooks.forEach((webhook: WebhookConfig) => {
            webhookSystem.registerWebhook(quiz.id, webhook);
          });
          loadWebhooks();
        }
        if (config.templates) {
          setTemplates(prev => [...prev, ...config.templates]);
        }
      } catch (error) {
        console.error('Erro ao importar webhooks:', error);
      }
    };
    reader.readAsText(file);
  };

  const getEventIcon = (event: WebhookEvent) => {
    switch (event) {
      case 'quiz_start':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'quiz_complete':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'lead_capture':
        return <Target className="w-4 h-4 text-purple-600" />;
      case 'question_answer':
        return <HelpCircle className="w-4 h-4 text-orange-600" />;
      case 'drop_off':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status >= 400) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (status === 0) {
      return <WifiOff className="w-4 h-4 text-gray-600" />;
    }
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crm':
        return '🎯';
      case 'email':
        return '📧';
      case 'analytics':
        return '📊';
      case 'automation':
        return '⚡';
      case 'custom':
        return '🔧';
      default:
        return '🔗';
    }
  };

  const stats = quiz ? webhookSystem.getWebhookStats(quiz.id) : {
    totalWebhooks: 0,
    activeWebhooks: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6" />
            Webhooks Automáticos
          </h3>
          <p className="text-muted-foreground">
            Configure integrações automáticas para seus quizzes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importWebhooks}
            className="hidden"
            id="import-webhooks"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-webhooks')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportWebhooks}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddWebhook(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Webhook
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.totalWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{stats.activeWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Execuções</p>
                <p className="text-2xl font-bold">{stats.totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Sucessos</p>
                <p className="text-2xl font-bold">{stats.successfulExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold">{stats.failedExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          {showAddWebhook && (
            <Card>
              <CardHeader>
                <CardTitle>Novo Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Webhook</Label>
                    <Input
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="Ex: HubSpot Integration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <Input
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://api.exemplo.com/webhook"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Eventos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {(['quiz_start', 'quiz_complete', 'lead_capture', 'question_answer', 'drop_off'] as WebhookEvent[]).map(event => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event}
                          checked={newWebhook.events?.includes(event)}
                          onChange={(e) => {
                            const events = newWebhook.events || [];
                            if (e.target.checked) {
                              setNewWebhook({ ...newWebhook, events: [...events, event] });
                            } else {
                              setNewWebhook({ ...newWebhook, events: events.filter(ev => ev !== event) });
                            }
                          }}
                        />
                        <Label htmlFor={event} className="text-sm">
                          {event.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tentativas de Retry</Label>
                    <Input
                      type="number"
                      value={newWebhook.retryCount}
                      onChange={(e) => setNewWebhook({ ...newWebhook, retryCount: parseInt(e.target.value) })}
                      min="0"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timeout (segundos)</Label>
                    <Input
                      type="number"
                      value={newWebhook.timeoutSeconds}
                      onChange={(e) => setNewWebhook({ ...newWebhook, timeoutSeconds: parseInt(e.target.value) })}
                      min="5"
                      max="300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Headers Personalizados (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(newWebhook.headers || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const headers = JSON.parse(e.target.value);
                        setNewWebhook({ ...newWebhook, headers });
                      } catch (error) {
                        // Ignore invalid JSON
                      }
                    }}
                    placeholder='{\n  "Authorization": "Bearer token",\n  "X-API-Key": "key"\n}'
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newWebhook.active}
                    onCheckedChange={(active) => setNewWebhook({ ...newWebhook, active })}
                  />
                  <Label>Ativar webhook</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={addWebhook}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Webhook
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddWebhook(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <div>
                          <CardTitle>{webhook.name}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            {webhook.url}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyWebhookUrl(webhook.url)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                        </div>
                      </div>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={testingWebhook === webhook.id}
                      >
                        {testingWebhook === webhook.id ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Testar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingWebhook(webhook)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Switch
                        checked={webhook.isActive}
                        onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Eventos Ativos</h4>
                      <div className="space-y-1">
                        {webhook.events.filter(e => e.enabled).map((event) => (
                          <Badge key={event.type} variant="outline">
                            {event.type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Estatísticas</h4>
                      <div className="text-sm space-y-1">
                        <div>Total: {webhook.totalTriggers}</div>
                        <div className="text-green-600">Sucessos: {webhook.successfulTriggers}</div>
                        <div className="text-red-600">Falhas: {webhook.failedTriggers}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Configuração</h4>
                      <div className="text-sm space-y-1">
                        <div>Tentativas: {webhook.retryAttempts}</div>
                        <div>Delay: {webhook.retryDelay}s</div>
                        {webhook.lastTriggered && (
                          <div>Último: {new Date(webhook.lastTriggered).toLocaleString('pt-BR')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => {
                  const webhook = webhooks.find(w => w.id === log.webhookId);
                  return (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={getStatusColor(log.status)}>
                          {getStatusIcon(log.status)}
                        </div>
                        <div>
                          <div className="font-medium">{webhook?.name || 'Webhook Desconhecido'}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.event} • {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className={`font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </div>
                          <div className="text-muted-foreground">
                            {log.responseTime}ms • Tentativa {log.attempt}
                          </div>
                        </div>
                        {log.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryFailedWebhook(log.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Tentar Novamente
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates Populares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    name: 'Zapier Integration',
                    description: 'Configure webhook para Zapier',
                    url: 'https://hooks.zapier.com/hooks/catch/{{zap_id}}/{{hook_id}}/',
                    events: ['quiz_completed', 'lead_captured']
                  },
                  {
                    name: 'Slack Notifications',
                    description: 'Receba notificações no Slack',
                    url: 'https://hooks.slack.com/services/{{workspace}}/{{channel}}/{{token}}',
                    events: ['quiz_completed']
                  },
                  {
                    name: 'HubSpot CRM',
                    description: 'Sincronizar leads com HubSpot',
                    url: 'https://api.hubapi.com/contacts/v1/contact/',
                    events: ['lead_captured']
                  }
                ].map((template, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {template.events.map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewWebhook({
                            ...newWebhook,
                            name: template.name,
                            url: template.url,
                            events: template.events.map(event => ({
                              type: event as any,
                              enabled: true
                            }))
                          });
                          setIsCreating(true);
                        }}
                      >
                        Usar Template
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exemplo de Payload</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto">
{`{
  "event": "quiz_completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "quiz_id": "${quizId}",
  "quiz_data": {
    "name": "Quiz de Personalidade",
    "description": "Descubra seu perfil"
  },
  "user_data": {
    "id": "user_123",
    "email": "usuario@exemplo.com",
    "name": "João Silva"
  },
  "answers": [
    {
      "question_id": "q1",
      "answer": "Opção A",
      "score": 10
    }
  ],
  "result": {
    "score": 85,
    "outcome": "Extrovertido",
    "completion_time": 120
  },
  "metadata": {
    "source": "web",
    "device": "desktop",
    "referrer": "google.com"
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Webhook Modal */}
      {(isCreating || editingWebhook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Criar Novo Webhook' : 'Editar Webhook'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Nome</Label>
                  <Input 
                    id="webhook-name" 
                    placeholder="Ex: Integração CRM"
                    value={newWebhook.name || ''}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL</Label>
                  <Input 
                    id="webhook-url" 
                    placeholder="https://api.example.com/webhook"
                    type="url"
                    value={newWebhook.url || ''}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="space-y-2">
                  {newWebhook.events?.map((event, index) => (
                    <div key={event.type} className="flex items-center justify-between">
                      <span className="text-sm">{event.type.replace('_', ' ').toUpperCase()}</span>
                      <Switch
                        checked={event.enabled}
                        onCheckedChange={(checked) => {
                          const updatedEvents = [...(newWebhook.events || [])];
                          updatedEvents[index] = { ...event, enabled: checked };
                          setNewWebhook({ ...newWebhook, events: updatedEvents });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Tentativas de Retry</Label>
                  <Input 
                    id="retry-attempts" 
                    type="number"
                    min="0"
                    max="10"
                    value={newWebhook.retryAttempts || 3}
                    onChange={(e) => setNewWebhook({ ...newWebhook, retryAttempts: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-delay">Delay entre Tentativas (s)</Label>
                  <Input 
                    id="retry-delay" 
                    type="number"
                    min="1"
                    max="300"
                    value={newWebhook.retryDelay || 5}
                    onChange={(e) => setNewWebhook({ ...newWebhook, retryDelay: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Headers Customizados (JSON)</Label>
                <Textarea 
                  id="headers" 
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  value={JSON.stringify(newWebhook.headers || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value || '{}');
                      setNewWebhook({ ...newWebhook, headers });
                    } catch {}
                  }}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingWebhook(null);
                    setNewWebhook({});
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={createWebhook}>
                  {isCreating ? 'Criar Webhook' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};