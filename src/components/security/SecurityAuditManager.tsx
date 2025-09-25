import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Eye, Lock, User, Activity, Clock, Filter, Download, Search, RefreshCw, Settings, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { toast } from 'sonner';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'data_access' | 'data_modification' | 'permission_change' | 'suspicious_activity' | 'api_access' | 'export' | 'backup' | 'restore';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  resource?: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'rate_limit' | 'geo_block' | 'suspicious_pattern' | 'data_access' | 'permission_escalation';
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
    value: any;
  }[];
  actions: {
    type: 'block' | 'alert' | 'log' | 'notify';
    parameters?: Record<string, any>;
  }[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  activeThreats: number;
  failedLogins: number;
  suspiciousActivities: number;
  dataAccesses: number;
  apiCalls: number;
}

export interface SecurityAuditManagerProps {
  userId?: string;
}

const eventTypeLabels = {
  login: 'Login',
  logout: 'Logout',
  failed_login: 'Login Falhado',
  password_change: 'Alteração de Senha',
  data_access: 'Acesso a Dados',
  data_modification: 'Modificação de Dados',
  permission_change: 'Alteração de Permissões',
  suspicious_activity: 'Atividade Suspeita',
  api_access: 'Acesso à API',
  export: 'Exportação',
  backup: 'Backup',
  restore: 'Restauração'
};

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const severityIcons = {
  low: Info,
  medium: AlertCircle,
  high: AlertTriangle,
  critical: XCircle
};

export const SecurityAuditManager: React.FC<SecurityAuditManagerProps> = ({ userId }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedRule, setSelectedRule] = useState<SecurityRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Inicializar dados simulados
  useEffect(() => {
    const simulatedEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'suspicious_activity',
        severity: 'high',
        userId: 'user123',
        userEmail: 'usuario@exemplo.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'São Paulo, BR',
        resource: '/api/quiz/export',
        action: 'Múltiplas tentativas de exportação',
        details: 'Usuário tentou exportar dados 15 vezes em 2 minutos',
        metadata: { attempts: 15, timeWindow: 120 },
        resolved: false
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'failed_login',
        severity: 'medium',
        userEmail: 'admin@exemplo.com',
        ipAddress: '203.0.113.45',
        userAgent: 'curl/7.68.0',
        location: 'Unknown',
        action: 'Tentativa de login falhada',
        details: 'Credenciais inválidas fornecidas',
        metadata: { reason: 'invalid_credentials' },
        resolved: false
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'login',
        severity: 'low',
        userId: 'user456',
        userEmail: 'usuario2@exemplo.com',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        location: 'Rio de Janeiro, BR',
        action: 'Login bem-sucedido',
        details: 'Usuário fez login no sistema',
        resolved: true,
        resolvedBy: 'system',
        resolvedAt: new Date(Date.now() - 25 * 60 * 1000)
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        type: 'data_modification',
        severity: 'medium',
        userId: 'user123',
        userEmail: 'usuario@exemplo.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'São Paulo, BR',
        resource: '/api/quiz/123',
        action: 'Modificação de quiz',
        details: 'Quiz "Pesquisa de Satisfação" foi modificado',
        metadata: { quizId: '123', changes: ['title', 'questions'] },
        resolved: true,
        resolvedBy: 'admin',
        resolvedAt: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'permission_change',
        severity: 'high',
        userId: 'admin',
        userEmail: 'admin@exemplo.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'São Paulo, BR',
        resource: '/admin/users/user123',
        action: 'Alteração de permissões',
        details: 'Permissões de administrador concedidas ao usuário',
        metadata: { targetUser: 'user123', newRole: 'admin' },
        resolved: false
      }
    ];

    const simulatedRules: SecurityRule[] = [
      {
        id: '1',
        name: 'Limite de Tentativas de Login',
        description: 'Bloqueia IPs após 5 tentativas de login falhadas em 10 minutos',
        enabled: true,
        type: 'rate_limit',
        conditions: [
          { field: 'type', operator: 'equals', value: 'failed_login' },
          { field: 'count', operator: 'greater_than', value: 5 },
          { field: 'timeWindow', operator: 'less_than', value: 600 }
        ],
        actions: [
          { type: 'block', parameters: { duration: 3600 } },
          { type: 'alert', parameters: { severity: 'high' } }
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 15 * 60 * 1000),
        triggerCount: 12
      },
      {
        id: '2',
        name: 'Acesso Geográfico Suspeito',
        description: 'Alerta para logins de países não autorizados',
        enabled: true,
        type: 'geo_block',
        conditions: [
          { field: 'type', operator: 'equals', value: 'login' },
          { field: 'country', operator: 'equals', value: 'CN' }
        ],
        actions: [
          { type: 'alert', parameters: { severity: 'medium' } },
          { type: 'log', parameters: { level: 'warning' } }
        ],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        triggerCount: 3
      },
      {
        id: '3',
        name: 'Exportação Excessiva',
        description: 'Detecta tentativas excessivas de exportação de dados',
        enabled: true,
        type: 'suspicious_pattern',
        conditions: [
          { field: 'type', operator: 'equals', value: 'export' },
          { field: 'count', operator: 'greater_than', value: 10 },
          { field: 'timeWindow', operator: 'less_than', value: 300 }
        ],
        actions: [
          { type: 'alert', parameters: { severity: 'high' } },
          { type: 'notify', parameters: { channels: ['email', 'slack'] } }
        ],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 5 * 60 * 1000),
        triggerCount: 1
      }
    ];

    setEvents(simulatedEvents);
    setRules(simulatedRules);
    setFilteredEvents(simulatedEvents);
  }, []);

  // Filtrar eventos
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ipAddress.includes(searchTerm)
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    if (dateRange) {
      filtered = filtered.filter(event =>
        event.timestamp >= dateRange.from && event.timestamp <= dateRange.to
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, severityFilter, typeFilter, dateRange]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simular novos eventos
      if (Math.random() > 0.7) {
        const newEvent: SecurityEvent = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: ['login', 'data_access', 'api_access'][Math.floor(Math.random() * 3)] as any,
          severity: ['low', 'medium'][Math.floor(Math.random() * 2)] as any,
          userId: `user${Math.floor(Math.random() * 1000)}`,
          userEmail: `user${Math.floor(Math.random() * 1000)}@exemplo.com`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'São Paulo, BR',
          action: 'Atividade automática',
          details: 'Evento gerado automaticamente para demonstração',
          resolved: false
        };
        setEvents(prev => [newEvent, ...prev]);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Resolver evento
  const resolveEvent = (eventId: string, notes?: string) => {
    setEvents(events.map(event =>
      event.id === eventId
        ? {
            ...event,
            resolved: true,
            resolvedBy: 'admin',
            resolvedAt: new Date(),
            notes
          }
        : event
    ));
    toast.success('Evento resolvido');
  };

  // Criar regra
  const createRule = () => {
    const newRule: SecurityRule = {
      id: Date.now().toString(),
      name: 'Nova Regra',
      description: 'Descrição da regra',
      enabled: true,
      type: 'suspicious_pattern',
      conditions: [],
      actions: [],
      createdAt: new Date(),
      triggerCount: 0
    };
    setSelectedRule(newRule);
    setIsCreatingRule(true);
  };

  // Salvar regra
  const saveRule = (rule: SecurityRule) => {
    if (rules.find(r => r.id === rule.id)) {
      setRules(rules.map(r => r.id === rule.id ? rule : r));
    } else {
      setRules([...rules, rule]);
    }
    setIsCreatingRule(false);
    setSelectedRule(null);
    toast.success('Regra salva');
  };

  // Excluir regra
  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast.success('Regra excluída');
  };

  // Exportar logs
  const exportLogs = () => {
    const data = filteredEvents.map(event => ({
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      severity: event.severity,
      user: event.userEmail,
      ip: event.ipAddress,
      action: event.action,
      details: event.details,
      resolved: event.resolved
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Logs exportados');
  };

  // Calcular métricas
  const metrics: SecurityMetrics = {
    totalEvents: events.length,
    criticalEvents: events.filter(e => e.severity === 'critical').length,
    resolvedEvents: events.filter(e => e.resolved).length,
    activeThreats: events.filter(e => !e.resolved && ['high', 'critical'].includes(e.severity)).length,
    failedLogins: events.filter(e => e.type === 'failed_login').length,
    suspiciousActivities: events.filter(e => e.type === 'suspicious_activity').length,
    dataAccesses: events.filter(e => e.type === 'data_access').length,
    apiCalls: events.filter(e => e.type === 'api_access').length
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auditoria de Segurança</h2>
          <p className="text-gray-600">Monitore atividades e eventos de segurança</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Logs
          </Button>
          <Button onClick={createRule}>
            <Shield className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Eventos</p>
                <p className="text-2xl font-bold">{metrics.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Críticos</p>
                <p className="text-2xl font-bold">{metrics.criticalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Resolvidos</p>
                <p className="text-2xl font-bold">{metrics.resolvedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Ameaças Ativas</p>
                <p className="text-2xl font-bold">{metrics.activeThreats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Logins Falhados</p>
                <p className="text-2xl font-bold">{metrics.failedLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Ativ. Suspeitas</p>
                <p className="text-2xl font-bold">{metrics.suspiciousActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Acessos a Dados</p>
                <p className="text-2xl font-bold">{metrics.dataAccesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">Chamadas API</p>
                <p className="text-2xl font-bold">{metrics.apiCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos de Segurança</TabsTrigger>
          <TabsTrigger value="rules">Regras de Segurança</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Eventos de Segurança */}
        <TabsContent value="events" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(eventTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label>Auto-refresh</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Eventos */}
          <div className="space-y-2">
            {filteredEvents.map((event) => {
              const SeverityIcon = severityIcons[event.severity];
              return (
                <Card key={event.id} className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !event.resolved ? 'border-l-4 border-l-orange-500' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <SeverityIcon className="w-4 h-4" />
                          <Badge className={severityColors[event.severity]}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {eventTypeLabels[event.type]}
                          </Badge>
                          {!event.resolved && (
                            <Badge variant="destructive">Não Resolvido</Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {event.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-medium mb-1">{event.action}</h3>
                        <p className="text-sm text-gray-600 mb-2">{event.details}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {event.userEmail && (
                            <span>
                              <User className="w-3 h-3 inline mr-1" />
                              {event.userEmail}
                            </span>
                          )}
                          <span>IP: {event.ipAddress}</span>
                          {event.location && <span>Local: {event.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!event.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveEvent(event.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Regras de Segurança */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Badge variant="outline">{rule.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Criada: {rule.createdAt.toLocaleDateString()}</span>
                        <span>Acionada: {rule.triggerCount} vezes</span>
                        {rule.lastTriggered && (
                          <span>Último: {rule.lastTriggered.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => {
                          setRules(rules.map(r => 
                            r.id === rule.id ? { ...r, enabled } : r
                          ));
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsCreatingRule(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries({
                    critical: events.filter(e => e.severity === 'critical').length,
                    high: events.filter(e => e.severity === 'high').length,
                    medium: events.filter(e => e.severity === 'medium').length,
                    low: events.filter(e => e.severity === 'low').length
                  }).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="capitalize">{severity}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-20 h-2 rounded ${
                          severity === 'critical' ? 'bg-red-500' :
                          severity === 'high' ? 'bg-orange-500' :
                          severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(eventTypeLabels).map(([type, label]) => {
                    const count = events.filter(e => e.type === type).length;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span>{label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-blue-500 rounded" />
                          <span className="font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IPs Mais Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    events.reduce((acc, event) => {
                      acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([ip, count]) => (
                      <div key={ip} className="flex items-center justify-between">
                        <span className="font-mono text-sm">{ip}</span>
                        <Badge>{count} eventos</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuários Mais Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    events
                      .filter(e => e.userEmail)
                      .reduce((acc, event) => {
                        acc[event.userEmail!] = (acc[event.userEmail!] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([email, count]) => (
                      <div key={email} className="flex items-center justify-between">
                        <span className="text-sm">{email}</span>
                        <Badge>{count} eventos</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Auditoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Logging Detalhado</Label>
                    <p className="text-sm text-gray-600">Registrar informações detalhadas dos eventos</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações em Tempo Real</Label>
                    <p className="text-sm text-gray-600">Receber alertas imediatos para eventos críticos</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Retenção de Logs</Label>
                    <p className="text-sm text-gray-600">Manter logs por período determinado</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Análise Comportamental</Label>
                    <p className="text-sm text-gray-600">Detectar padrões anômalos automaticamente</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Período de Retenção (dias)</Label>
                  <Input type="number" defaultValue="90" className="mt-1" />
                </div>

                <div>
                  <Label>Limite de Eventos por Hora</Label>
                  <Input type="number" defaultValue="1000" className="mt-1" />
                </div>

                <div>
                  <Label>Email para Alertas</Label>
                  <Input type="email" defaultValue="admin@exemplo.com" className="mt-1" />
                </div>
              </div>

              <Button>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento de Segurança</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{selectedEvent.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p className="text-sm">{eventTypeLabels[selectedEvent.type]}</p>
                </div>
                <div>
                  <Label>Severidade</Label>
                  <Badge className={severityColors[selectedEvent.severity]}>
                    {selectedEvent.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedEvent.resolved ? 'default' : 'destructive'}>
                    {selectedEvent.resolved ? 'Resolvido' : 'Pendente'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Ação</Label>
                <p className="text-sm">{selectedEvent.action}</p>
              </div>

              <div>
                <Label>Detalhes</Label>
                <p className="text-sm">{selectedEvent.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usuário</Label>
                  <p className="text-sm">{selectedEvent.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <Label>Endereço IP</Label>
                  <p className="text-sm font-mono">{selectedEvent.ipAddress}</p>
                </div>
                <div>
                  <Label>Localização</Label>
                  <p className="text-sm">{selectedEvent.location || 'N/A'}</p>
                </div>
                <div>
                  <Label>Recurso</Label>
                  <p className="text-sm font-mono">{selectedEvent.resource || 'N/A'}</p>
                </div>
              </div>

              {selectedEvent.metadata && (
                <div>
                  <Label>Metadados</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEvent.resolved && (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Resolvido por:</strong> {selectedEvent.resolvedBy} em {selectedEvent.resolvedAt?.toLocaleString()}
                  </p>
                  {selectedEvent.notes && (
                    <p className="text-sm text-green-700 mt-1">
                      <strong>Notas:</strong> {selectedEvent.notes}
                    </p>
                  )}
                </div>
              )}

              {!selectedEvent.resolved && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      resolveEvent(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                    className="flex-1"
                  >
                    Marcar como Resolvido
                  </Button>
                  <Button variant="outline">
                    Adicionar Notas
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Regra */}
      <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule?.id && rules.find(r => r.id === selectedRule.id) ? 'Editar Regra' : 'Nova Regra de Segurança'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={selectedRule.name}
                    onChange={(e) => setSelectedRule({
                      ...selectedRule,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={selectedRule.type}
                    onValueChange={(value: any) => setSelectedRule({
                      ...selectedRule,
                      type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rate_limit">Limite de Taxa</SelectItem>
                      <SelectItem value="geo_block">Bloqueio Geográfico</SelectItem>
                      <SelectItem value="suspicious_pattern">Padrão Suspeito</SelectItem>
                      <SelectItem value="data_access">Acesso a Dados</SelectItem>
                      <SelectItem value="permission_escalation">Escalação de Permissões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={selectedRule.description}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rule-enabled"
                  checked={selectedRule.enabled}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    enabled: e.target.checked
                  })}
                />
                <Label htmlFor="rule-enabled">Regra ativa</Label>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => saveRule(selectedRule)}
                  className="flex-1"
                >
                  Salvar Regra
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingRule(false);
                    setSelectedRule(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityAuditManager;