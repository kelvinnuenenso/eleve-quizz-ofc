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
  Globe, 
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
  Shield,
  Lock,
  Unlock,
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
  Network
} from 'lucide-react';
import type { Quiz } from '@/types/quiz';

interface CustomDomainManagerProps {
  quiz?: Quiz;
  onQuizUpdate?: (quiz: Quiz) => void;
}

interface CustomDomain {
  id: string;
  domain: string;
  subdomain?: string;
  fullDomain: string;
  status: 'pending' | 'verifying' | 'active' | 'error' | 'suspended';
  sslStatus: 'pending' | 'active' | 'error' | 'expired';
  verificationMethod: 'dns' | 'file' | 'cname';
  verificationRecords: DNSRecord[];
  settings: DomainSettings;
  analytics: DomainAnalytics;
  createdAt: Date;
  lastChecked?: Date;
  expiresAt?: Date;
}

interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  verified: boolean;
}

interface DomainSettings {
  redirectWww: boolean;
  forceHttps: boolean;
  customHeaders: Record<string, string>;
  caching: {
    enabled: boolean;
    ttl: number;
    rules: CacheRule[];
  };
  security: {
    hsts: boolean;
    csp: boolean;
    xssProtection: boolean;
    frameOptions: string;
  };
  seo: {
    customTitle?: string;
    customDescription?: string;
    customKeywords?: string;
    ogImage?: string;
    favicon?: string;
  };
}

interface CacheRule {
  id: string;
  path: string;
  ttl: number;
  enabled: boolean;
}

interface DomainAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; visits: number }>;
  topReferrers: Array<{ domain: string; visits: number }>;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  performanceMetrics: {
    loadTime: number;
    ttfb: number;
    fcp: number;
    lcp: number;
  };
}

interface DomainTemplate {
  id: string;
  name: string;
  description: string;
  domain: string;
  settings: Partial<DomainSettings>;
  dnsRecords: Omit<DNSRecord, 'verified'>[];
}

export function CustomDomainManager({ quiz, onQuizUpdate }: CustomDomainManagerProps) {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [templates, setTemplates] = useState<DomainTemplate[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('domains');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({
    domain: '',
    subdomain: '',
    verificationMethod: 'dns' as const
  });

  useEffect(() => {
    initializeTemplates();
    loadExistingDomains();
  }, []);

  const initializeTemplates = () => {
    const defaultTemplates: DomainTemplate[] = [
      {
        id: 'standard_quiz',
        name: 'Quiz Padrão',
        description: 'Configuração padrão para domínios de quiz',
        domain: 'quiz.seudominio.com',
        settings: {
          redirectWww: true,
          forceHttps: true,
          caching: {
            enabled: true,
            ttl: 3600,
            rules: [
              { id: '1', path: '/static/*', ttl: 86400, enabled: true },
              { id: '2', path: '/api/*', ttl: 300, enabled: true }
            ]
          },
          security: {
            hsts: true,
            csp: true,
            xssProtection: true,
            frameOptions: 'SAMEORIGIN'
          }
        },
        dnsRecords: [
          { type: 'CNAME', name: 'quiz', value: 'quiz-platform.vercel.app', ttl: 300 },
          { type: 'TXT', name: '_verification', value: 'quiz-platform-verification=abc123', ttl: 300 }
        ]
      },
      {
        id: 'landing_page',
        name: 'Landing Page',
        description: 'Configuração otimizada para landing pages',
        domain: 'lp.seudominio.com',
        settings: {
          redirectWww: false,
          forceHttps: true,
          caching: {
            enabled: true,
            ttl: 7200,
            rules: [
              { id: '1', path: '/', ttl: 1800, enabled: true },
              { id: '2', path: '/images/*', ttl: 604800, enabled: true }
            ]
          },
          security: {
            hsts: true,
            csp: false,
            xssProtection: true,
            frameOptions: 'DENY'
          },
          seo: {
            customTitle: 'Quiz Interativo - {{quiz_title}}',
            customDescription: 'Descubra mais sobre você com nosso quiz interativo',
            ogImage: '/og-image.jpg'
          }
        },
        dnsRecords: [
          { type: 'A', name: 'lp', value: '76.76.19.61', ttl: 300 },
          { type: 'TXT', name: '_verification', value: 'quiz-platform-verification=def456', ttl: 300 }
        ]
      },
      {
        id: 'subdomain_wildcard',
        name: 'Subdomínio Wildcard',
        description: 'Configuração para múltiplos subdomínios',
        domain: '*.quizzes.seudominio.com',
        settings: {
          redirectWww: false,
          forceHttps: true,
          caching: {
            enabled: true,
            ttl: 3600,
            rules: [
              { id: '1', path: '/quiz/*', ttl: 1800, enabled: true },
              { id: '2', path: '/assets/*', ttl: 86400, enabled: true }
            ]
          },
          security: {
            hsts: true,
            csp: true,
            xssProtection: true,
            frameOptions: 'SAMEORIGIN'
          }
        },
        dnsRecords: [
          { type: 'CNAME', name: '*', value: 'quiz-platform.vercel.app', ttl: 300 },
          { type: 'TXT', name: '_verification', value: 'quiz-platform-verification=ghi789', ttl: 300 }
        ]
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadExistingDomains = () => {
    // Carregar domínios existentes do localStorage ou API
    const savedDomains = localStorage.getItem('custom_domains');
    if (savedDomains) {
      try {
        const domains = JSON.parse(savedDomains);
        setDomains(domains.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          lastChecked: d.lastChecked ? new Date(d.lastChecked) : undefined,
          expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined
        })));
      } catch (error) {
        console.error('Erro ao carregar domínios:', error);
      }
    }
  };

  const addDomain = () => {
    if (!newDomain.domain) return;

    const fullDomain = newDomain.subdomain 
      ? `${newDomain.subdomain}.${newDomain.domain}`
      : newDomain.domain;

    const domain: CustomDomain = {
      id: `domain_${Date.now()}`,
      domain: newDomain.domain,
      subdomain: newDomain.subdomain,
      fullDomain,
      status: 'pending',
      sslStatus: 'pending',
      verificationMethod: newDomain.verificationMethod,
      verificationRecords: generateVerificationRecords(fullDomain, newDomain.verificationMethod),
      settings: {
        redirectWww: true,
        forceHttps: true,
        customHeaders: {},
        caching: {
          enabled: true,
          ttl: 3600,
          rules: []
        },
        security: {
          hsts: true,
          csp: true,
          xssProtection: true,
          frameOptions: 'SAMEORIGIN'
        },
        seo: {}
      },
      analytics: {
        totalVisits: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        topPages: [],
        topReferrers: [],
        deviceBreakdown: {},
        locationBreakdown: {},
        performanceMetrics: {
          loadTime: 0,
          ttfb: 0,
          fcp: 0,
          lcp: 0
        }
      },
      createdAt: new Date()
    };

    setDomains([...domains, domain]);
    setNewDomain({ domain: '', subdomain: '', verificationMethod: 'dns' });
    setShowAddDomain(false);
  };

  const generateVerificationRecords = (domain: string, method: 'dns' | 'file' | 'cname'): DNSRecord[] => {
    const records: DNSRecord[] = [];

    switch (method) {
      case 'dns':
        records.push({
          type: 'TXT',
          name: '_verification',
          value: `quiz-platform-verification=${Math.random().toString(36).substring(2, 15)}`,
          ttl: 300,
          verified: false
        });
        break;

      case 'cname':
        records.push({
          type: 'CNAME',
          name: domain.includes('.') ? domain.split('.')[0] : '@',
          value: 'quiz-platform.vercel.app',
          ttl: 300,
          verified: false
        });
        break;

      case 'file':
        // Para verificação por arquivo, não precisamos de registros DNS
        break;
    }

    return records;
  };

  const verifyDomain = async (domainId: string) => {
    setIsVerifying(true);
    
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    // Simular verificação
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% de sucesso simulado
      
      updateDomain(domainId, {
        status: success ? 'active' : 'error',
        sslStatus: success ? 'active' : 'error',
        lastChecked: new Date(),
        verificationRecords: domain.verificationRecords.map(record => ({
          ...record,
          verified: success
        }))
      });

      setIsVerifying(false);
    }, 3000);
  };

  const updateDomain = (domainId: string, updates: Partial<CustomDomain>) => {
    setDomains(domains => 
      domains.map(domain => 
        domain.id === domainId ? { ...domain, ...updates } : domain
      )
    );
  };

  const deleteDomain = (domainId: string) => {
    setDomains(domains => domains.filter(domain => domain.id !== domainId));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const domain: CustomDomain = {
      id: `domain_${Date.now()}`,
      domain: template.domain,
      fullDomain: template.domain,
      status: 'pending',
      sslStatus: 'pending',
      verificationMethod: 'dns',
      verificationRecords: template.dnsRecords.map(record => ({
        ...record,
        verified: false
      })),
      settings: {
        redirectWww: true,
        forceHttps: true,
        customHeaders: {},
        caching: {
          enabled: true,
          ttl: 3600,
          rules: []
        },
        security: {
          hsts: true,
          csp: true,
          xssProtection: true,
          frameOptions: 'SAMEORIGIN'
        },
        seo: {},
        ...template.settings
      },
      analytics: {
        totalVisits: Math.floor(Math.random() * 10000),
        uniqueVisitors: Math.floor(Math.random() * 5000),
        pageViews: Math.floor(Math.random() * 15000),
        bounceRate: Math.random() * 100,
        avgSessionDuration: Math.random() * 300,
        topPages: [
          { path: '/', visits: Math.floor(Math.random() * 1000) },
          { path: '/quiz/start', visits: Math.floor(Math.random() * 800) },
          { path: '/results', visits: Math.floor(Math.random() * 600) }
        ],
        topReferrers: [
          { domain: 'google.com', visits: Math.floor(Math.random() * 500) },
          { domain: 'facebook.com', visits: Math.floor(Math.random() * 300) },
          { domain: 'instagram.com', visits: Math.floor(Math.random() * 200) }
        ],
        deviceBreakdown: {
          desktop: Math.floor(Math.random() * 60) + 20,
          mobile: Math.floor(Math.random() * 60) + 20,
          tablet: Math.floor(Math.random() * 20) + 5
        },
        locationBreakdown: {
          'Brasil': Math.floor(Math.random() * 70) + 20,
          'Estados Unidos': Math.floor(Math.random() * 20) + 5,
          'Portugal': Math.floor(Math.random() * 15) + 3
        },
        performanceMetrics: {
          loadTime: Math.random() * 3000 + 500,
          ttfb: Math.random() * 500 + 100,
          fcp: Math.random() * 2000 + 300,
          lcp: Math.random() * 3000 + 800
        }
      },
      createdAt: new Date()
    };

    setDomains([...domains, domain]);
  };

  const saveDomains = () => {
    localStorage.setItem('custom_domains', JSON.stringify(domains));
    
    if (quiz && onQuizUpdate) {
      const updatedQuiz = {
        ...quiz,
        settings: {
          ...quiz.settings,
          customDomain: domains.find(d => d.status === 'active')?.fullDomain
        }
      };

      onQuizUpdate(updatedQuiz);
    }
  };

  const exportDomains = () => {
    const config = {
      domains,
      templates: templates.filter(t => !['standard_quiz', 'landing_page', 'subdomain_wildcard'].includes(t.id)),
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-domains-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDomains = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.domains) {
          setDomains(config.domains.map((d: any) => ({
            ...d,
            createdAt: new Date(d.createdAt),
            lastChecked: d.lastChecked ? new Date(d.lastChecked) : undefined,
            expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined
          })));
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

  const getStatusIcon = (status: CustomDomain['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'verifying':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSSLIcon = (sslStatus: CustomDomain['sslStatus']) => {
    switch (sslStatus) {
      case 'active':
        return <Lock className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <Unlock className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Domínios Customizados
          </h3>
          <p className="text-muted-foreground">
            Configure domínios personalizados para seus quizzes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importDomains}
            className="hidden"
            id="import-domains"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-domains')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportDomains}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={saveDomains}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Domínios</p>
                <p className="text-2xl font-bold">{domains.length}</p>
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
                <p className="text-2xl font-bold">{domains.filter(d => d.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">SSL Ativo</p>
                <p className="text-2xl font-bold">{domains.filter(d => d.sslStatus === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Visitas Hoje</p>
                <p className="text-2xl font-bold">
                  {domains.reduce((sum, d) => sum + Math.floor(d.analytics.totalVisits / 30), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domains">Domínios</TabsTrigger>
          <TabsTrigger value="dns">DNS & SSL</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Seus Domínios</h4>
            <Button onClick={() => setShowAddDomain(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Domínio
            </Button>
          </div>

          {showAddDomain && (
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Domínio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domínio Principal</Label>
                    <Input
                      value={newDomain.domain}
                      onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                      placeholder="exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subdomínio (opcional)</Label>
                    <Input
                      value={newDomain.subdomain}
                      onChange={(e) => setNewDomain({ ...newDomain, subdomain: e.target.value })}
                      placeholder="quiz"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Método de Verificação</Label>
                  <Select
                    value={newDomain.verificationMethod}
                    onValueChange={(value: any) => setNewDomain({ ...newDomain, verificationMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dns">Registro DNS (TXT)</SelectItem>
                      <SelectItem value="cname">Registro CNAME</SelectItem>
                      <SelectItem value="file">Upload de Arquivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={addDomain}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDomain(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {domains.map(domain => (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(domain.status)}
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {domain.fullDomain}
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Status: <Badge variant={domain.status === 'active' ? 'default' : 'secondary'}>
                              {domain.status}
                            </Badge>
                          </span>
                          <span className="flex items-center gap-1">
                            {getSSLIcon(domain.sslStatus)}
                            SSL: {domain.sslStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyDomain(domain.id)}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Verificar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDomain(domain.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDomain(domain.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Analytics Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Visitas</p>
                      <p className="text-lg font-semibold">{domain.analytics.totalVisits.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Únicos</p>
                      <p className="text-lg font-semibold">{domain.analytics.uniqueVisitors.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Bounce Rate</p>
                      <p className="text-lg font-semibold">{domain.analytics.bounceRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Load Time</p>
                      <p className="text-lg font-semibold">{domain.analytics.performanceMetrics.loadTime.toFixed(0)}ms</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Settings */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={domain.settings.forceHttps}
                        onCheckedChange={(forceHttps) => updateDomain(domain.id, {
                          settings: { ...domain.settings, forceHttps }
                        })}
                      />
                      <Label>Force HTTPS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={domain.settings.redirectWww}
                        onCheckedChange={(redirectWww) => updateDomain(domain.id, {
                          settings: { ...domain.settings, redirectWww }
                        })}
                      />
                      <Label>Redirect WWW</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={domain.settings.caching.enabled}
                        onCheckedChange={(enabled) => updateDomain(domain.id, {
                          settings: {
                            ...domain.settings,
                            caching: { ...domain.settings.caching, enabled }
                          }
                        })}
                      />
                      <Label>Cache</Label>
                    </div>
                  </div>

                  {domain.status === 'pending' && domain.verificationRecords.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Verificação Pendente
                      </h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        Configure os seguintes registros DNS para verificar seu domínio:
                      </p>
                      <div className="space-y-2">
                        {domain.verificationRecords.map((record, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                            <div className="font-mono text-sm">
                              <span className="font-semibold">{record.type}</span> {record.name} → {record.value}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(record.value)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {domains.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhum domínio configurado</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure domínios personalizados para seus quizzes
                  </p>
                  <Button onClick={() => setShowAddDomain(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Domínio
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Templates Rápidos</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-mono">{template.domain}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{template.dnsRecords.length} registros DNS</span>
                        <span>•</span>
                        <span>SSL incluído</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Configuração DNS & SSL</h4>
          </div>

          {selectedDomain && domains.find(d => d.id === selectedDomain) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  DNS - {domains.find(d => d.id === selectedDomain)?.fullDomain}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-3">Registros DNS Necessários</h5>
                      <div className="space-y-2">
                        {domains.find(d => d.id === selectedDomain)?.verificationRecords.map((record, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{record.type}</Badge>
                              {record.verified ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div><strong>Nome:</strong> {record.name}</div>
                              <div><strong>Valor:</strong> <code className="bg-gray-100 px-1 rounded">{record.value}</code></div>
                              <div><strong>TTL:</strong> {record.ttl}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-3">Status SSL</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Certificado SSL</p>
                            <p className="text-sm text-muted-foreground">
                              {domains.find(d => d.id === selectedDomain)?.sslStatus === 'active' 
                                ? 'Ativo e válido' 
                                : 'Pendente ou inválido'}
                            </p>
                          </div>
                          {getSSLIcon(domains.find(d => d.id === selectedDomain)?.sslStatus || 'pending')}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Auto-renovação</p>
                            <p className="text-sm text-muted-foreground">
                              Certificado renovado automaticamente
                            </p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">HSTS</p>
                            <p className="text-sm text-muted-foreground">
                              HTTP Strict Transport Security
                            </p>
                          </div>
                          <Switch
                            checked={domains.find(d => d.id === selectedDomain)?.settings.security.hsts}
                            onCheckedChange={(hsts) => {
                              const domain = domains.find(d => d.id === selectedDomain);
                              if (domain) {
                                updateDomain(selectedDomain, {
                                  settings: {
                                    ...domain.settings,
                                    security: { ...domain.settings.security, hsts }
                                  }
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedDomain && (
            <Card>
              <CardContent className="text-center py-8">
                <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold mb-2">Selecione um domínio</h4>
                <p className="text-muted-foreground mb-4">
                  Escolha um domínio na aba anterior para configurar DNS e SSL
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Configurações Avançadas</h4>
          </div>

          {selectedDomain && domains.find(d => d.id === selectedDomain) && (
            <div className="space-y-6">
              {(() => {
                const domain = domains.find(d => d.id === selectedDomain)!;
                return (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Cache</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={domain.settings.caching.enabled}
                            onCheckedChange={(enabled) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                caching: { ...domain.settings.caching, enabled }
                              }
                            })}
                          />
                          <Label>Habilitar Cache</Label>
                        </div>

                        <div className="space-y-2">
                          <Label>TTL Padrão (segundos)</Label>
                          <Input
                            type="number"
                            value={domain.settings.caching.ttl}
                            onChange={(e) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                caching: { ...domain.settings.caching, ttl: parseInt(e.target.value) }
                              }
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Segurança</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={domain.settings.security.hsts}
                              onCheckedChange={(hsts) => updateDomain(selectedDomain, {
                                settings: {
                                  ...domain.settings,
                                  security: { ...domain.settings.security, hsts }
                                }
                              })}
                            />
                            <Label>HSTS</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={domain.settings.security.csp}
                              onCheckedChange={(csp) => updateDomain(selectedDomain, {
                                settings: {
                                  ...domain.settings,
                                  security: { ...domain.settings.security, csp }
                                }
                              })}
                            />
                            <Label>Content Security Policy</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={domain.settings.security.xssProtection}
                              onCheckedChange={(xssProtection) => updateDomain(selectedDomain, {
                                settings: {
                                  ...domain.settings,
                                  security: { ...domain.settings.security, xssProtection }
                                }
                              })}
                            />
                            <Label>XSS Protection</Label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>X-Frame-Options</Label>
                          <Select
                            value={domain.settings.security.frameOptions}
                            onValueChange={(frameOptions) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                security: { ...domain.settings.security, frameOptions }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DENY">DENY</SelectItem>
                              <SelectItem value="SAMEORIGIN">SAMEORIGIN</SelectItem>
                              <SelectItem value="ALLOW-FROM">ALLOW-FROM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>SEO & Meta Tags</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título Personalizado</Label>
                          <Input
                            value={domain.settings.seo.customTitle || ''}
                            onChange={(e) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                seo: { ...domain.settings.seo, customTitle: e.target.value }
                              }
                            })}
                            placeholder="{{quiz_title}} - Seu Site"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição Personalizada</Label>
                          <Textarea
                            value={domain.settings.seo.customDescription || ''}
                            onChange={(e) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                seo: { ...domain.settings.seo, customDescription: e.target.value }
                              }
                            })}
                            placeholder="Descrição para mecanismos de busca"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Palavras-chave</Label>
                          <Input
                            value={domain.settings.seo.customKeywords || ''}
                            onChange={(e) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                seo: { ...domain.settings.seo, customKeywords: e.target.value }
                              }
                            })}
                            placeholder="quiz, interativo, personalidade"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Imagem OG (URL)</Label>
                          <Input
                            value={domain.settings.seo.ogImage || ''}
                            onChange={(e) => updateDomain(selectedDomain, {
                              settings: {
                                ...domain.settings,
                                seo: { ...domain.settings.seo, ogImage: e.target.value }
                              }
                            })}
                            placeholder="https://exemplo.com/og-image.jpg"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}

          {!selectedDomain && (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold mb-2">Selecione um domínio</h4>
                <p className="text-muted-foreground mb-4">
                  Escolha um domínio na aba anterior para configurar suas opções
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Analytics de Domínios</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Domínio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {domains.map(domain => (
                    <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{domain.fullDomain}</p>
                        <p className="text-sm text-muted-foreground">
                          {domain.analytics.totalVisits.toLocaleString()} visitas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {domain.analytics.performanceMetrics.loadTime.toFixed(0)}ms
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Load Time
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {domains.map(domain => {
                    const totalVisits = domains.reduce((sum, d) => sum + d.analytics.totalVisits, 0);
                    const percentage = totalVisits > 0 ? (domain.analytics.totalVisits / totalVisits) * 100 : 0;
                    
                    return (
                      <div key={domain.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{domain.fullDomain}</span>
                          <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedDomain && domains.find(d => d.id === selectedDomain) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Analytics Detalhados - {domains.find(d => d.id === selectedDomain)?.fullDomain}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const domain = domains.find(d => d.id === selectedDomain)!;
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{domain.analytics.totalVisits.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Visitas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{domain.analytics.uniqueVisitors.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{domain.analytics.bounceRate.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Taxa de Rejeição</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{Math.floor(domain.analytics.avgSessionDuration)}s</p>
                          <p className="text-sm text-muted-foreground">Duração Média</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium mb-3">Páginas Mais Visitadas</h5>
                          <div className="space-y-2">
                            {domain.analytics.topPages.map((page, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{page.path}</span>
                                <span className="text-sm font-medium">{page.visits}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-3">Principais Referenciadores</h5>
                          <div className="space-y-2">
                            {domain.analytics.topReferrers.map((referrer, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{referrer.domain}</span>
                                <span className="text-sm font-medium">{referrer.visits}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium mb-3">Dispositivos</h5>
                          <div className="space-y-2">
                            {Object.entries(domain.analytics.deviceBreakdown).map(([device, percentage]) => (
                              <div key={device} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{device}</span>
                                <span className="text-sm font-medium">{percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-3">Localização</h5>
                          <div className="space-y-2">
                            {Object.entries(domain.analytics.locationBreakdown).map(([location, percentage]) => (
                              <div key={location} className="flex items-center justify-between">
                                <span className="text-sm">{location}</span>
                                <span className="text-sm font-medium">{percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3">Métricas de Performance</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <p className="text-lg font-bold">{domain.analytics.performanceMetrics.loadTime.toFixed(0)}ms</p>
                            <p className="text-xs text-muted-foreground">Load Time</p>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <p className="text-lg font-bold">{domain.analytics.performanceMetrics.ttfb.toFixed(0)}ms</p>
                            <p className="text-xs text-muted-foreground">TTFB</p>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <p className="text-lg font-bold">{domain.analytics.performanceMetrics.fcp.toFixed(0)}ms</p>
                            <p className="text-xs text-muted-foreground">FCP</p>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <p className="text-lg font-bold">{domain.analytics.performanceMetrics.lcp.toFixed(0)}ms</p>
                            <p className="text-xs text-muted-foreground">LCP</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CustomDomainManager;