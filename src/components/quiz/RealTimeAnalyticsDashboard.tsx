import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Target,
  Calendar,
  Download,
  Filter,
  Share,
  Clock,
  RefreshCw,
  Activity
} from 'lucide-react';

interface RealTimeAnalyticsDashboardProps {
  quizId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalStarts: number;
    totalCompletions: number;
    totalLeads: number;
    conversionRate: number;
    avgTimeSpent: number;
    bounceRate: number;
  };
  funnelData: any[];
  timeSeriesData: any[];
  questionAnalytics: any[];
  sourceData: any[];
  deviceData: any[];
  leadData: any[];
  realTimeData: any[];
}

export function RealTimeAnalyticsDashboard({ quizId }: RealTimeAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real data from Supabase
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalViews: 0,
      totalStarts: 0,
      totalCompletions: 0,
      totalLeads: 0,
      conversionRate: 0,
      avgTimeSpent: 0,
      bounceRate: 0
    },
    funnelData: [],
    timeSeriesData: [],
    questionAnalytics: [],
    sourceData: [],
    deviceData: [],
    leadData: [],
    realTimeData: []
  });

  useEffect(() => {
    loadAnalyticsData();
    
    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAnalyticsData();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizId, user, timeRange, autoRefresh]);

  const loadAnalyticsData = async () => {
    if (!user) {
      setError('Você precisa estar logado para ver os analytics');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Load analytics events
      const startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Load analytics events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (eventsError && eventsError.code !== 'PGRST116') {
        throw new Error(`Erro de conexão: ${eventsError.message}`);
      }

      // Load quiz leads
      const { data: leads, error: leadsError } = await supabase
        .from('quiz_leads')
        .select('count()', { count: 'exact' })
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (leadsError && leadsError.code !== 'PGRST116') {
        throw new Error(`Erro ao carregar leads: ${leadsError.message}`);
      }

      // Load analytics sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Process data
      const views = events ? events.filter(e => e.event_type === 'view').length : 0;
      const starts = events ? events.filter(e => e.event_type === 'start').length : 0;
      const completions = events ? events.filter(e => e.event_type === 'complete').length : 0;
      const leadCaptures = events ? events.filter(e => e.event_type === 'lead_capture').length : 0;
      const leadCount = leads && leads.length > 0 ? (leads[0]?.count || leadCaptures || 0) : (leadCaptures || 0);
      
      const conversionRate = views > 0 ? Math.round((completions / views) * 100) : 0;
      
      // Calculate average time spent from session data
      let avgTimeSpent = 0;
      if (sessions && sessions.length > 0) {
        const completedSessions = sessions.filter(s => s.completed);
        if (completedSessions.length > 0) {
          const totalTime = completedSessions.reduce((acc, s) => {
            const stepEndTimes = s.step_end_times || {};
            const lastStepTime = Object.keys(stepEndTimes).length > 0 
              ? Math.max(...Object.values(stepEndTimes)) 
              : s.start_time;
            return acc + (lastStepTime - s.start_time);
          }, 0);
          avgTimeSpent = Math.round(totalTime / completedSessions.length / 1000 / 60);
        }
      }
      
      const bounceRate = views > 0 ? Math.round(((views - starts) / views) * 100) : 0;

      // Funnel data
      const funnelData = [
        { name: 'Visualizações', value: views, fill: '#8884d8' },
        { name: 'Iniciaram', value: starts, fill: '#82ca9d' },
        { name: 'Completaram', value: completions, fill: '#8dd1e1' }
      ];

      // Time series data
      let timeSeriesArray = [];
      if (events) {
        const timeSeriesData = events.reduce((acc, event) => {
          const date = new Date(event.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, views: 0, starts: 0, completions: 0, leads: 0 };
          }
          acc[date][event.event_type === 'view' ? 'views' : 
                    event.event_type === 'start' ? 'starts' : 
                    event.event_type === 'complete' ? 'completions' : 'leads'] += 1;
          return acc;
        }, {} as Record<string, any>);

        timeSeriesArray = Object.values(timeSeriesData).slice(-30); // Last 30 days
      }

      // Real-time data (last 24 hours)
      let realTimeData = [];
      if (events) {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const hourlyData = events
          .filter(event => new Date(event.created_at) > twentyFourHoursAgo)
          .reduce((acc, event) => {
            const hour = new Date(event.created_at).getHours();
            if (!acc[hour]) {
              acc[hour] = { hour, views: 0, starts: 0, completions: 0, leads: 0 };
            }
            acc[hour][event.event_type === 'view' ? 'views' : 
                      event.event_type === 'start' ? 'starts' : 
                      event.event_type === 'complete' ? 'completions' : 'leads'] += 1;
            return acc;
          }, {} as Record<string, any>);
        
        realTimeData = Object.values(hourlyData);
      }

      setAnalyticsData({
        overview: {
          totalViews: views,
          totalStarts: starts,
          totalCompletions: completions,
          totalLeads: leadCount,
          conversionRate,
          avgTimeSpent,
          bounceRate
        },
        funnelData,
        timeSeriesData: timeSeriesArray,
        questionAnalytics: [],
        sourceData: [],
        deviceData: [],
        leadData: leads || [],
        realTimeData
      });
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Falha ao carregar dados de analytics. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    const filename = `quiz-analytics-${quizId}-${new Date().toISOString().split('T')[0]}.${format}`;
    console.log(`Exportando dados como ${format}: ${filename}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <TrendingUp className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar analytics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={loadAnalyticsData}>Tentar novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics em Tempo Real</h2>
          <p className="text-muted-foreground">
            Insights detalhados sobre performance do quiz
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAnalyticsData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="w-4 h-4 mr-1" />
              Auto
            </Button>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Last updated indicator */}
      <div className="text-right text-sm text-muted-foreground">
        Última atualização: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+12%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+3.2%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.avgTimeSpent}min</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 font-medium">-0.3min</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+18</span> vs período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance ao Longo do Tempo</CardTitle>
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
                  <Line type="monotone" dataKey="starts" stroke="#82ca9d" name="Iniciaram" />
                  <Line type="monotone" dataKey="completions" stroke="#ffc658" name="Completaram" />
                  <Line type="monotone" dataKey="leads" stroke="#ff7c7c" name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade em Tempo Real (Últimas 24h)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize a atividade do quiz nas últimas 24 horas
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.realTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="views" stackId="1" stroke="#8884d8" fill="#8884d8" name="Visualizações" />
                  <Area type="monotone" dataKey="starts" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Iniciaram" />
                  <Area type="monotone" dataKey="completions" stackId="1" stroke="#ffc658" fill="#ffc658" name="Completaram" />
                  <Area type="monotone" dataKey="leads" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" name="Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize onde os usuários abandonam o quiz
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={analyticsData.funnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" stroke="none" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências de Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#8884d8" name="Visualizações" />
                  <Bar dataKey="starts" fill="#82ca9d" name="Iniciaram" />
                  <Bar dataKey="completions" fill="#ffc658" name="Completaram" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads Capturados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detalhes dos leads gerados pelo quiz
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.leadData.slice(0, 5).map((lead: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{lead.name || 'Nome não informado'}</div>
                      <div className="text-sm text-muted-foreground">{lead.email || lead.phone || 'Contato não informado'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{new Date(lead.created_at).toLocaleDateString()}</div>
                      <Badge variant="secondary">Novo</Badge>
                    </div>
                  </div>
                ))}
                
                {analyticsData.leadData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum lead capturado ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}