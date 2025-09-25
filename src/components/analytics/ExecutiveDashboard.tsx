import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Award,
  Eye,
  MousePointer,
  UserPlus,
  Star
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { localDB } from '@/lib/localStorage';
import { realAnalytics } from '@/lib/analytics';

interface ExecutiveMetrics {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalLeads: number;
    leadsGrowth: number;
    avgLeadValue: number;
    leadValueGrowth: number;
    totalQuizzes: number;
    activeQuizzes: number;
  };
  performance: {
    topPerformingQuizzes: Array<{
      id: string;
      title: string;
      leads: number;
      revenue: number;
      conversionRate: number;
      growth: number;
    }>;
    conversionFunnel: Array<{
      stage: string;
      count: number;
      percentage: number;
      dropoff: number;
    }>;
    channelPerformance: Array<{
      channel: string;
      leads: number;
      cost: number;
      roi: number;
      quality: number;
    }>;
  };
  trends: {
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      leads: number;
      avgValue: number;
    }>;
    leadQualityTrend: Array<{
      date: string;
      score: number;
      volume: number;
    }>;
    conversionTrend: Array<{
      date: string;
      rate: number;
      benchmark: number;
    }>;
  };
  insights: {
    opportunities: Array<{
      type: 'growth' | 'optimization' | 'risk';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      priority: number;
    }>;
    alerts: Array<{
      type: 'warning' | 'success' | 'info';
      title: string;
      message: string;
      action?: string;
    }>;
  };
}

interface ExecutiveDashboardProps {
  dateRange?: string;
}

