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
  Users,
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
  Database,
  Zap,
  Mail,
  Phone,
  Calendar,
  Tag,
  User,
  Building,
  DollarSign,
  Activity,
  Clock,
  Play,
  Pause
} from 'lucide-react';
import { Quiz } from '@/types/quiz';

interface CRMIntegrationManagerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface CRMConnection {
  id: string;
  name: string;
  type: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'freshsales' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  apiKey?: string;
  apiUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  settings: {
    syncContacts: boolean;
    syncDeals: boolean;
    syncCompanies: boolean;
    syncActivities: boolean;
    autoCreateLeads: boolean;
    updateExistingContacts: boolean;
    duplicateHandling: 'skip' | 'update' | 'create_new';
    leadSource: string;
    defaultOwner?: string;
    customFields: Record<string, string>;
  };
  fieldMapping: Record<string, string>;
  lastSync?: string;
  totalSynced: number;
  successfulSyncs: number;
  failedSyncs: number;
  createdAt: string;
}

interface CRMTemplate {
  id: string;
  name: string;
  type: CRMConnection['type'];
  description: string;
  icon: string;
  color: string;
  features: string[];
  documentation: string;
  authType: 'api_key' | 'oauth' | 'basic_auth';
  defaultSettings: Partial<CRMConnection['settings']>;
  defaultFieldMapping: Record<string, string>;
  webhookSupport: boolean;
  realTimeSync: boolean;
}

interface SyncLog {
  id: string;
  crmId: string;
  crmName: string;
  operation: 'create_contact' | 'update_contact' | 'create_deal' | 'create_activity';
  status: 'success' | 'failed' | 'pending';
  recordId?: string;
  errorMessage?: string;
  data: any;
  executedAt: string;
  responseTime?: number;
}

export function CRMIntegrationManager({ quiz, onQuizUpdate }: CRMIntegrationManagerProps) {
  const [connections, setConnections] = useState<CRMConnection[]>([]);
  const [templates, setTemplates] = useState<CRMTemplate[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [activeTab, setActiveTab] = useState('connections');
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<CRMConnection>>({
    name: '',
    type: 'hubspot',
    status: 'disconnected',
    settings: {
      syncContacts: true,
      syncDeals: false,
      syncCompanies: false,
      syncActivities: true,
      autoCreateLeads: true,
      updateExistingContacts: true,
      duplicateHandling: 'update',
      leadSource: 'Elevado Quiz',
      customFields: {}
    },
    fieldMapping: {}
  });

  useEffect(() => {
    initializeTemplates();
    loadConnections();
    loadLogs();
  }, [quiz]);

  const initializeTemplates = () => {
    const defaultTemplates: CRMTemplate[] = [
      {
        id: 'hubspot_crm',
        name: 'HubSpot CRM',
        type: 'hubspot',
        description: 'Integração completa com HubSpot CRM - contatos, deals e atividades',
        icon: '🎯',
        color: 'bg-orange-500',
        features: [
          'Criação automática de contatos',
          'Sincronização de deals',
          'Tracking de atividades',
          'Custom properties',
          'Workflows automáticos',
          'Relatórios avançados'
        ],
        documentation: 'https://developers.hubspot.com/docs/api/crm',
        authType: 'api_key',
        defaultSettings: {
          syncContacts: true,
          syncDeals: true,
          syncCompanies: false,
          syncActivities: true,
          autoCreateLeads: true,
          updateExistingContacts: true,
          duplicateHandling: 'update',
          leadSource: 'Elevado Quiz'
        },
        defaultFieldMapping: {
          'email': 'email',
          'firstName': 'firstname',
          'lastName': 'lastname',
          'phone': 'phone',
          'company': 'company',
          'quizScore': 'quiz_score',
          'quizResult': 'quiz_result'
        },
        webhookSupport: true,
        realTimeSync: true
      },
      {
        id: 'salesforce_crm',
        name: 'Salesforce',
        type: 'salesforce',
        description: 'Integração com Salesforce CRM - leads, contatos e oportunidades',
        icon: '☁️',
        color: 'bg-blue-500',
        features: [
          'Criação de leads',
          'Conversão para contatos',
          'Oportunidades automáticas',
          'Custom fields',
          'Process Builder',
          'Einstein Analytics'
        ],
        documentation: 'https://developer.salesforce.com/docs/api-explorer',
        authType: 'oauth',
        defaultSettings: {
          syncContacts: true,
          syncDeals: true,
          syncCompanies: true,
          syncActivities: true,
          autoCreateLeads: true,
          updateExistingContacts: false,
          duplicateHandling: 'skip',
          leadSource: 'Web Quiz'
        },
        defaultFieldMapping: {
          'email': 'Email',
          'firstName': 'FirstName',
          'lastName': 'LastName',
          'phone': 'Phone',
          'company': 'Company',
          'quizScore': 'Quiz_Score__c',
          'quizResult': 'Quiz_Result__c'
        },
        webhookSupport: true,
        realTimeSync: false
      },
      {
        id: 'pipedrive_crm',
        name: 'Pipedrive',
        type: 'pipedrive',
        description: 'Integração com Pipedrive - pessoas, organizações e deals',
        icon: '🚀',
        color: 'bg-green-500',
        features: [
          'Criação de pessoas',
          'Organizações automáticas',
          'Pipeline de vendas',
          'Atividades programadas',
          'Custom fields',
          'Automações'
        ],
        documentation: 'https://developers.pipedrive.com/docs/api/v1',
        authType: 'api_key',
        defaultSettings: {
          syncContacts: true,
          syncDeals: true,
          syncCompanies: true,
          syncActivities: true,
          autoCreateLeads: true,
          updateExistingContacts: true,
          duplicateHandling: 'update',
          leadSource: 'Quiz Lead'
        },
        defaultFieldMapping: {
          'email': 'email',
          'name': 'name',
          'phone': 'phone',
          'orgName': 'org_name',
          'quizScore': 'quiz_score',
          'quizResult': 'quiz_result'
        },
        webhookSupport: true,
        realTimeSync: true
      },
      {
        id: 'zoho_crm',
        name: 'Zoho CRM',
        type: 'zoho',
        description: 'Integração com Zoho CRM - leads, contatos e potenciais',
        icon: '📊',
        color: 'bg-purple-500',
        features: [
          'Gestão de leads',
          'Contatos e contas',
          'Potenciais de venda',
          'Campos personalizados',
          'Workflow rules',
          'Analytics'
        ],
        documentation: 'https://www.zoho.com/crm/developer/docs/',
        authType: 'oauth',
        defaultSettings: {
          syncContacts: true,
          syncDeals: false,
          syncCompanies: true,
          syncActivities: true,
          autoCreateLeads: true,
          updateExistingContacts: true,
          duplicateHandling: 'update',
          leadSource: 'Online Quiz'
        },
        defaultFieldMapping: {
          'email': 'Email',
          'firstName': 'First_Name',
          'lastName': 'Last_Name',
          'phone': 'Phone',
          'company': 'Account_Name',
          'quizScore': 'Quiz_Score',
          'quizResult': 'Quiz_Result'
        },
        webhookSupport: false,
        realTimeSync: false
      },
      {
        id: 'freshsales_crm',
        name: 'Freshsales',
        type: 'freshsales',
        description: 'Integração com Freshsales CRM - contatos, contas e deals',
        icon: '🌱',
        color: 'bg-teal-500',
        features: [
          'Contatos automáticos',
          'Contas empresariais',
          'Pipeline de deals',
          'Atividades e tarefas',
          'Custom fields',
          'Freddy AI'
        ],
        documentation: 'https://developers.freshworks.com/crm/api/',
        authType: 'api_key',
        defaultSettings: {
          syncContacts: true,
          syncDeals: true,
          syncCompanies: true,
          syncActivities: true,
          autoCreateLeads: true,
          updateExistingContacts: true,
          duplicateHandling: 'update',
          leadSource: 'Quiz Form'
        },
        defaultFieldMapping: {
          'email': 'email',
          'firstName': 'first_name',
          'lastName': 'last_name',
          'phone': 'mobile_number',
          'company': 'account_name',
          'quizScore': 'cf_quiz_score',
          'quizResult': 'cf_quiz_result'
        },
        webhookSupport: true,
        realTimeSync: true
      },
      {
        id: 'custom_crm',
        name: 'CRM Personalizado',
        type: 'custom',
        description: 'Configure integração com qualquer CRM via API REST',
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
        documentation: 'https://docs.elevado.com/integrations/custom-crm',
        authType: 'api_key',
        defaultSettings: {
          syncContacts: true,
          syncDeals: false,
          syncCompanies: false,
          syncActivities: false,
          autoCreateLeads: true,
          updateExistingContacts: false,
          duplicateHandling: 'create_new',
          leadSource: 'Quiz'
        },
        defaultFieldMapping: {
          'email': 'email',
          'name': 'name',
          'phone': 'phone',
          'company': 'company'
        },
        webhookSupport: false,
        realTimeSync: false
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadConnections = () => {
    const saved = localStorage.getItem(`crm_connections_${quiz.id}`);
    if (saved) {
      try {
        setConnections(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar conexões CRM:', error);
      }
    }
  };

  const saveConnections = (newConnections: CRMConnection[]) => {
    localStorage.setItem(`crm_connections_${quiz.id}`, JSON.stringify(newConnections));
    setConnections(newConnections);
  };

  const loadLogs = () => {
    const saved = localStorage.getItem(`crm_logs_${quiz.id}`);
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar logs CRM:', error);
      }
    }
  };

  const saveLogs = (newLogs: SyncLog[]) => {
    localStorage.setItem(`crm_logs_${quiz.id}`, JSON.stringify(newLogs));
    setLogs(newLogs);
  };

  const addConnection = () => {
    if (!newConnection.name || !newConnection.type) return;

    const connection: CRMConnection = {
      id: `crm_${Date.now()}`,
      name: newConnection.name,
      type: newConnection.type,
      status: 'disconnected',
      settings: newConnection.settings || {
        syncContacts: true,
        syncDeals: false,
        syncCompanies: false,
        syncActivities: true,
        autoCreateLeads: true,
        updateExistingContacts: true,
        duplicateHandling: 'update',
        leadSource: 'Elevado Quiz',
        customFields: {}
      },
      fieldMapping: newConnection.fieldMapping || {},
      totalSynced: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      createdAt: new Date().toISOString()
    };

    const template = templates.find(t => t.type === newConnection.type);
    if (template) {
      connection.fieldMapping = { ...template.defaultFieldMapping };
      connection.settings = { ...template.defaultSettings, ...connection.settings };
    }

    saveConnections([...connections, connection]);
    
    setNewConnection({
      name: '',
      type: 'hubspot',
      status: 'disconnected',
      settings: {
        syncContacts: true,
        syncDeals: false,
        syncCompanies: false,
        syncActivities: true,
        autoCreateLeads: true,
        updateExistingContacts: true,
        duplicateHandling: 'update',
        leadSource: 'Elevado Quiz',
        customFields: {}
      },
      fieldMapping: {}
    });
    setShowAddConnection(false);
  };

  const updateConnection = (connectionId: string, updates: Partial<CRMConnection>) => {
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
      
      const success = Math.random() > 0.2; // 80% de sucesso
      
      if (success) {
        updateConnection(connectionId, { status: 'connected' });
        
        // Adicionar log de sucesso
        const testLog: SyncLog = {
          id: `test_${Date.now()}`,
          crmId: connection.id,
          crmName: connection.name,
          operation: 'create_contact',
          status: 'success',
          recordId: `test_${Date.now()}`,
          data: {
            email: 'test@example.com',
            name: 'Test Contact',
            source: 'Connection Test'
          },
          executedAt: new Date().toISOString(),
          responseTime: 245
        };
        
        saveLogs([testLog, ...logs]);
      } else {
        updateConnection(connectionId, { status: 'error' });
        
        // Adicionar log de erro
        const errorLog: SyncLog = {
          id: `error_${Date.now()}`,
          crmId: connection.id,
          crmName: connection.name,
          operation: 'create_contact',
          status: 'failed',
          errorMessage: 'Authentication failed - Invalid API key',
          data: {
            email: 'test@example.com',
            name: 'Test Contact'
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

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setNewConnection({
      name: template.name,
      type: template.type,
      status: 'disconnected',
      settings: { ...template.defaultSettings },
      fieldMapping: { ...template.defaultFieldMapping }
    });
    setShowAddConnection(true);
  };

  const exportConnections = () => {
    const config = {
      connections: connections.map(conn => ({
        ...conn,
        apiKey: undefined, // Remove sensitive data
        accessToken: undefined,
        refreshToken: undefined
      })),
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-integrations-${quiz.name || 'quiz'}-${Date.now()}.json`;
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
            id: `crm_${Date.now()}_${Math.random()}`,
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

  const getStatusIcon = (status: CRMConnection['status']) => {
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

  const getOperationIcon = (operation: SyncLog['operation']) => {
    switch (operation) {
      case 'create_contact':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'update_contact':
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case 'create_deal':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'create_activity':
        return <Activity className="w-4 h-4 text-purple-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const stats = {
    totalConnections: connections.length,
    activeConnections: connections.filter(c => c.status === 'connected').length,
    totalSynced: connections.reduce((sum, c) => sum + c.totalSynced, 0),
    successfulSyncs: connections.reduce((sum, c) => sum + c.successfulSyncs, 0),
    failedSyncs: connections.reduce((sum, c) => sum + c.failedSyncs, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Integração com CRMs
          </h3>
          <p className="text-muted-foreground">
            Conecte seus quizzes com os principais CRMs do mercado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importConnections}
            className="hidden"
            id="import-crm"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-crm')?.click()}>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
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
              <Target className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Sincronizados</p>
                <p className="text-2xl font-bold">{stats.totalSynced}</p>
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
                <p className="text-2xl font-bold">{stats.successfulSyncs}</p>
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
                <p className="text-2xl font-bold">{stats.failedSyncs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {showAddConnection && (
            <Card>
              <CardHeader>
                <CardTitle>Nova Conexão CRM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Conexão</Label>
                    <Input
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                      placeholder="Ex: HubSpot Principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de CRM</Label>
                    <Select
                      value={newConnection.type}
                      onValueChange={(type: CRMConnection['type']) => setNewConnection({ ...newConnection, type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hubspot">HubSpot</SelectItem>
                        <SelectItem value="salesforce">Salesforce</SelectItem>
                        <SelectItem value="pipedrive">Pipedrive</SelectItem>
                        <SelectItem value="zoho">Zoho CRM</SelectItem>
                        <SelectItem value="freshsales">Freshsales</SelectItem>
                        <SelectItem value="custom">CRM Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Configurações de Sincronização</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Sincronizar Contatos</Label>
                      <Switch
                        checked={newConnection.settings?.syncContacts}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, syncContacts: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Sincronizar Deals</Label>
                      <Switch
                        checked={newConnection.settings?.syncDeals}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, syncDeals: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Criar Leads Automaticamente</Label>
                      <Switch
                        checked={newConnection.settings?.autoCreateLeads}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, autoCreateLeads: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Atualizar Contatos Existentes</Label>
                      <Switch
                        checked={newConnection.settings?.updateExistingContacts}
                        onCheckedChange={(checked) => setNewConnection({
                          ...newConnection,
                          settings: { ...newConnection.settings!, updateExistingContacts: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fonte dos Leads</Label>
                  <Input
                    value={newConnection.settings?.leadSource}
                    onChange={(e) => setNewConnection({
                      ...newConnection,
                      settings: { ...newConnection.settings!, leadSource: e.target.value }
                    })}
                    placeholder="Ex: Quiz Elevado"
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
                      {connection.totalSynced} sincronizados
                    </Badge>
                    <Badge variant="outline">
                      {connection.successfulSyncs} sucessos
                    </Badge>
                    {connection.failedSyncs > 0 && (
                      <Badge variant="destructive">
                        {connection.failedSyncs} falhas
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h5 className="font-medium">Configurações Ativas:</h5>
                      <div className="space-y-1">
                        {connection.settings.syncContacts && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>Contatos</span>
                          </div>
                        )}
                        {connection.settings.syncDeals && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            <span>Deals</span>
                          </div>
                        )}
                        {connection.settings.syncActivities && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            <span>Atividades</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium">Última Sincronização:</h5>
                      <p className="text-muted-foreground">
                        {connection.lastSync 
                          ? new Date(connection.lastSync).toLocaleString()
                          : 'Nunca sincronizado'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {connections.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhuma conexão configurada</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure conexões com CRMs para sincronizar automaticamente seus leads
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
                    {template.realTimeSync && (
                      <Badge variant="outline">Tempo Real</Badge>
                    )}
                    {template.webhookSupport && (
                      <Badge variant="outline">Webhooks</Badge>
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
            <h4 className="text-lg font-semibold">Logs de Sincronização</h4>
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
                        <p className="font-medium">{log.crmName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{log.operation.replace('_', ' ')}</span>
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

                  {log.recordId && log.status === 'success' && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <strong>Registro criado:</strong> {log.recordId}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {logs.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhum log encontrado</h4>
                  <p className="text-muted-foreground">
                    Os logs de sincronização aparecerão aqui quando as integrações forem executadas
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
                    <Label>Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar automaticamente quando um quiz for completado
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Retry Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Tentar novamente em caso de falha
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

export default CRMIntegrationManager;