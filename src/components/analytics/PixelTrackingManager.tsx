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
  BarChart3, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Settings,
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
  Target,
  TrendingUp,
  Users,
  MousePointer,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Zap,
  Filter,
  Calendar,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  Hash,
  Code,
  Link,
  Database
} from 'lucide-react';
import type { Quiz } from '@/types/quiz';

interface PixelTrackingManagerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface TrackingPixel {
  id: string;
  name: string;
  type: 'facebook' | 'google_analytics' | 'google_ads' | 'tiktok' | 'linkedin' | 'twitter' | 'custom';
  pixelId: string;
  enabled: boolean;
  events: TrackingEvent[];
  settings: PixelSettings;
  analytics: PixelAnalytics;
}

interface TrackingEvent {
  id: string;
  name: string;
  trigger: 'quiz_start' | 'question_answered' | 'quiz_completed' | 'lead_generated' | 'outcome_reached' | 'custom';
  eventName: string;
  parameters: Record<string, any>;
  conditions?: EventCondition[];
  enabled: boolean;
}

interface EventCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
}

interface PixelSettings {
  testMode: boolean;
  debugMode: boolean;
  cookieConsent: boolean;
  dataProcessing: {
    anonymizeIP: boolean;
    respectDoNotTrack: boolean;
    gdprCompliant: boolean;
  };
  customDomain?: string;
  serverSideTracking?: boolean;
}

interface PixelAnalytics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  lastFired?: Date;
  eventBreakdown: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
}

interface TrackingTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  events: Omit<TrackingEvent, 'id'>[];
  settings: Partial<PixelSettings>;
}

export function PixelTrackingManager({ quiz, onQuizUpdate }: PixelTrackingManagerProps) {
  const [trackingPixels, setTrackingPixels] = useState<TrackingPixel[]>([]);
  const [templates, setTemplates] = useState<TrackingTemplate[]>([]);
  const [isTestingPixel, setIsTestingPixel] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pixels');
  const [selectedPixel, setSelectedPixel] = useState<string>('');

  useEffect(() => {
    initializeTemplates();
    loadExistingPixels();
  }, [quiz]);

  const initializeTemplates = () => {
    const defaultTemplates: TrackingTemplate[] = [
      {
        id: 'facebook_standard',
        name: 'Facebook Pixel - Padrão',
        description: 'Configuração padrão para Facebook Pixel com eventos essenciais',
        platform: 'facebook',
        events: [
          {
            name: 'Início do Quiz',
            trigger: 'quiz_start',
            eventName: 'InitiateCheckout',
            parameters: {
              content_type: 'quiz',
              content_name: '{{quiz_title}}',
              value: 0,
              currency: 'BRL'
            },
            enabled: true
          },
          {
            name: 'Lead Gerado',
            trigger: 'lead_generated',
            eventName: 'Lead',
            parameters: {
              content_type: 'lead',
              content_name: '{{quiz_title}}',
              value: 10,
              currency: 'BRL'
            },
            enabled: true
          },
          {
            name: 'Quiz Completado',
            trigger: 'quiz_completed',
            eventName: 'CompleteRegistration',
            parameters: {
              content_type: 'quiz_completion',
              content_name: '{{quiz_title}}',
              value: 5,
              currency: 'BRL'
            },
            enabled: true
          }
        ],
        settings: {
          testMode: false,
          debugMode: false,
          cookieConsent: true,
          dataProcessing: {
            anonymizeIP: true,
            respectDoNotTrack: true,
            gdprCompliant: true
          }
        }
      },
      {
        id: 'google_analytics_standard',
        name: 'Google Analytics - Padrão',
        description: 'Configuração padrão para Google Analytics com eventos essenciais',
        platform: 'google_analytics',
        events: [
          {
            name: 'Início do Quiz',
            trigger: 'quiz_start',
            eventName: 'quiz_start',
            parameters: {
              event_category: 'Quiz',
              event_label: '{{quiz_title}}',
              quiz_id: '{{quiz_id}}',
              user_id: '{{user_id}}'
            },
            enabled: true
          },
          {
            name: 'Pergunta Respondida',
            trigger: 'question_answered',
            eventName: 'quiz_question_answered',
            parameters: {
              event_category: 'Quiz',
              event_label: '{{question_title}}',
              question_id: '{{question_id}}',
              answer: '{{answer_value}}'
            },
            enabled: true
          },
          {
            name: 'Quiz Completado',
            trigger: 'quiz_completed',
            eventName: 'quiz_completed',
            parameters: {
              event_category: 'Quiz',
              event_label: '{{quiz_title}}',
              quiz_id: '{{quiz_id}}',
              score: '{{final_score}}',
              completion_time: '{{completion_time}}'
            },
            enabled: true
          },
          {
            name: 'Lead Gerado',
            trigger: 'lead_generated',
            eventName: 'generate_lead',
            parameters: {
              event_category: 'Lead',
              event_label: '{{quiz_title}}',
              lead_source: 'quiz',
              lead_quality: '{{lead_score}}'
            },
            enabled: true
          }
        ],
        settings: {
          testMode: false,
          debugMode: false,
          cookieConsent: true,
          dataProcessing: {
            anonymizeIP: true,
            respectDoNotTrack: true,
            gdprCompliant: true
          }
        }
      },
      {
        id: 'google_ads_conversion',
        name: 'Google Ads - Conversões',
        description: 'Rastreamento de conversões para Google Ads',
        platform: 'google_ads',
        events: [
          {
            name: 'Conversão - Lead',
            trigger: 'lead_generated',
            eventName: 'conversion',
            parameters: {
              send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
              value: 10,
              currency: 'BRL',
              transaction_id: '{{lead_id}}'
            },
            enabled: true
          },
          {
            name: 'Conversão - Quiz Completo',
            trigger: 'quiz_completed',
            eventName: 'conversion',
            parameters: {
              send_to: 'AW-CONVERSION_ID/QUIZ_COMPLETION_LABEL',
              value: 5,
              currency: 'BRL',
              transaction_id: '{{session_id}}'
            },
            enabled: true
          }
        ],
        settings: {
          testMode: false,
          debugMode: false,
          cookieConsent: true,
          dataProcessing: {
            anonymizeIP: true,
            respectDoNotTrack: true,
            gdprCompliant: true
          }
        }
      },
      {
        id: 'tiktok_pixel',
        name: 'TikTok Pixel',
        description: 'Rastreamento para TikTok Ads',
        platform: 'tiktok',
        events: [
          {
            name: 'Visualização de Conteúdo',
            trigger: 'quiz_start',
            eventName: 'ViewContent',
            parameters: {
              content_type: 'quiz',
              content_id: '{{quiz_id}}',
              content_name: '{{quiz_title}}'
            },
            enabled: true
          },
          {
            name: 'Geração de Lead',
            trigger: 'lead_generated',
            eventName: 'SubmitForm',
            parameters: {
              content_type: 'lead_form',
              content_id: '{{quiz_id}}',
              value: 10,
              currency: 'BRL'
            },
            enabled: true
          }
        ],
        settings: {
          testMode: false,
          debugMode: false,
          cookieConsent: true,
          dataProcessing: {
            anonymizeIP: true,
            respectDoNotTrack: true,
            gdprCompliant: true
          }
        }
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadExistingPixels = () => {
    // Carregar pixels existentes do localStorage ou API
    const savedPixels = localStorage.getItem(`tracking_pixels_${quiz.id}`);
    if (savedPixels) {
      try {
        const pixels = JSON.parse(savedPixels);
        setTrackingPixels(pixels);
      } catch (error) {
        console.error('Erro ao carregar pixels:', error);
      }
    }
  };

  const createNewPixel = () => {
    const newPixel: TrackingPixel = {
      id: `pixel_${Date.now()}`,
      name: 'Novo Pixel',
      type: 'facebook',
      pixelId: '',
      enabled: true,
      events: [],
      settings: {
        testMode: true,
        debugMode: true,
        cookieConsent: true,
        dataProcessing: {
          anonymizeIP: true,
          respectDoNotTrack: true,
          gdprCompliant: true
        }
      },
      analytics: {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        eventBreakdown: {},
        deviceBreakdown: {},
        locationBreakdown: {}
      }
    };

    setTrackingPixels([...trackingPixels, newPixel]);
  };

  const updatePixel = (pixelId: string, updates: Partial<TrackingPixel>) => {
    setTrackingPixels(pixels => 
      pixels.map(pixel => 
        pixel.id === pixelId ? { ...pixel, ...updates } : pixel
      )
    );
  };

  const deletePixel = (pixelId: string) => {
    setTrackingPixels(pixels => pixels.filter(pixel => pixel.id !== pixelId));
  };

  const addEventToPixel = (pixelId: string) => {
    const newEvent: TrackingEvent = {
      id: `event_${Date.now()}`,
      name: 'Novo Evento',
      trigger: 'quiz_start',
      eventName: 'custom_event',
      parameters: {},
      enabled: true
    };

    const pixel = trackingPixels.find(p => p.id === pixelId);
    if (pixel) {
      updatePixel(pixelId, {
        events: [...pixel.events, newEvent]
      });
    }
  };

  const updateEvent = (pixelId: string, eventId: string, updates: Partial<TrackingEvent>) => {
    const pixel = trackingPixels.find(p => p.id === pixelId);
    if (pixel) {
      const updatedEvents = pixel.events.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      );
      updatePixel(pixelId, { events: updatedEvents });
    }
  };

  const removeEvent = (pixelId: string, eventId: string) => {
    const pixel = trackingPixels.find(p => p.id === pixelId);
    if (pixel) {
      const updatedEvents = pixel.events.filter(e => e.id !== eventId);
      updatePixel(pixelId, { events: updatedEvents });
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newPixel: TrackingPixel = {
      id: `pixel_${Date.now()}`,
      name: template.name,
      type: template.platform as any,
      pixelId: '',
      enabled: true,
      events: template.events.map(event => ({
        ...event,
        id: `event_${Date.now()}_${Math.random()}`
      })),
      settings: {
        testMode: true,
        debugMode: true,
        cookieConsent: true,
        dataProcessing: {
          anonymizeIP: true,
          respectDoNotTrack: true,
          gdprCompliant: true
        },
        ...template.settings
      },
      analytics: {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        eventBreakdown: {},
        deviceBreakdown: {},
        locationBreakdown: {}
      }
    };

    setTrackingPixels([...trackingPixels, newPixel]);
  };

  const testPixel = async (pixelId: string) => {
    setIsTestingPixel(true);
    
    const pixel = trackingPixels.find(p => p.id === pixelId);
    if (!pixel) return;

    // Simular diferentes cenários de teste
    const testScenarios = [
      {
        name: 'Início do Quiz',
        trigger: 'quiz_start',
        data: { quiz_id: quiz.id, quiz_title: quiz.title, user_id: 'test_user_123' },
        expectedEvents: pixel.events.filter(e => e.trigger === 'quiz_start' && e.enabled).length
      },
      {
        name: 'Pergunta Respondida',
        trigger: 'question_answered',
        data: { question_id: 'q1', question_title: 'Primeira Pergunta', answer_value: 'Sim' },
        expectedEvents: pixel.events.filter(e => e.trigger === 'question_answered' && e.enabled).length
      },
      {
        name: 'Lead Gerado',
        trigger: 'lead_generated',
        data: { lead_id: 'lead_123', lead_score: 85, email: 'test@example.com' },
        expectedEvents: pixel.events.filter(e => e.trigger === 'lead_generated' && e.enabled).length
      },
      {
        name: 'Quiz Completado',
        trigger: 'quiz_completed',
        data: { final_score: 92, completion_time: 180, session_id: 'session_456' },
        expectedEvents: pixel.events.filter(e => e.trigger === 'quiz_completed' && e.enabled).length
      }
    ];

    const results = testScenarios.map(scenario => {
      const applicableEvents = pixel.events.filter(e => 
        e.trigger === scenario.trigger && e.enabled
      );

      const firedEvents = applicableEvents.map(event => {
        // Simular disparo do evento
        const processedParameters = processEventParameters(event.parameters, scenario.data);
        
        return {
          eventName: event.eventName,
          parameters: processedParameters,
          success: Math.random() > 0.1, // 90% de sucesso simulado
          timestamp: new Date()
        };
      });

      return {
        ...scenario,
        firedEvents,
        success: firedEvents.every(e => e.success),
        actualEvents: firedEvents.length
      };
    });

    setTestResults(results);
    setTimeout(() => setIsTestingPixel(false), 2000);
  };

  const processEventParameters = (parameters: Record<string, any>, data: Record<string, any>): Record<string, any> => {
    const processed = { ...parameters };
    
    Object.keys(processed).forEach(key => {
      if (typeof processed[key] === 'string') {
        // Substituir placeholders como {{quiz_title}}
        processed[key] = processed[key].replace(/\{\{(\w+)\}\}/g, (match: string, field: string) => {
          return data[field] || match;
        });
      }
    });

    return processed;
  };

  const generatePixelCode = (pixel: TrackingPixel): string => {
    let code = '';

    switch (pixel.type) {
      case 'facebook':
        code = `
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '${pixel.pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixel.pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`;
        break;

      case 'google_analytics':
        code = `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${pixel.pixelId}', {
    anonymize_ip: ${pixel.settings.dataProcessing.anonymizeIP},
    respect_dnt: ${pixel.settings.dataProcessing.respectDoNotTrack}
  });
</script>
<!-- End Google Analytics -->`;
        break;

      case 'google_ads':
        code = `
<!-- Google Ads Conversion Tracking -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-${pixel.pixelId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-${pixel.pixelId}');
</script>
<!-- End Google Ads Conversion Tracking -->`;
        break;

      case 'tiktok':
        code = `
<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixel.pixelId}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`;
        break;

      default:
        code = `<!-- Custom Pixel Code for ${pixel.name} -->`;
    }

    return code;
  };

  const savePixels = () => {
    localStorage.setItem(`tracking_pixels_${quiz.id}`, JSON.stringify(trackingPixels));
    
    // Atualizar quiz com configurações de tracking
    const updatedQuiz = {
      ...quiz,
      settings: {
        ...quiz.settings,
        tracking: {
          enabled: trackingPixels.some(p => p.enabled),
          pixels: trackingPixels
        }
      }
    };

    onQuizUpdate(updatedQuiz);
  };

  const exportPixels = () => {
    const config = {
      pixels: trackingPixels,
      templates: templates.filter(t => !['facebook_standard', 'google_analytics_standard', 'google_ads_conversion', 'tiktok_pixel'].includes(t.id)),
      quiz_id: quiz.id,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-pixels-${quiz.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPixels = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.pixels) {
          setTrackingPixels(config.pixels);
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

  const getAnalyticsSummary = () => {
    const totalEvents = trackingPixels.reduce((sum, pixel) => sum + pixel.analytics.totalEvents, 0);
    const totalSuccessful = trackingPixels.reduce((sum, pixel) => sum + pixel.analytics.successfulEvents, 0);
    const averageSuccess = totalEvents > 0 ? (totalSuccessful / totalEvents) * 100 : 0;

    return {
      totalEvents,
      totalSuccessful,
      averageSuccess: Math.round(averageSuccess * 100) / 100,
      activePixels: trackingPixels.filter(p => p.enabled).length
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Pixel & Analytics Tracking
          </h3>
          <p className="text-muted-foreground">
            Configure integração com Facebook Pixel, Google Analytics e outras plataformas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importPixels}
            className="hidden"
            id="import-pixels"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-pixels')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportPixels}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={savePixels}>
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
                      <p className="text-sm text-muted-foreground">Pixels Ativos</p>
                      <p className="text-2xl font-bold">{summary.activePixels}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Eventos</p>
                      <p className="text-2xl font-bold">{summary.totalEvents}</p>
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
                      <p className="text-sm text-muted-foreground">Taxa Sucesso</p>
                      <p className="text-2xl font-bold">{summary.averageSuccess}%</p>
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
          <TabsTrigger value="pixels">Pixels</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pixels" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Pixels de Rastreamento</h4>
            <Button onClick={createNewPixel}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pixel
            </Button>
          </div>

          <div className="space-y-4">
            {trackingPixels.map(pixel => (
              <Card key={pixel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={pixel.enabled}
                        onCheckedChange={(enabled) => updatePixel(pixel.id, { enabled })}
                      />
                      <div>
                        <Input
                          value={pixel.name}
                          onChange={(e) => updatePixel(pixel.id, { name: e.target.value })}
                          className="font-semibold"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {pixel.type}
                          </Badge>
                          <Badge variant={pixel.settings.testMode ? 'secondary' : 'default'}>
                            {pixel.settings.testMode ? 'Teste' : 'Produção'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testPixel(pixel.id)}
                        disabled={isTestingPixel}
                      >
                        {isTestingPixel ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePixel(pixel.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Pixel</Label>
                      <Select
                        value={pixel.type}
                        onValueChange={(value: any) => updatePixel(pixel.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook Pixel</SelectItem>
                          <SelectItem value="google_analytics">Google Analytics</SelectItem>
                          <SelectItem value="google_ads">Google Ads</SelectItem>
                          <SelectItem value="tiktok">TikTok Pixel</SelectItem>
                          <SelectItem value="linkedin">LinkedIn Insight</SelectItem>
                          <SelectItem value="twitter">Twitter Pixel</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>ID do Pixel</Label>
                      <Input
                        value={pixel.pixelId}
                        onChange={(e) => updatePixel(pixel.id, { pixelId: e.target.value })}
                        placeholder={
                          pixel.type === 'facebook' ? '123456789012345' :
                          pixel.type === 'google_analytics' ? 'GA-XXXXXXXXX-X' :
                          pixel.type === 'google_ads' ? 'AW-XXXXXXXXX' :
                          'ID do pixel'
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações */}
                  <div className="space-y-3">
                    <Label>Configurações</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pixel.settings.testMode}
                          onCheckedChange={(testMode) => updatePixel(pixel.id, {
                            settings: { ...pixel.settings, testMode }
                          })}
                        />
                        <Label>Modo Teste</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pixel.settings.debugMode}
                          onCheckedChange={(debugMode) => updatePixel(pixel.id, {
                            settings: { ...pixel.settings, debugMode }
                          })}
                        />
                        <Label>Debug</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pixel.settings.cookieConsent}
                          onCheckedChange={(cookieConsent) => updatePixel(pixel.id, {
                            settings: { ...pixel.settings, cookieConsent }
                          })}
                        />
                        <Label>Consentimento</Label>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pixel.settings.dataProcessing.anonymizeIP}
                          onCheckedChange={(anonymizeIP) => updatePixel(pixel.id, {
                            settings: {
                              ...pixel.settings,
                              dataProcessing: { ...pixel.settings.dataProcessing, anonymizeIP }
                            }
                          })}
                        />
                        <Label>Anonimizar IP</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pixel.settings.dataProcessing.respectDoNotTrack}
                          onCheckedChange={(respectDoNotTrack) => updatePixel(pixel.id, {
                            settings: {
                              ...pixel.settings,
                              dataProcessing: { ...pixel.settings.dataProcessing, respectDoNotTrack }
                            }
                          })}
                        />
                        <Label>Respeitar DNT</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pixel.settings.dataProcessing.gdprCompliant}
                          onCheckedChange={(gdprCompliant) => updatePixel(pixel.id, {
                            settings: {
                              ...pixel.settings,
                              dataProcessing: { ...pixel.settings.dataProcessing, gdprCompliant }
                            }
                          })}
                        />
                        <Label>GDPR</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Eventos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Eventos ({pixel.events.length})</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addEventToPixel(pixel.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {pixel.events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={event.enabled}
                              onCheckedChange={(enabled) => updateEvent(pixel.id, event.id, { enabled })}
                            />
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.trigger} → {event.eventName}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeEvent(pixel.id, event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Código do Pixel */}
                  <div className="space-y-2">
                    <Label>Código do Pixel</Label>
                    <div className="relative">
                      <Textarea
                        value={generatePixelCode(pixel)}
                        readOnly
                        rows={8}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => navigator.clipboard.writeText(generatePixelCode(pixel))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Analytics do Pixel */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{pixel.analytics.totalEvents}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Sucessos</p>
                      <p className="text-lg font-semibold text-green-600">{pixel.analytics.successfulEvents}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Falhas</p>
                      <p className="text-lg font-semibold text-red-600">{pixel.analytics.failedEvents}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Taxa</p>
                      <p className="text-lg font-semibold">
                        {pixel.analytics.totalEvents > 0 
                          ? ((pixel.analytics.successfulEvents / pixel.analytics.totalEvents) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {trackingPixels.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhum pixel configurado</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure pixels de rastreamento para monitorar o comportamento dos usuários
                  </p>
                  <Button onClick={createNewPixel}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Pixel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Configuração de Eventos</h4>
          </div>

          {selectedPixel && trackingPixels.find(p => p.id === selectedPixel) && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos - {trackingPixels.find(p => p.id === selectedPixel)?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Implementar editor detalhado de eventos */}
                <p className="text-muted-foreground">
                  Editor detalhado de eventos será implementado aqui
                </p>
              </CardContent>
            </Card>
          )}

          {!selectedPixel && (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold mb-2">Selecione um pixel</h4>
                <p className="text-muted-foreground mb-4">
                  Escolha um pixel na aba anterior para configurar seus eventos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Templates de Tracking</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.platform === 'facebook' && <Hash className="w-4 h-4" />}
                        {template.platform === 'google_analytics' && <BarChart className="w-4 h-4" />}
                        {template.platform === 'google_ads' && <Target className="w-4 h-4" />}
                        {template.platform === 'tiktok' && <Activity className="w-4 h-4" />}
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline">
                      {template.platform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Eventos: {template.events.length}</span>
                    <span>Plataforma: {template.platform}</span>
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Analytics de Tracking</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Pixel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingPixels.map(pixel => (
                    <div key={pixel.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{pixel.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pixel.analytics.totalEvents} eventos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {pixel.analytics.totalEvents > 0 
                            ? ((pixel.analytics.successfulEvents / pixel.analytics.totalEvents) * 100).toFixed(1)
                            : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pixel.analytics.successfulEvents}/{pixel.analytics.totalEvents}
                        </p>
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
                  <div className="flex items-center justify-between">
                    <span>Quiz Start</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lead Generated</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiz Completed</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Question Answered</span>
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{result.name}</h5>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Sucesso' : 'Falha'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Esperado: {result.expectedEvents} eventos | Disparado: {result.actualEvents} eventos
                      </div>
                      {result.firedEvents.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {result.firedEvents.map((event: any, eventIndex: number) => (
                            <div key={eventIndex} className="text-xs flex items-center gap-2">
                              {event.success ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              )}
                              {event.eventName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PixelTrackingManager;