import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/SimpleAuthProvider';
import { DEMO_ANALYTICS } from '@/lib/demoData';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  Target,
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  Share2,
  Mail,
  MessageCircle,
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Quiz } from '@/types/quiz';

interface AdvancedAnalyticsDashboardProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalStarts: number;
    totalCompletions: number;
    totalLeads: number;
    conversionRate: number;
    completionRate: number;
    averageScore: number;
    averageTime: number;
    bounceRate: number;
    returnVisitors: number;
  };
  timeSeriesData: Array<{
    date: string;
    views: number;
    starts: number;
    completions: number;
    leads: number;
  }>;
  deviceData: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  locationData: Array<{
    country: string;
    city: string;
    count: number;
    percentage: number;
  }>;
  trafficSources: Array<{
    source: string;
    count: number;
    percentage: number;
    conversionRate: number;
  }>;
  questionAnalytics: Array<{
    questionId: string;
    questionText: string;
    views: number;
    answers: number;
    dropOffRate: number;
    averageTime: number;
    optionStats: Array<{
      option: string;
      count: number;
      percentage: number;
    }>;
  }>;
  outcomeAnalytics: Array<{
    outcomeId: string;
    outcomeName: string;
    count: number;
    percentage: number;
    averageScore: number;
    leadConversion: number;
  }>;
  funnelData: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  cohortData: Array<{
    cohort: string;
    week0: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  }>;
  heatmapData: Array<{
    hour: number;
    day: string;
    value: number;
  }>;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
}

export function AdvancedAnalyticsDashboard({ quiz, onQuizUpdate }: AdvancedAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('completions');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');

  useEffect(() => {
    loadAnalyticsData();
  }, [quiz, dateRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Verificar se estamos em modo demo
      const { isDemoMode } = useAuth();
      
      if (isDemoMode) {
        // Usar dados demo
        const demoAnalytics = DEMO_ANALYTICS;
        
        const demoData: AnalyticsData = {
          overview: {
            totalViews: demoAnalytics.overview.totalViews,
            totalStarts: demoAnalytics.overview.totalStarts,
            totalCompletions: demoAnalytics.overview.totalCompletions,
            totalLeads: demoAnalytics.overview.totalLeads,
            conversionRate: demoAnalytics.overview.conversionRate,
            completionRate: Math.round((demoAnalytics.overview.totalCompletions / demoAnalytics.overview.totalStarts) * 100),
            averageScore: 85,
            averageTime: demoAnalytics.overview.averageCompletionTime,
            bounceRate: 25,
            returnVisitors: 15
          },
          timeSeriesData: demoAnalytics.timeline.last30Days.views.slice(-7).map((views, index) => ({
            date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            views,
            starts: demoAnalytics.timeline.last30Days.starts.slice(-7)[index],
            completions: demoAnalytics.timeline.last30Days.completions.slice(-7)[index],
            leads: Math.round(demoAnalytics.timeline.last30Days.completions.slice(-7)[index] * 0.6)
          })),
          deviceData: [
            { device: 'Mobile', count: demoAnalytics.demographic.deviceBreakdown.mobile, percentage: demoAnalytics.demographic.deviceBreakdown.mobile },
            { device: 'Desktop', count: demoAnalytics.demographic.deviceBreakdown.desktop, percentage: demoAnalytics.demographic.deviceBreakdown.desktop },
            { device: 'Tablet', count: demoAnalytics.demographic.deviceBreakdown.tablet, percentage: demoAnalytics.demographic.deviceBreakdown.tablet }
          ],
          locationData: [
            { country: 'Brasil', city: 'São Paulo', count: 45, percentage: 35 },
            { country: 'Brasil', city: 'Rio de Janeiro', count: 32, percentage: 25 },
            { country: 'Brasil', city: 'Belo Horizonte', count: 25, percentage: 20 },
            { country: 'Brasil', city: 'Porto Alegre', count: 18, percentage: 14 },
            { country: 'Brasil', city: 'Recife', count: 8, percentage: 6 }
          ],
          trafficSources: [
            { source: 'Orgânico', count: 65, percentage: 45, conversionRate: 12 },
            { source: 'Redes Sociais', count: 48, percentage: 33, conversionRate: 8 },
            { source: 'Direto', count: 22, percentage: 15, conversionRate: 15 },
            { source: 'Email', count: 10, percentage: 7, conversionRate: 25 }
          ],
          questionAnalytics: [
            { questionId: '1', questionText: 'Qual seu nível de experiência?', views: 150, answers: 142, dropOffRate: 5.3, averageTime: 45, optionStats: [
              { option: 'Iniciante', count: 50, percentage: 35 },
              { option: 'Intermediário', count: 64, percentage: 45 },
              { option: 'Avançado', count: 28, percentage: 20 }
            ]},
            { questionId: '2', questionText: 'Qual sua área de interesse?', views: 142, answers: 135, dropOffRate: 4.9, averageTime: 62, optionStats: [
              { option: 'Marketing', count: 54, percentage: 40 },
              { option: 'Vendas', count: 41, percentage: 30 },
              { option: 'Tecnologia', count: 40, percentage: 30 }
            ]}
          ],
          outcomeAnalytics: [
            { outcomeId: '1', outcomeName: 'Iniciante', count: 35, percentage: 35, averageScore: 65, leadConversion: 60 },
            { outcomeId: '2', outcomeName: 'Intermediário', count: 45, percentage: 45, averageScore: 78, leadConversion: 75 },
            { outcomeId: '3', outcomeName: 'Avançado', count: 20, percentage: 20, averageScore: 92, leadConversion: 85 }
          ],
          funnelData: [
            { stage: 'Visualizações', count: 150, percentage: 100 },
            { stage: 'Iniciados', count: 142, percentage: 95 },
            { stage: 'Pergunta 2', count: 135, percentage: 90 },
            { stage: 'Pergunta 3', count: 128, percentage: 85 },
            { stage: 'Completados', count: 120, percentage: 80 },
            { stage: 'Leads', count: 85, percentage: 57 }
          ],
          cohortData: [
            { cohort: 'Jan 2024', week0: 100, week1: 85, week2: 72, week3: 65, week4: 58 },
            { cohort: 'Fev 2024', week0: 100, week1: 88, week2: 75, week3: 68, week4: 62 },
            { cohort: 'Mar 2024', week0: 100, week1: 82, week2: 70, week3: 63, week4: 55 }
          ],
          heatmapData: Array.from({ length: 7 }, (_, day) => 
            Array.from({ length: 24 }, (_, hour) => ({
              hour,
              day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day],
              value: Math.floor(Math.random() * 100)
            }))
          ).flat()
        };
        
        setAnalyticsData(demoData);
        setIsLoading(false);
        return;
      }
      
      // Carregar dados reais de analytics (vazios para novos usuários)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const emptyData: AnalyticsData = {
        overview: {
          totalViews: 0,
          totalStarts: 0,
          totalCompletions: 0,
          totalLeads: 0,
          conversionRate: 0,
          completionRate: 0,
          averageScore: 0,
          averageTime: 0,
          bounceRate: 0,
          returnVisitors: 0
        },
        timeSeriesData: [],
        deviceData: [],
        locationData: [],
        trafficSources: [],
        questionAnalytics: [],
        outcomeAnalytics: [],
        funnelData: [],
        cohortData: [],
        heatmapData: []
      };
      
      setAnalyticsData(emptyData);
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSeriesData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 200) + 100,
        starts: Math.floor(Math.random() * 150) + 80,
        completions: Math.floor(Math.random() * 100) + 50,
        leads: Math.floor(Math.random() * 60) + 20
      });
    }
    
    return data;
  };

  const generateQuestionAnalytics = () => {
    return Array.from({ length: 5 }, (_, i) => ({
      questionId: `q${i + 1}`,
      questionText: `Pergunta ${i + 1}: Como você avalia seu conhecimento?`,
      views: Math.floor(Math.random() * 1000) + 500,
      answers: Math.floor(Math.random() * 800) + 400,
      dropOffRate: Math.random() * 20 + 5,
      averageTime: Math.random() * 60 + 30,
      optionStats: [
        { option: 'Opção A', count: Math.floor(Math.random() * 200) + 100, percentage: 0 },
        { option: 'Opção B', count: Math.floor(Math.random() * 200) + 100, percentage: 0 },
        { option: 'Opção C', count: Math.floor(Math.random() * 200) + 100, percentage: 0 },
        { option: 'Opção D', count: Math.floor(Math.random() * 200) + 100, percentage: 0 }
      ].map(opt => {
        const total = 400;
        return { ...opt, percentage: (opt.count / total) * 100 };
      })
    }));
  };

  const generateCohortData = () => {
    const cohorts = ['Jan 2024', 'Fev 2024', 'Mar 2024', 'Abr 2024', 'Mai 2024'];
    return cohorts.map(cohort => ({
      cohort,
      week0: 100,
      week1: Math.floor(Math.random() * 30) + 60,
      week2: Math.floor(Math.random() * 20) + 40,
      week3: Math.floor(Math.random() * 15) + 25,
      week4: Math.floor(Math.random() * 10) + 15
    }));
  };

  const generateHeatmapData = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          day: days[day],
          hour,
          value: Math.floor(Math.random() * 100)
        });
      }
    }
    
    return data;
  };

  const getMetricCards = (): MetricCard[] => {
    if (!analyticsData) return [];

    const { overview } = analyticsData;
    
    return [
      {
        title: 'Total de Visualizações',
        value: overview.totalViews.toLocaleString(),
        change: Math.random() * 20 - 10,
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
        icon: <Eye className="w-5 h-5" />,
        color: 'text-blue-600',
        description: 'Páginas vistas do quiz'
      },
      {
        title: 'Quiz Iniciados',
        value: overview.totalStarts.toLocaleString(),
        change: Math.random() * 15 - 5,
        changeType: 'increase',
        icon: <Users className="w-5 h-5" />,
        color: 'text-green-600',
        description: 'Usuários que começaram'
      },
      {
        title: 'Quiz Completados',
        value: overview.totalCompletions.toLocaleString(),
        change: Math.random() * 10 - 5,
        changeType: 'increase',
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-purple-600',
        description: 'Finalizações completas'
      },
      {
        title: 'Leads Gerados',
        value: overview.totalLeads.toLocaleString(),
        change: Math.random() * 25 - 10,
        changeType: 'increase',
        icon: <Target className="w-5 h-5" />,
        color: 'text-orange-600',
        description: 'Contatos capturados'
      },
      {
        title: 'Taxa de Conversão',
        value: `${overview.conversionRate.toFixed(1)}%`,
        change: Math.random() * 5 - 2,
        changeType: 'increase',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-red-600',
        description: 'Leads / Completados'
      },
      {
        title: 'Taxa de Conclusão',
        value: `${overview.completionRate.toFixed(1)}%`,
        change: Math.random() * 8 - 4,
        changeType: 'neutral',
        icon: <Award className="w-5 h-5" />,
        color: 'text-indigo-600',
        description: 'Completados / Iniciados'
      },
      {
        title: 'Pontuação Média',
        value: `${overview.averageScore.toFixed(1)}`,
        change: Math.random() * 3 - 1,
        changeType: 'increase',
        icon: <Star className="w-5 h-5" />,
        color: 'text-yellow-600',
        description: 'Score médio dos usuários'
      },
      {
        title: 'Tempo Médio',
        value: `${Math.floor(overview.averageTime / 60)}:${(overview.averageTime % 60).toFixed(0).padStart(2, '0')}`,
        change: Math.random() * 30 - 15,
        changeType: 'decrease',
        icon: <Clock className="w-5 h-5" />,
        color: 'text-teal-600',
        description: 'Duração média do quiz'
      }
    ];
  };

  const getChangeIcon = (changeType: MetricCard['changeType']) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUp className="w-3 h-3 text-green-600" />;
      case 'decrease':
        return <ArrowDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-600" />;
    }
  };

  const exportData = () => {
    if (!analyticsData) return;

    const exportData = {
      quiz: {
        id: quiz.id,
        name: quiz.name,
        exportedAt: new Date().toISOString()
      },
      analytics: analyticsData,
      dateRange,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${quiz.name || 'quiz'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando dados de analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h4 className="text-lg font-semibold mb-2">Dados não disponíveis</h4>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os dados de analytics
        </p>
        <Button onClick={loadAnalyticsData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics Avançado
          </h3>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho do seu quiz
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getMetricCards().map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`${metric.color}`}>
                  {metric.icon}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {getChangeIcon(metric.changeType)}
                  <span className={
                    metric.changeType === 'increase' ? 'text-green-600' :
                    metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }>
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                {metric.description && (
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="questions">Perguntas</TabsTrigger>
          <TabsTrigger value="audience">Audiência</TabsTrigger>
          <TabsTrigger value="cohort">Coorte</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendência Temporal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" name="Visualizações" />
                    <Line type="monotone" dataKey="starts" stroke="#82ca9d" name="Iniciados" />
                    <Line type="monotone" dataKey="completions" stroke="#ffc658" name="Completados" />
                    <Line type="monotone" dataKey="leads" stroke="#ff7300" name="Leads" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fontes de Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{source.count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.percentage.toFixed(1)}% • {source.conversionRate.toFixed(1)}% conv.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados do Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.outcomeAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="outcomeName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.funnelData.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="text-right">
                        <span className="font-bold">{stage.count.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({stage.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                    {index < analyticsData.funnelData.length - 1 && (
                      <div className="text-center mt-2 text-sm text-red-600">
                        -{(analyticsData.funnelData[index].count - analyticsData.funnelData[index + 1].count).toLocaleString()} 
                        ({((analyticsData.funnelData[index].count - analyticsData.funnelData[index + 1].count) / analyticsData.funnelData[index].count * 100).toFixed(1)}% drop-off)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Drop-off</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversão por Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.outcomeAnalytics.map((outcome, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{outcome.outcomeName}</span>
                        <span className="text-sm font-bold">{outcome.leadConversion.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${outcome.leadConversion}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="space-y-4">
            {analyticsData.questionAnalytics.map((question, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{question.questionText}</CardTitle>
                    <Badge variant={question.dropOffRate > 15 ? 'destructive' : 'default'}>
                      {question.dropOffRate.toFixed(1)}% drop-off
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-lg">{question.views.toLocaleString()}</p>
                      <p className="text-muted-foreground">Visualizações</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{question.answers.toLocaleString()}</p>
                      <p className="text-muted-foreground">Respostas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{question.averageTime.toFixed(0)}s</p>
                      <p className="text-muted-foreground">Tempo Médio</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{((question.answers / question.views) * 100).toFixed(1)}%</p>
                      <p className="text-muted-foreground">Taxa Resposta</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium">Distribuição de Respostas:</h5>
                    {question.optionStats.map((option, optIndex) => (
                      <div key={optIndex} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{option.option}</span>
                          <span className="font-medium">
                            {option.count} ({option.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Localização dos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.locationData.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{location.city}</p>
                          <p className="text-sm text-muted-foreground">{location.country}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{location.count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{location.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispositivos e Plataformas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.deviceData.map((device, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {device.device === 'Desktop' && <Monitor className="w-4 h-4" />}
                          {device.device === 'Mobile' && <Smartphone className="w-4 h-4" />}
                          {device.device === 'Tablet' && <Smartphone className="w-4 h-4" />}
                          <span className="font-medium">{device.device}</span>
                        </div>
                        <span className="font-bold">{device.count.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <TrendingDown className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{analyticsData.overview.bounceRate.toFixed(1)}%</p>
                  <p className="text-muted-foreground">Taxa de Rejeição</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <RefreshCw className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">{analyticsData.overview.returnVisitors.toFixed(1)}%</p>
                  <p className="text-muted-foreground">Visitantes Recorrentes</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <Clock className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.floor(analyticsData.overview.averageTime / 60)}:{(analyticsData.overview.averageTime % 60).toFixed(0).padStart(2, '0')}
                  </p>
                  <p className="text-muted-foreground">Tempo Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Coorte - Retenção Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Coorte</th>
                      <th className="text-center p-2">Semana 0</th>
                      <th className="text-center p-2">Semana 1</th>
                      <th className="text-center p-2">Semana 2</th>
                      <th className="text-center p-2">Semana 3</th>
                      <th className="text-center p-2">Semana 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.cohortData.map((cohort, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{cohort.cohort}</td>
                        <td className="text-center p-2">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                            {cohort.week0}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className="px-2 py-1 rounded text-xs text-white"
                            style={{ 
                              backgroundColor: `rgba(59, 130, 246, ${cohort.week1 / 100})`,
                              color: cohort.week1 > 50 ? 'white' : 'black'
                            }}
                          >
                            {cohort.week1}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `rgba(59, 130, 246, ${cohort.week2 / 100})`,
                              color: cohort.week2 > 50 ? 'white' : 'black'
                            }}
                          >
                            {cohort.week2}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `rgba(59, 130, 246, ${cohort.week3 / 100})`,
                              color: cohort.week3 > 50 ? 'white' : 'black'
                            }}
                          >
                            {cohort.week3}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `rgba(59, 130, 246, ${cohort.week4 / 100})`,
                              color: cohort.week4 > 50 ? 'white' : 'black'
                            }}
                          >
                            {cohort.week4}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insights de Retenção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold mb-3">Principais Descobertas:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Retenção média de 45% na primeira semana</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Queda significativa após a segunda semana</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>Coortes mais recentes mostram melhor retenção</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold mb-3">Recomendações:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>Implementar follow-up na segunda semana</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-600" />
                      <span>Criar sequência de emails de nutrição</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span>Oferecer conteúdo exclusivo para engajar</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Heatmap de Atividade - Horários de Maior Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-25 gap-1 text-xs">
                  <div></div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="text-center text-muted-foreground">
                      {i.toString().padStart(2, '0')}
                    </div>
                  ))}
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, dayIndex) => (
                    <React.Fragment key={day}>
                      <div className="text-muted-foreground font-medium">{day}</div>
                      {Array.from({ length: 24 }, (_, hour) => {
                        const dataPoint = analyticsData.heatmapData.find(
                          d => d.day === day && d.hour === hour
                        );
                        const intensity = dataPoint ? dataPoint.value / 100 : 0;
                        return (
                          <div
                            key={`${day}-${hour}`}
                            className="w-4 h-4 rounded-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                              border: intensity > 0.5 ? '1px solid rgba(59, 130, 246, 0.8)' : '1px solid #e5e7eb'
                            }}
                            title={`${day} ${hour}:00 - ${dataPoint?.value || 0} atividades`}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Menos atividade</span>
                  <div className="flex items-center gap-1">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
                      />
                    ))}
                  </div>
                  <span>Mais atividade</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Pico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">14:00 - 16:00</span>
                    </div>
                    <Badge>Pico Principal</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-medium">20:00 - 22:00</span>
                    </div>
                    <Badge variant="secondary">Pico Secundário</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">10:00 - 12:00</span>
                    </div>
                    <Badge variant="outline">Manhã Ativa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dias da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { day: 'Dom', value: 65 },
                    { day: 'Seg', value: 85 },
                    { day: 'Ter', value: 92 },
                    { day: 'Qua', value: 88 },
                    { day: 'Qui', value: 95 },
                    { day: 'Sex', value: 78 },
                    { day: 'Sáb', value: 72 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedAnalyticsDashboard;