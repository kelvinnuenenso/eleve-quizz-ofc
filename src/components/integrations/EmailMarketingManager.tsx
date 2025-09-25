import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Settings,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  Target,
  Users,
  Send,
  Calendar,
  Tag,
  User,
  Building,
  TrendingUp,
  Activity,
  Clock,
  Play,
  Pause,
  Filter,
  Search,
  Eye,
  Edit
} from 'lucide-react';
import { Quiz } from '@/types/quiz';

interface EmailMarketingManagerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface EmailConnection {
  id: string;
  name: string;
  type: 'mailchimp' | 'convertkit' | 'activecampaign' | 'klaviyo' | 'sendinblue' | 'mailerlite' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  apiKey?: string;
  apiUrl?: string;
  accountId?: string;
  settings: {
    autoSubscribe: boolean;
    doubleOptIn: boolean;
    sendWelcomeEmail: boolean;
    segmentByScore: boolean;
    tagByResult: boolean;
    updateExistingContacts: boolean;
    defaultListId?: string;
    welcomeEmailTemplate?: string;
    tags: string[];
    customFields: Record<string, string>;
  };
  lists: EmailList[];
  campaigns: EmailCampaign[];
  lastSync?: string;
  totalSubscribers: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: string;
}

interface EmailList {
  id: string;
  name: string;
  subscriberCount: number;
  isDefault: boolean;
  tags: string[];
  createdAt: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  type: 'welcome' | 'follow_up' | 'nurture' | 'promotional';
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  listId: string;
  template: string;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
  triggers: {
    quizCompleted: boolean;
    scoreRange?: { min: number; max: number };
    specificResult?: string;
    delay?: number; // em horas
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  type: EmailConnection['type'];
  description: string;
  icon: string;
  color: string;
  features: string[];
  documentation: string;
  authType: 'api_key' | 'oauth' | 'basic_auth';
  defaultSettings: Partial<EmailConnection['settings']>;
  automationSupport: boolean;
  segmentationSupport: boolean;
  advancedAnalytics: boolean;
}

interface EmailLog {
  id: string;
  connectionId: string;
  connectionName: string;
  operation: 'subscribe' | 'unsubscribe' | 'send_campaign' | 'create_list' | 'update_contact';
  status: 'success' | 'failed' | 'pending';
  email?: string;
  listId?: string;
  campaignId?: string;
  errorMessage?: string;
  data: any;
  executedAt: string;
  responseTime?: number;
}

export function EmailMarketingManager({ quiz, onQuizUpdate }: EmailMarketingManagerProps) {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [activeTab, setActiveTab] = useState('connections');
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<EmailConnection>>({
    name: '',
    type: 'mailchimp',
    status: 'disconnected',
    settings: {
      autoSubscribe: true,
      doubleOptIn: false,
      sendWelcomeEmail: true,
      segmentByScore: true,
      tagByResult: true,
      updateExistingContacts: true,
      tags: [],
      customFields: {}
    },
    lists: [],
    campaigns: []
  });
  const [newCampaign, setNewCampaign] = useState<Partial<EmailCampaign>>({
    name: '',
    subject: '',
    type: 'welcome',
    status: 'draft',
    template: '',
    stats: { sent: 0, opened: 0, clicked: 0, unsubscribed: 0 },
    triggers: {
      quizCompleted: true,
      delay: 0
    }
  });

  useEffect(() => {
    initializeTemplates();
    loadConnections();
    loadLogs();
  }, [quiz]);

  const initializeTemplates = () => {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'mailchimp_marketing',
        name: 'Mailchimp',
        type: 'mailchimp',
        description: 'Plataforma completa de email marketing com automações avançadas',
        icon: '🐵',
        color: 'bg-yellow-500',
        features: [
          'Listas e segmentação avançada',
          'Automações comportamentais',
          'A/B Testing nativo',
          'Analytics detalhados',
          'Templates responsivos',
          'Integração com e-commerce'
        ],
        documentation: 'https://mailchimp.com/developer/marketing/',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: true,
          sendWelcomeEmail: true,
          segmentByScore: true,
          tagByResult: true,
          updateExistingContacts: true,
          tags: ['quiz-lead', 'elevado']
        },
        automationSupport: true,
        segmentationSupport: true,
        advancedAnalytics: true
      },
      {
        id: 'convertkit_creator',
        name: 'ConvertKit',
        type: 'convertkit',
        description: 'Plataforma focada em criadores de conteúdo com automações simples',
        icon: '✉️',
        color: 'bg-pink-500',
        features: [
          'Formulários customizáveis',
          'Sequências automáticas',
          'Tags e segmentos',
          'Landing pages',
          'Relatórios simples',
          'Integrações nativas'
        ],
        documentation: 'https://developers.convertkit.com/',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: false,
          sendWelcomeEmail: true,
          segmentByScore: false,
          tagByResult: true,
          updateExistingContacts: true,
          tags: ['quiz', 'lead']
        },
        automationSupport: true,
        segmentationSupport: false,
        advancedAnalytics: false
      },
      {
        id: 'activecampaign_automation',
        name: 'ActiveCampaign',
        type: 'activecampaign',
        description: 'CRM e email marketing com automações comportamentais avançadas',
        icon: '🎯',
        color: 'bg-blue-600',
        features: [
          'CRM integrado',
          'Automações visuais',
          'Lead scoring',
          'Segmentação dinâmica',
          'Machine learning',
          'Attribution reporting'
        ],
        documentation: 'https://developers.activecampaign.com/',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: false,
          sendWelcomeEmail: true,
          segmentByScore: true,
          tagByResult: true,
          updateExistingContacts: true,
          tags: ['quiz-lead', 'hot-lead']
        },
        automationSupport: true,
        segmentationSupport: true,
        advancedAnalytics: true
      },
      {
        id: 'klaviyo_ecommerce',
        name: 'Klaviyo',
        type: 'klaviyo',
        description: 'Plataforma de email marketing focada em e-commerce',
        icon: '🛍️',
        color: 'bg-purple-600',
        features: [
          'Segmentação preditiva',
          'Flows comportamentais',
          'Personalização avançada',
          'Analytics de receita',
          'Integração e-commerce',
          'SMS marketing'
        ],
        documentation: 'https://developers.klaviyo.com/',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: true,
          sendWelcomeEmail: true,
          segmentByScore: true,
          tagByResult: true,
          updateExistingContacts: true,
          tags: ['quiz', 'prospect']
        },
        automationSupport: true,
        segmentationSupport: true,
        advancedAnalytics: true
      },
      {
        id: 'sendinblue_transactional',
        name: 'Sendinblue (Brevo)',
        type: 'sendinblue',
        description: 'Plataforma completa com email marketing e transacional',
        icon: '📧',
        color: 'bg-green-600',
        features: [
          'Email transacional',
          'SMS marketing',
          'Chat ao vivo',
          'CRM básico',
          'Automações visuais',
          'Landing pages'
        ],
        documentation: 'https://developers.sendinblue.com/',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: true,
          sendWelcomeEmail: true,
          segmentByScore: false,
          tagByResult: true,
          updateExistingContacts: true,
          tags: ['quiz-subscriber']
        },
        automationSupport: true,
        segmentationSupport: false,
        advancedAnalytics: false
      },
      {
        id: 'mailerlite_simple',
        name: 'MailerLite',
        type: 'mailerlite',
        description: 'Solução simples e acessível para email marketing',
        icon: '📮',
        color: 'bg-teal-500',
        features: [
          'Editor drag & drop',
          'Automações básicas',
          'Pop-ups e formulários',
          'Landing pages',
          'Relatórios essenciais',
          'Integrações simples'
        ],
        documentation: 'https://developers.mailerlite.com/',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: false,
          sendWelcomeEmail: true,
          segmentByScore: false,
          tagByResult: false,
          updateExistingContacts: true,
          tags: ['quiz']
        },
        automationSupport: false,
        segmentationSupport: false,
        advancedAnalytics: false
      },
      {
        id: 'custom_email',
        name: 'API Personalizada',
        type: 'custom',
        description: 'Configure integração com qualquer plataforma via API REST',
        icon: '🔧',
        color: 'bg-gray-500',
        features: [
          'API REST personalizada',
          'Headers customizados',
          'Mapeamento flexível',
          'Autenticação configurável',
          'Retry automático',
          'Logs detalhados'
        ],
        documentation: 'https://docs.elevado.com/integrations/custom-email',
        authType: 'api_key',
        defaultSettings: {
          autoSubscribe: true,
          doubleOptIn: false,
          sendWelcomeEmail: false,
          segmentByScore: false,
          tagByResult: false,
          updateExistingContacts: false,
          tags: []
        },
        automationSupport: false,
        segmentationSupport: false,
        advancedAnalytics: false
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadConnections = () => {
    const saved = localStorage.getItem(`email_connections_${quiz.id}`);
    if (saved) {
      try {
        setConnections(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar conexões de email:', error);
      }
    }
  };

  const saveConnections = (newConnections: EmailConnection[]) => {
    localStorage.setItem(`email_connections_${quiz.id}`, JSON.stringify(newConnections));
    setConnections(newConnections);
  };

  const loadLogs = () => {
    const saved = localStorage.getItem(`email_logs_${quiz.id}`);
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar logs de email:', error);
      }
    }
  };

  const saveLogs = (newLogs: EmailLog[]) => {
    localStorage.setItem(`email_logs_${quiz.id}`, JSON.stringify(newLogs));
    setLogs(newLogs);
  };

  const addConnection = () => {
    if (!newConnection.name || !newConnection.type) return;

    const connection: EmailConnection = {
      id: `email_${Date.now()}`,
      name: newConnection.name,
      type: newConnection.type,
      status: 'disconnected',
      settings: newConnection.settings || {
        autoSubscribe: true,
        doubleOptIn: false,
        sendWelcomeEmail: true,
        segmentByScore: true,
        tagByResult: true,
        updateExistingContacts: true,
        tags: [],
        customFields: {}
      },
      lists: [],
      campaigns: [],
      totalSubscribers: 0,
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      createdAt: new Date().toISOString()
    };

    const template = templates.find(t => t.type === newConnection.type);
    if (template) {
      connection.settings = { ...template.defaultSettings, ...connection.settings };
    }

    saveConnections([...connections, connection]);
    
    setNewConnection({
      name: '',
      type: 'mailchimp',
      status: 'disconnected',
      settings: {
        autoSubscribe: true,
        doubleOptIn: false,
        sendWelcomeEmail: true,
        segmentByScore: true,
        tagByResult: true,
        updateExistingContacts: true,
        tags: [],
        customFields: {}
      },
      lists: [],
      campaigns: []
    });
    setShowAddConnection(false);
  };

  const updateConnection = (connectionId: string, updates: Partial<EmailConnection>) => {
    const updatedConnections = connections.map(conn =>
      conn.id === connectionId ? { ...conn, ...updates } : conn
    );
    saveConnections(updatedConnections);
  };

  const deleteConnection = (connectionId: string) => {
    const updatedConnections = connections.filter(conn => conn.id !== connectionId);
    saveConnections(updatedConnections);
  };

  const testConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setIsTesting(true);
    updateConnection(connectionId, { status: 'testing' });

    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.15; // 85% de sucesso
      
      if (success) {
        // Simular dados de listas
        const mockLists: EmailList[] = [
          {
            id: 'list_1',
            name: 'Quiz Subscribers',
            subscriberCount: Math.floor(Math.random() * 1000) + 100,
            isDefault: true,
            tags: ['quiz', 'active'],
            createdAt: new Date().toISOString()
          },
          {
            id: 'list_2',
            name: 'High Score Leads',
            subscriberCount: Math.floor(Math.random() * 500) + 50,
            isDefault: false,
            tags: ['high-score', 'qualified'],
            createdAt: new Date().toISOString()
          }
        ];

        updateConnection(connectionId, { 
          status: 'connected',
          lists: mockLists,
          totalSubscribers: mockLists.reduce((sum, list) => sum + list.subscriberCount, 0)
        });
        
        // Adicionar log de sucesso
        const testLog: EmailLog = {
          id: `test_${Date.now()}`,
          connectionId: connection.id,
          connectionName: connection.name,
          operation: 'subscribe',
          status: 'success',
          email: 'test@example.com',
          listId: 'list_1',
          data: {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            source: 'Connection Test'
          },
          executedAt: new Date().toISOString(),
          responseTime: 187
        };
        
        saveLogs([testLog, ...logs]);
      } else {
        updateConnection(connectionId, { status: 'error' });
        
        // Adicionar log de erro
        const errorLog: EmailLog = {
          id: `error_${Date.now()}`,
          connectionId: connection.id,
          connectionName: connection.name,
          operation: 'subscribe',
          status: 'failed',
          email: 'test@example.com',
          errorMessage: 'Invalid API key or insufficient permissions',
          data: {
            email: 'test@example.com'
          },
          executedAt: new Date().toISOString()
        };
        
        saveLogs([errorLog, ...logs]);
      }
    } catch (error) {
      updateConnection(connectionId, { status: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const addCampaign = (connectionId: string) => {
    if (!newCampaign.name || !newCampaign.subject) return;

    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}`,
      name: newCampaign.name,
      subject: newCampaign.subject,
      type: newCampaign.type || 'welcome',
      status: 'draft',
      listId: newCampaign.listId || connection.lists[0]?.id || '',
      template: newCampaign.template || '',
      stats: { sent: 0, opened: 0, clicked: 0, unsubscribed: 0 },
      triggers: newCampaign.triggers || {
        quizCompleted: true,
        delay: 0
      }
    };

    const updatedCampaigns = [...connection.campaigns, campaign];
    updateConnection(connectionId, { campaigns: updatedCampaigns });

    setNewCampaign({
      name: '',
      subject: '',
      type: 'welcome',
      status: 'draft',
      template: '',
      stats: { sent: 0, opened: 0, clicked: 0, unsubscribed: 0 },
      triggers: {
        quizCompleted: true,
        delay: 0
      }
    });
    setShowCampaignBuilder(false);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setNewConnection({
      name: template.name,
      type: template.type,
      status: 'disconnected',
      settings: { ...template.defaultSettings },
      lists: [],
      campaigns: []
    });
    setShowAddConnection(true);
  };

  const exportConnections = () => {
    const config = {
      connections: connections.map(conn => ({
        ...conn,
        apiKey: undefined, // Remove sensitive data
        apiUrl: undefined
      })),
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-integrations-${quiz.name || 'quiz'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConnections = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.connections) {
          const importedConnections = config.connections.map((conn: any) => ({
            ...conn,
            id: `email_${Date.now()}_${Math.random()}`,
            status: 'disconnected',
            createdAt: new Date().toISOString()
          }));
          saveConnections([...connections, ...importedConnections]);
        }
      } catch (error) {
        console.error('Erro ao importar conexões:', error);
      }
    };
    reader.readAsText(file);
  };

  const getStatusIcon = (status: EmailConnection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'disconnected':
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getOperationIcon = (operation: EmailLog['operation']) => {
    switch (operation) {
      case 'subscribe':
        return <User className="w-4 h-4 text-green-600" />;
      case 'unsubscribe':
        return <User className="w-4 h-4 text-red-600" />;
      case 'send_campaign':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'create_list':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'update_contact':
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCampaignStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalConnections: connections.length,
    activeConnections: connections.filter(c => c.status === 'connected').length,
    totalSubscribers: connections.reduce((sum, c) => sum + c.totalSubscribers, 0),
    totalSent: connections.reduce((sum, c) => sum + c.totalSent, 0),
    totalOpened: connections.reduce((sum, c) => sum + c.totalOpened, 0),
    totalClicked: connections.reduce((sum, c) => sum + c.totalClicked, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Marketing
          </h3>
          <p className="text-muted-foreground">
            Conecte com plataformas de email marketing para nutrir seus leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importConnections}
            className="hidden"
            id="import-email"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-email')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportConnections}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddConnection(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conexão
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Conexões</p>
                <p className="text-2xl font-bold">{stats.totalConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{stats.activeConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inscritos</p>
                <p className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Abertos</p>
                <p className="text-2xl font-bold">{stats.totalOpened.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cliques</p>
                <p className="text-2xl font-bold">{stats.totalClicked.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {showAddConnection && (
            <Card>
              <CardHeader>
                <CardTitle>Nova Conexão Email Marketing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Conexão</Label>
                    <Input
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                      placeholder="Ex: Mailchimp Principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={newConnection.type}
                      onValueChange={(type: EmailConnection['type']) => setNewConnection({ ...newConnection, type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mailchimp">Mailchimp</SelectItem>
                        <SelectItem value="convertkit">ConvertKit</SelectItem>
                        <SelectItem value="activecampaign">ActiveCampaign</SelectItem>
                        <SelectItem value="klaviyo">Klaviyo</SelectItem>
                        <SelectItem value="sendinblue">Sendinblue</SelectItem>
                        <SelectItem value="mailerlite">MailerLite</SelectItem>
                        <SelectItem value="custom">API Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações de Inscrição</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Inscrição Automática</Label>
                      <Switch
                        checked={newConnection.settings?.autoSubscribe}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, autoSubscribe: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Double Opt-in</Label>
                      <Switch
                        checked={newConnection.settings?.doubleOptIn}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, doubleOptIn: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Email de Boas-vindas</Label>
                      <Switch
                        checked={newConnection.settings?.sendWelcomeEmail}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, sendWelcomeEmail: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Segmentar por Pontuação</Label>
                      <Switch
                        checked={newConnection.settings?.segmentByScore}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, segmentByScore: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags Padrão (separadas por vírgula)</Label>
                  <Input
                    value={newConnection.settings?.tags?.join(', ')}
                    onChange={(e) => setNewConnection({
                      ...newConnection,
                      settings: { 
                        ...newConnection.settings!, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="quiz, lead, elevado"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={addConnection}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Conexão
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddConnection(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {connections.map(connection => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <h4 className="font-semibold">{connection.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {templates.find(t => t.type === connection.type)?.name || connection.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(connection.id)}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Testar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConnection(connection.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteConnection(connection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={connection.status === 'connected' ? 'default' : 'secondary'}>
                      {connection.status === 'connected' ? 'Conectado' : 
                       connection.status === 'error' ? 'Erro' : 
                       connection.status === 'testing' ? 'Testando' : 'Desconectado'}
                    </Badge>
                    <Badge variant="outline">
                      {connection.totalSubscribers} inscritos
                    </Badge>
                    <Badge variant="outline">
                      {connection.lists.length} listas
                    </Badge>
                    <Badge variant="outline">
                      {connection.campaigns.length} campanhas
                    </Badge>
                  </div>

                  {connection.status === 'connected' && connection.lists.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Listas:</h5>
                      <div className="grid md:grid-cols-2 gap-2">
                        {connection.lists.map(list => (
                          <div key={list.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <p className="font-medium text-sm">{list.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {list.subscriberCount} inscritos
                              </p>
                            </div>
                            {list.isDefault && (
                              <Badge variant="outline" className="text-xs">Padrão</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-lg">{connection.totalSent.toLocaleString()}</p>
                      <p className="text-muted-foreground">Enviados</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-lg">{connection.totalOpened.toLocaleString()}</p>
                      <p className="text-muted-foreground">Abertos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-lg">{connection.totalClicked.toLocaleString()}</p>
                      <p className="text-muted-foreground">Cliques</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-lg">
                        {connection.totalSent > 0 
                          ? Math.round((connection.totalOpened / connection.totalSent) * 100)
                          : 0}%
                      </p>
                      <p className="text-muted-foreground">Taxa Abertura</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {connections.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhuma conexão configurada</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure conexões com plataformas de email marketing para nutrir seus leads
                  </p>
                  <Button onClick={() => setShowAddConnection(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Conexão
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Campanhas de Email</h4>
            <Button onClick={() => setShowCampaignBuilder(true)} disabled={connections.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>

          {showCampaignBuilder && (
            <Card>
              <CardHeader>
                <CardTitle>Nova Campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Ex: Boas-vindas Quiz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assunto do Email</Label>
                    <Input
                      value={newCampaign.subject}
                      onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                      placeholder="Ex: Obrigado por fazer nosso quiz!"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Campanha</Label>
                    <Select
                      value={newCampaign.type}
                      onValueChange={(type: EmailCampaign['type']) => setNewCampaign({ ...newCampaign, type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Boas-vindas</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="nurture">Nutrição</SelectItem>
                        <SelectItem value="promotional">Promocional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delay (horas após quiz)</Label>
                    <Input
                      type="number"
                      value={newCampaign.triggers?.delay || 0}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        triggers: { ...newCampaign.triggers!, delay: parseInt(e.target.value) || 0 }
                      })}
                      min="0"
                      max="168"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Template do Email</Label>
                  <Textarea
                    value={newCampaign.template}
                    onChange={(e) => setNewCampaign({ ...newCampaign, template: e.target.value })}
                    placeholder="Olá {{firstName}}, obrigado por fazer nosso quiz! Seu resultado foi: {{quizResult}}"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={() => addCampaign(selectedConnection)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </Button>
                  <Button variant="outline" onClick={() => setShowCampaignBuilder(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {connections.map(connection => 
              connection.campaigns.length > 0 && (
                <Card key={connection.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{connection.name} - Campanhas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {connection.campaigns.map(campaign => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{campaign.name}</h5>
                            <Badge className={getCampaignStatusColor(campaign.status)}>
                              {campaign.status === 'draft' ? 'Rascunho' :
                               campaign.status === 'scheduled' ? 'Agendado' :
                               campaign.status === 'sent' ? 'Enviado' : 'Pausado'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Tipo: {campaign.type}</span>
                            <span>Delay: {campaign.triggers.delay}h</span>
                            <span>Enviados: {campaign.stats.sent}</span>
                            <span>Abertos: {campaign.stats.opened}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            )}

            {connections.every(c => c.campaigns.length === 0) && (
              <Card>
                <CardContent className="text-center py-8">
                  <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhuma campanha criada</h4>
                  <p className="text-muted-foreground mb-4">
                    Crie campanhas automáticas para nutrir seus leads do quiz
                  </p>
                  <Button onClick={() => setShowCampaignBuilder(true)} disabled={connections.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Campanha
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center text-white text-lg`}>
                      {template.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Recursos:</h5>
                    <div className="space-y-1">
                      {template.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {template.features.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{template.features.length - 3} recursos adicionais
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">
                      {template.authType === 'api_key' ? 'API Key' : 
                       template.authType === 'oauth' ? 'OAuth' : 'Basic Auth'}
                    </Badge>
                    {template.automationSupport && (
                      <Badge variant="outline">Automação</Badge>
                    )}
                    {template.segmentationSupport && (
                      <Badge variant="outline">Segmentação</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Usar Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(template.documentation, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Logs de Email Marketing</h4>
            <Button variant="outline" onClick={loadLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <div className="space-y-2">
            {logs.slice(0, 50).map(log => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getOperationIcon(log.operation)}
                      <div>
                        <p className="font-medium">{log.connectionName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{log.operation.replace('_', ' ')}</span>
                          {log.email && (
                            <>
                              <span>•</span>
                              <span>{log.email}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(log.executedAt).toLocaleString()}</span>
                          {log.responseTime && (
                            <>
                              <span>•</span>
                              <span>{log.responseTime}ms</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.status === 'success' ? 'Sucesso' : 
                         log.status === 'failed' ? 'Falha' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>

                  {log.errorMessage && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Erro:</strong> {log.errorMessage}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {logs.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhum log encontrado</h4>
                  <p className="text-muted-foreground">
                    Os logs de email marketing aparecerão aqui quando as integrações forem executadas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Globais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Inscrição Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Inscrever automaticamente quando um quiz for completado
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Campanhas Automáticas</Label>
                    <p className="text-sm text-muted-foreground">
                      Executar campanhas automaticamente baseadas em triggers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Logs Detalhados</Label>
                    <p className="text-sm text-muted-foreground">
                      Salvar dados completos nos logs
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Retry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tentativas Máximas</Label>
                  <Input type="number" defaultValue="3" min="1" max="10" />
                </div>
                <div className="space-y-2">
                  <Label>Delay entre Tentativas (segundos)</Label>
                  <Input type="number" defaultValue="5" min="1" max="60" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limpeza de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Manter logs por (dias)</Label>
                <Input type="number" defaultValue="90" />
              </div>

              <Button variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Logs Antigos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailMarketingManager;