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
  LabelList
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
  Clock
} from 'lucide-react';

interface EnhancedAnalyticsProps {
  quizId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function EnhancedAnalytics({ quizId }: EnhancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  // Real data from Supabase
  const [analyticsData, setAnalyticsData] = useState({
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
    deviceData: []
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [quizId, user, timeRange]);

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

      // Try to load analytics events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Handle network or permission errors
      if (eventsError) {
        console.error('Error loading analytics events:', eventsError);
        // Don't throw error for empty data - just show empty state
        if (eventsError.code !== 'PGRST116') { // Row not found error
          throw new Error(`Erro de conexão: ${eventsError.message}`);
        }
      }

      // Try to load quiz leads
      const { data: leads, error: leadsError } = await supabase
        .from('quiz_leads')
        .select('count()', { count: 'exact' })
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (leadsError) {
        console.error('Error loading leads:', leadsError);
        // Don't throw error for empty data - just show 0 leads
        if (leadsError.code !== 'PGRST116') { // Row not found error
          throw new Error(`Erro ao carregar leads: ${leadsError.message}`);
        }
      }

      // Try to load analytics sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (sessionsError) {
        console.warn('Warning: Error loading sessions:', sessionsError);
        // Continue without sessions data for non-critical errors
      }

      // Process data - handle cases where data might be null or empty
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
            // Calculate time from start_time to last step end time
            const stepEndTimes = s.step_end_times || {};
            const lastStepTime = Object.keys(stepEndTimes).length > 0 
              ? Math.max(...Object.values(stepEndTimes)) 
              : s.start_time;
            return acc + (lastStepTime - s.start_time);
          }, 0);
          avgTimeSpent = Math.round(totalTime / completedSessions.length / 1000 / 60); // Convert to minutes
        }
      }
      
      const bounceRate = views > 0 ? Math.round(((views - starts) / views) * 100) : 0;

      // Funnel data
      const funnelData = [
        { name: 'Visualizações', value: views, fill: '#8884d8' },
        { name: 'Iniciaram', value: starts, fill: '#82ca9d' },
        { name: 'Completaram', value: completions, fill: '#8dd1e1' }
      ];

      // Time series data (simplified)
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

        timeSeriesArray = Object.values(timeSeriesData).slice(-7); // Last 7 days
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
        questionAnalytics: [], // Would need to process question-specific data
        sourceData: [], // Would need to process UTM/source data
        deviceData: [] // Would need to process device info
      });
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Falha ao carregar dados de analytics. Verifique sua conexão e tente novamente.');
      // Show empty state instead of error when there's no critical failure
      setAnalyticsData({
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
        deviceData: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Retry mechanism with exponential backoff
  const retryWithBackoff = async (attempt: number = 0) => {
    const maxRetries = 3;
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
    
    if (attempt > 0) {
      // Show retrying state
      setError(`Tentando novamente... (${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    try {
      await loadAnalyticsData();
    } catch (err) {
      if (attempt < maxRetries) {
        setRetryCount(attempt + 1);
        retryWithBackoff(attempt + 1);
      } else {
        setError('Falha ao carregar dados após várias tentativas. Verifique sua conexão e tente novamente.');
        setRetryCount(0);
      }
    }
  };

  // Wrapper for manual retry
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    retryWithBackoff(0);
  };

  // Auto-retry on network errors
  useEffect(() => {
    if (error && error.includes('network') && retryCount < 3) {
      const timer = setTimeout(() => {
        retryWithBackoff(retryCount + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const exportData = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    const filename = `quiz-analytics-${quizId}-${new Date().toISOString().split('T')[0]}.${format}`;
    console.log(`Exportando dados como ${format}: ${filename}`);
    // In real app, this would generate and download the file
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
            <Button onClick={handleRetry}>Tentar novamente</Button>
            <Button variant="outline" onClick={() => {
              setError(null);
              setAnalyticsData({
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
                deviceData: []
              });
            }}>
              Ver estado vazio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!analyticsData || 
      (analyticsData.overview.totalViews === 0 && 
       analyticsData.overview.totalStarts === 0 && 
       analyticsData.overview.totalCompletions === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-4xl mb-4">📈</div>
        <p className="text-lg font-medium">Nenhum dado disponível ainda</p>
        <p className="text-sm text-gray-400 mt-1">
          Os dados de analytics aparecerão aqui quando seu quiz for acessado.
        </p>
        <button 
          onClick={loadAnalyticsData}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Atualizar dados
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avançado</h2>
          <p className="text-muted-foreground">
            Insights detalhados sobre performance do quiz
          </p>
        </div>
        
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards - Add null checks */}
      {analyticsData && analyticsData.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analyticsData.overview.totalViews || 0).toLocaleString()}</div>
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
              <div className="text-2xl font-bold">{(analyticsData.overview.conversionRate || 0)}%</div>
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
              <div className="text-2xl font-bold">{(analyticsData.overview.avgTimeSpent || 0)}min</div>
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
              <div className="text-2xl font-bold">{(analyticsData.overview.totalLeads || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">+18</span> vs período anterior
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs - Add null checks */}
      {analyticsData && (
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="funnel">Funil</TabsTrigger>
            <TabsTrigger value="questions">Perguntas</TabsTrigger>
            <TabsTrigger value="audience">Audiência</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.timeSeriesData || []}>
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
                      data={analyticsData.funnelData || []}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise por Pergunta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(analyticsData.questionAnalytics || []).map((question, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-medium">{question.question}</h4>
                    <div className="space-y-2">
                      {(question.responses || []).map((response, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded">
                          <span className="text-sm">{response.answer}</span>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{response.count}</div>
                            <Badge variant="secondary">{response.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.sourceData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(analyticsData.sourceData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dispositivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.deviceData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="device" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}