export function ExecutiveDashboard({ dateRange = '30d' }: ExecutiveDashboardProps) {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);

  useEffect(() => {
    loadExecutiveMetrics();
  }, [selectedPeriod]);

  const loadExecutiveMetrics = async () => {
    try {
      setLoading(true);
      
      // Get data from localStorage
      const quizzes = localDB.getQuizzes();
      const leads = localDB.getLeads();
      const results = localDB.getResults();
      
      // Calculate date range
      const now = new Date();
      const daysBack = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      
      // Filter data by date range
      const recentLeads = leads.filter(lead => 
        new Date(lead.createdAt) >= startDate
      );
      
      const recentResults = results.filter(result => 
        new Date(result.createdAt) >= startDate
      );

      // Calculate overview metrics
      const totalRevenue = recentLeads.length * 50; // Simulated revenue per lead
      const previousPeriodRevenue = leads.length * 50 * 0.8; // Simulated previous period
      const revenueGrowth = ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
      
      const totalLeads = recentLeads.length;
      const previousPeriodLeads = Math.round(totalLeads * 0.8);
      const leadsGrowth = ((totalLeads - previousPeriodLeads) / previousPeriodLeads) * 100;
      
      const avgLeadValue = totalRevenue / Math.max(totalLeads, 1);
      const leadValueGrowth = Math.random() * 20 - 10; // Simulated growth
      
      const activeQuizzes = quizzes.filter(q => !q.archived).length;

      // Calculate top performing quizzes
      const quizPerformance = quizzes.map(quiz => {
        const quizLeads = recentLeads.filter(l => l.quizId === quiz.id);
        const quizResults = recentResults.filter(r => r.quizId === quiz.id);
        const conversionRate = quizResults.length > 0 ? (quizLeads.length / quizResults.length) * 100 : 0;
        
        return {
          id: quiz.id,
          title: quiz.title,
          leads: quizLeads.length,
          revenue: quizLeads.length * 50,
          conversionRate,
          growth: Math.random() * 40 - 20 // Simulated growth
        };
      }).sort((a, b) => b.leads - a.leads).slice(0, 5);

      // Generate conversion funnel
      const totalViews = recentResults.length * 3; // Simulated views
      const totalStarts = recentResults.length;
      const totalCompletions = recentResults.filter(r => r.completedAt).length;
      const totalConversions = recentLeads.length;

      const conversionFunnel = [
        {
          stage: 'Visualizações',
          count: totalViews,
          percentage: 100,
          dropoff: totalViews > 0 ? ((totalViews - totalStarts) / totalViews) * 100 : 0
        },
        {
          stage: 'Iniciaram',
          count: totalStarts,
          percentage: totalViews > 0 ? (totalStarts / totalViews) * 100 : 0,
          dropoff: totalStarts > 0 ? ((totalStarts - totalCompletions) / totalStarts) * 100 : 0
        },
        {
          stage: 'Completaram',
          count: totalCompletions,
          percentage: totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0,
          dropoff: totalCompletions > 0 ? ((totalCompletions - totalConversions) / totalCompletions) * 100 : 0
        },
        {
          stage: 'Converteram',
          count: totalConversions,
          percentage: totalViews > 0 ? (totalConversions / totalViews) * 100 : 0,
          dropoff: 0
        }
      ];

      // Generate channel performance (simulated)
      const channelPerformance = [
        {
          channel: 'Orgânico',
          leads: Math.round(totalLeads * 0.4),
          cost: 0,
          roi: Infinity,
          quality: 85
        },
        {
          channel: 'Facebook Ads',
          leads: Math.round(totalLeads * 0.3),
          cost: Math.round(totalLeads * 0.3 * 15),
          roi: 3.2,
          quality: 78
        },
        {
          channel: 'Google Ads',
          leads: Math.round(totalLeads * 0.2),
          cost: Math.round(totalLeads * 0.2 * 20),
          roi: 2.8,
          quality: 82
        },
        {
          channel: 'Email',
          leads: Math.round(totalLeads * 0.1),
          cost: Math.round(totalLeads * 0.1 * 5),
          roi: 8.5,
          quality: 90
        }
      ];

      // Generate trend data
      const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLeads = Math.round(totalLeads * (0.8 + Math.random() * 0.4));
        return {
          month: month.toLocaleDateString('pt-BR', { month: 'short' }),
          revenue: monthLeads * 50,
          leads: monthLeads,
          avgValue: 50
        };
      }).reverse();

      const leadQualityTrend = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
          score: 70 + Math.random() * 25,
          volume: Math.round(Math.random() * 20)
        };
      }).reverse();

      const conversionTrend = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
          rate: 15 + Math.random() * 15,
          benchmark: 20
        };
      }).reverse();

      // Generate insights
      const opportunities = [
        {
          type: 'growth' as const,
          title: 'Otimizar Quiz de Maior Performance',
          description: `O quiz "${quizPerformance[0]?.title}" está gerando ${quizPerformance[0]?.leads} leads. Considere criar variações similares.`,
          impact: 'high' as const,
          effort: 'medium' as const,
          priority: 1
        },
        {
          type: 'optimization' as const,
          title: 'Melhorar Funil de Conversão',
          description: `${conversionFunnel[1]?.dropoff.toFixed(1)}% dos usuários abandonam após iniciar. Simplifique as primeiras perguntas.`,
          impact: 'high' as const,
          effort: 'low' as const,
          priority: 2
        },
        {
          type: 'growth' as const,
          title: 'Expandir Canal Orgânico',
          description: 'O tráfego orgânico tem a melhor qualidade de leads. Invista em SEO e conteúdo.',
          impact: 'medium' as const,
          effort: 'high' as const,
          priority: 3
        }
      ];

      const alerts = [
        ...(revenueGrowth < 0 ? [{
          type: 'warning' as const,
          title: 'Queda na Receita',
          message: `Receita caiu ${Math.abs(revenueGrowth).toFixed(1)}% no período selecionado.`,
          action: 'Analisar causas'
        }] : []),
        ...(leadsGrowth > 20 ? [{
          type: 'success' as const,
          title: 'Crescimento Acelerado',
          message: `Leads cresceram ${leadsGrowth.toFixed(1)}% no período!`,
          action: 'Manter estratégia'
        }] : []),
        {
          type: 'info' as const,
          title: 'Oportunidade de A/B Test',
          message: 'Alguns quizzes podem se beneficiar de testes A/B para otimizar conversões.',
          action: 'Criar testes'
        }
      ];

      setMetrics({
        overview: {
          totalRevenue,
          revenueGrowth,
          totalLeads,
          leadsGrowth,
          avgLeadValue,
          leadValueGrowth,
          totalQuizzes: quizzes.length,
          activeQuizzes
        },
        performance: {
          topPerformingQuizzes: quizPerformance,
          conversionFunnel,
          channelPerformance
        },
        trends: {
          revenueByMonth,
          leadQualityTrend,
          conversionTrend
        },
        insights: {
          opportunities,
          alerts
        }
      });

    } catch (error) {
      console.error('Error loading executive metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!metrics) return;
    
    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      overview: metrics.overview,
      topQuizzes: metrics.performance.topPerformingQuizzes,
      insights: metrics.insights.opportunities
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-executivo-${selectedPeriod}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dados Insuficientes</h3>
          <p className="text-muted-foreground">
            Não há dados suficientes para gerar o dashboard executivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão estratégica do desempenho dos seus quizzes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {metrics.insights.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.insights.alerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              alert.type === 'success' ? 'bg-green-50 border-green-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {alert.type === 'info' && <Eye className="w-5 h-5 text-blue-600" />}
                  <div>
                    <h4 className="font-semibold">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                {alert.action && (
                  <Button size="sm" variant="outline">
                    {alert.action}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold">R$ {metrics.overview.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.overview.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${metrics.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.overview.revenueGrowth >= 0 ? '+' : ''}{metrics.overview.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Leads</p>
                <p className="text-3xl font-bold">{metrics.overview.totalLeads.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.overview.leadsGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${metrics.overview.leadsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.overview.leadsGrowth >= 0 ? '+' : ''}{metrics.overview.leadsGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Médio por Lead</p>
                <p className="text-3xl font-bold">R$ {metrics.overview.avgLeadValue.toFixed(0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.overview.leadValueGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${metrics.overview.leadValueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.overview.leadValueGrowth >= 0 ? '+' : ''}{metrics.overview.leadValueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quizzes Ativos</p>
                <p className="text-3xl font-bold">{metrics.overview.activeQuizzes}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  de {metrics.overview.totalQuizzes} total
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Performing Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Quizzes por Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.performance.topPerformingQuizzes.map((quiz, index) => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {quiz.leads} leads • {quiz.conversionRate.toFixed(1)}% conversão
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {quiz.revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          {quiz.growth >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={`text-xs ${quiz.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {quiz.growth >= 0 ? '+' : ''}{quiz.growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.performance.channelPerformance.map((channel, index) => (
                    <div key={channel.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{channel.channel}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{channel.leads} leads</span>
                          <Badge variant="outline">
                            ROI: {channel.roi === Infinity ? '∞' : `${channel.roi.toFixed(1)}x`}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={channel.quality} className="flex-1" />
                        <span className="text-sm text-muted-foreground w-12">
                          {channel.quality}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.trends.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `R$ ${value}` : value,
                        name === 'revenue' ? 'Receita' : 'Leads'
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Quality Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Qualidade dos Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.trends.leadQualityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.trends.conversionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Taxa']} />
                  <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} name="Atual" />
                  <Line type="monotone" dataKey="benchmark" stroke="#94A3B8" strokeDasharray="5 5" name="Benchmark" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.performance.conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{stage.count.toLocaleString()} usuários</span>
                        <Badge variant="outline">{stage.percentage.toFixed(1)}%</Badge>
                        {stage.dropoff > 0 && (
                          <Badge variant="destructive">
                            -{stage.dropoff.toFixed(1)}% abandono
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={stage.percentage} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Oportunidades de Crescimento</h3>
            {metrics.insights.opportunities.map((opportunity, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          opportunity.type === 'growth' ? 'default' :
                          opportunity.type === 'optimization' ? 'secondary' : 'destructive'
                        }>
                          {opportunity.type === 'growth' ? 'Crescimento' :
                           opportunity.type === 'optimization' ? 'Otimização' : 'Risco'}
                        </Badge>
                        <Badge variant="outline">
                          Prioridade {opportunity.priority}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-semibold mb-2">{opportunity.title}</h4>
                      <p className="text-muted-foreground mb-4">{opportunity.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>Impacto: {opportunity.impact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Esforço: {opportunity.effort}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      Implementar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ExecutiveDashboard;