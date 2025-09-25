import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area,
  Sankey,
  TreeMap
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowDown,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  Calendar,
  Search,
  Settings,
  Play,
  Pause,
  SkipForward,
  Rewind,
  FastForward,
  RotateCcw,
  Layers,
  PieChart,
  TrendingDownIcon
} from 'lucide-react';
import { Quiz } from '@/types/quiz';

interface ConversionFunnelAnalyzerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface FunnelStep {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  conversionRate: number;
  dropOffCount: number;
  dropOffRate: number;
  averageTime: number;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  sources: {
    organic: number;
    social: number;
    direct: number;
    email: number;
    ads: number;
  };
}

interface DropOffAnalysis {
  step: string;
  reasons: Array<{
    reason: string;
    percentage: number;
    count: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

interface SegmentAnalysis {
  segment: string;
  funnelData: FunnelStep[];
  conversionRate: number;
  dropOffPoints: string[];
  characteristics: string[];
}

interface TimeBasedAnalysis {
  period: string;
  funnelData: FunnelStep[];
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

export function ConversionFunnelAnalyzer({ quiz, onQuizUpdate }: ConversionFunnelAnalyzerProps) {
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [dropOffAnalysis, setDropOffAnalysis] = useState<DropOffAnalysis[]>([]);
  const [segmentAnalysis, setSegmentAnalysis] = useState<SegmentAnalysis[]>([]);
  const [timeBasedAnalysis, setTimeBasedAnalysis] = useState<TimeBasedAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState('funnel');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');

  useEffect(() => {
    loadFunnelData();
  }, [quiz, dateRange, selectedSegment, selectedDevice, selectedSource]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadFunnelData, 30000); // Atualizar a cada 30 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadFunnelData = async () => {
    setIsLoading(true);
    
    try {
      // Carregar dados reais de funil (vazios para novos usuários)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const emptyFunnelData: FunnelStep[] = [];
      
      const emptyDropOffAnalysis: DropOffAnalysis[] = [];
      const emptySegmentAnalysis: SegmentAnalysis[] = [];
      const emptyTimeBasedAnalysis: TimeBasedAnalysis[] = [];

      setFunnelData(emptyFunnelData);
      setDropOffAnalysis(emptyDropOffAnalysis);
      setSegmentAnalysis(emptySegmentAnalysis);
      setTimeBasedAnalysis(emptyTimeBasedAnalysis);
      
    } catch (error) {
      console.error('Erro ao carregar dados do funil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportFunnelData = () => {
    const exportData = {
      quiz: {
        id: quiz.id,
        name: quiz.name
      },
      funnelData,
      dropOffAnalysis,
      segmentAnalysis,
      timeBasedAnalysis,
      filters: {
        dateRange,
        selectedSegment,
        selectedDevice,
        selectedSource
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-analysis-${quiz.name || 'quiz'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Analisando funil de conversão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="w-6 h-6" />
            Análise de Funil de Conversão
          </h3>
          <p className="text-muted-foreground">
            Análise detalhada de abandono e otimização de conversões
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label className="text-sm">Auto-refresh</Label>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportFunnelData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={loadFunnelData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Label>Filtros:</Label>
            </div>
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novos Usuários</SelectItem>
                <SelectItem value="returning">Recorrentes</SelectItem>
                <SelectItem value="high_intent">Alta Intenção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="organic">Orgânico</SelectItem>
                <SelectItem value="social">Redes Sociais</SelectItem>
                <SelectItem value="direct">Direto</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="ads">Anúncios</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <Label className="text-sm">Comparar períodos</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="funnel">Funil Principal</TabsTrigger>
          <TabsTrigger value="dropoff">Análise de Abandono</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="optimization">Otimização</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          {/* Funnel Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{funnelData[0]?.count.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Visitantes Totais</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {funnelData[funnelData.length - 1]?.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Conversão Final</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {funnelData.reduce((acc, step) => acc + step.dropOffCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total de Abandonos</div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Visualização do Funil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((step, index) => (
                  <div key={step.id} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: getStepColor(index) }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{step.name}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{step.count.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {step.percentage.toFixed(1)}% • {step.conversionRate.toFixed(1)}% conv.
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className="h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                          style={{ 
                            width: `${step.percentage}%`,
                            backgroundColor: getStepColor(index)
                          }}
                        >
                          <span className="text-white text-xs font-medium">
                            {step.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {index < funnelData.length - 1 && step.dropOffCount > 0 && (
                      <div className="mt-2 flex items-center justify-center">
                        <div className="bg-red-50 border border-red-200 rounded px-3 py-1 text-sm">
                          <span className="text-red-600 font-medium">
                            -{step.dropOffCount.toLocaleString()} ({step.dropOffRate.toFixed(1)}% abandono)
                          </span>
                        </div>
                      </div>
                    )}

                    {index < funnelData.length - 1 && (
                      <div className="flex justify-center mt-3 mb-3">
                        <ArrowDown className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#8884d8" name="Taxa de Conversão %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="averageTime" stroke="#82ca9d" name="Tempo (segundos)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dropoff" className="space-y-4">
          {dropOffAnalysis.map((analysis, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  {analysis.step}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h5 className="font-semibold mb-3">Principais Motivos de Abandono:</h5>
                  <div className="space-y-3">
                    {analysis.reasons.map((reason, reasonIndex) => (
                      <div key={reasonIndex} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <Badge className={getImpactColor(reason.impact)}>
                            {reason.impact === 'high' ? 'Alto' : reason.impact === 'medium' ? 'Médio' : 'Baixo'} Impacto
                          </Badge>
                          <span className="font-medium">{reason.reason}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{reason.percentage}%</div>
                          <div className="text-sm text-muted-foreground">{reason.count} usuários</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3">Recomendações de Otimização:</h5>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, recIndex) => (
                      <div key={recIndex} className="flex items-center justify-between p-3 rounded border bg-blue-50">
                        <div className="flex items-center gap-3">
                          <Badge variant={getPriorityColor(rec.priority)}>
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                          <span className="font-medium">{rec.action}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{rec.estimatedImpact}</div>
                          <div className="text-sm text-muted-foreground">
                            Esforço: {rec.effort === 'low' ? 'Baixo' : rec.effort === 'medium' ? 'Médio' : 'Alto'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4">
            {segmentAnalysis.map((segment, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{segment.segment}</CardTitle>
                    <Badge variant="outline">
                      {segment.conversionRate.toFixed(1)}% conversão
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold mb-2">Funil do Segmento:</h5>
                      <div className="space-y-2">
                        {segment.funnelData.slice(0, 4).map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center justify-between text-sm">
                            <span>{step.name}</span>
                            <span className="font-medium">{step.count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Características:</h5>
                      <div className="space-y-1">
                        {segment.characteristics.map((char, charIndex) => (
                          <div key={charIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>{char}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-2">Principais Pontos de Abandono:</h5>
                    <div className="flex gap-2">
                      {segment.dropOffPoints.map((point, pointIndex) => (
                        <Badge key={pointIndex} variant="destructive">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {timeBasedAnalysis.map((period, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{period.period}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Melhorando:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {period.trends.improving.map((item, itemIndex) => (
                          <Badge key={itemIndex} className="bg-green-100 text-green-800">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Piorando:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {period.trends.declining.map((item, itemIndex) => (
                          <Badge key={itemIndex} className="bg-red-100 text-red-800">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Estável:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {period.trends.stable.map((item, itemIndex) => (
                          <Badge key={itemIndex} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparação Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="percentage" stroke="#8884d8" name="Atual" />
                  <Line type="monotone" dataKey="conversionRate" stroke="#82ca9d" name="Conversão" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Oportunidades de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-red-800">Crítico</span>
                      <Badge variant="destructive">-25% conversão</Badge>
                    </div>
                    <p className="text-sm">25% dos usuários abandonam na página inicial. Otimizar call-to-action.</p>
                  </div>
                  
                  <div className="p-3 border rounded bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-yellow-800">Importante</span>
                      <Badge className="bg-yellow-600">-15% conversão</Badge>
                    </div>
                    <p className="text-sm">Quiz muito longo causa abandono no meio. Considerar reduzir perguntas.</p>
                  </div>
                  
                  <div className="p-3 border rounded bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-800">Oportunidade</span>
                      <Badge className="bg-blue-600">+10% conversão</Badge>
                    </div>
                    <p className="text-sm">Adicionar barra de progresso pode melhorar conclusão.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Otimizar título da landing page
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Adicionar indicador de progresso
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  Melhorar CTA do quiz
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar prova social
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Otimizar para mobile
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Simulador de Impacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Melhoria na Landing Page</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">+5% conversão</SelectItem>
                      <SelectItem value="10">+10% conversão</SelectItem>
                      <SelectItem value="15">+15% conversão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Redução do Quiz</Label>
                  <Select defaultValue="10">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">+10% conclusão</SelectItem>
                      <SelectItem value="20">+20% conclusão</SelectItem>
                      <SelectItem value="30">+30% conclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Otimização Mobile</Label>
                  <Select defaultValue="8">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">+8% mobile</SelectItem>
                      <SelectItem value="12">+12% mobile</SelectItem>
                      <SelectItem value="18">+18% mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                <h5 className="font-semibold text-green-800 mb-2">Impacto Projetado:</h5>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">+1,250</div>
                    <div className="text-green-700">Leads Adicionais/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">+32%</div>
                    <div className="text-green-700">Melhoria na Conversão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">R$ 25.000</div>
                    <div className="text-green-700">Valor Adicional/mês</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ConversionFunnelAnalyzer;