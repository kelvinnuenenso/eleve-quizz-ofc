import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { localDB } from '@/lib/localStorage';
import { realAnalytics } from '@/lib/analytics';
import { supabaseSync } from '@/lib/supabaseSync';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Eye, 
  Download,
  Calendar,
  MapPin,
  Smartphone,
  Clock,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface AnalyticsProps {
  quizId: string;
}

interface AnalyticsData {
  totalViews: number;
  totalStarts: number;
  totalCompletions: number;
  totalLeads: number;
  conversionRate: number;
  completionRate: number;
  avgCompletionTime: number;
  dailyData: Array<{
    date: string;
    views: number;
    starts: number;
    completions: number;
    leads: number;
  }>;
  outcomeDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  timeSpentData: Array<{
    question: string;
    avgTime: number;
  }>;
  dropoffPoints: Array<{
    step: number;
    dropoffRate: number;
  }>;
}

export function AnalyticsDashboard({ quizId }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [quizId, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // 1. Try to get data from Supabase first (PRODUCTION DATA)
      const dateStart = new Date(Date.now() - (parseInt(dateRange) || 7) * 24 * 60 * 60 * 1000).toISOString();
      const supabaseData = await supabaseSync.getAnalyticsFromSupabase(quizId, dateStart);
      
      // 2. Get REAL analytics data from local system
      const realAnalyticsData = realAnalytics.getAnalyticsData(quizId);
      
      // 3. Trigger background sync
      supabaseSync.syncAllLocalData();
      
      if (supabaseData || realAnalyticsData) {
        let analyticsData;
        
        if (realAnalyticsData) {
          // Use processed data from analytics system
          analyticsData = realAnalyticsData;
        } else if (supabaseData) {
          // Process raw Supabase data into analytics format
          const { events, sessions } = supabaseData;
          const totalStarts = sessions.length;
          const totalCompletions = sessions.filter((s: any) => s.completed_at).length;
          const leadEvents = events.filter((e: any) => e.event_type === 'lead_capture');
          const totalLeads = leadEvents.length;
          
          analyticsData = {
            totalViews: events.filter((e: any) => e.event_type === 'quiz_view').length,
            totalStarts,
            totalCompletions,
            totalLeads,
            conversionRate: totalStarts > 0 ? Math.round((totalLeads / totalStarts) * 100) : 0,
            completionRate: totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0,
            avgCompletionTime: sessions.length > 0 ? sessions.reduce((acc: number, s: any) => acc + (s.completion_time || 0), 0) / sessions.length : 0,
            deviceBreakdown: [
              { device: 'Mobile', count: 0, percentage: 0 },
              { device: 'Desktop', count: 0, percentage: 0 }
            ],
            timeSpentData: [],
            dropOffPoints: [],
            dailyData: []
          };
        }
        
        if (analyticsData) {
          const {
            totalViews,
            totalStarts, 
            totalCompletions,
            totalLeads,
            conversionRate,
            completionRate,
            avgCompletionTime,
            deviceBreakdown,
            timeSpentData,
            dropOffPoints,
            dailyData
          } = analyticsData;

        // Get quiz results from localStorage for outcome distribution
        const results = localDB.getQuizResults(quizId);
        const outcomeCount: Record<string, number> = {};
        results.forEach(r => {
          if (r.outcomeKey) {
            outcomeCount[r.outcomeKey] = (outcomeCount[r.outcomeKey] || 0) + 1;
          }
        });

        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        const outcomeDistribution = Object.entries(outcomeCount).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: colors[index % colors.length]
        }));

        setAnalytics({
          totalViews,
          totalStarts,
          totalCompletions,
          totalLeads,
          conversionRate,
          completionRate,
          avgCompletionTime,
          dailyData,
          outcomeDistribution,
          deviceBreakdown,
          timeSpentData,
          dropoffPoints: dropOffPoints
        });
        }
      } else {
        // Fallback to localStorage data if no analytics data available
        const results = localDB.getQuizResults(quizId);
        const leads = localDB.getQuizLeads(quizId);

        const totalStarts = results.length;
        const totalCompletions = results.filter(r => r.completedAt).length;
        const totalLeads = leads.length;
        const conversionRate = totalStarts > 0 ? Math.round((totalLeads / totalStarts) * 100) : 0;
        const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0;

        // Generate fallback data if no real data exists
        const dailyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            views: 0,
            starts: 0,
            completions: 0,
            leads: 0
          };
        });

        setAnalytics({
          totalViews: 0,
          totalStarts,
          totalCompletions,
          totalLeads,
          conversionRate,
          completionRate,
          avgCompletionTime: 0,
          dailyData,
          outcomeDistribution: [],
          deviceBreakdown: [
            { device: 'Mobile', count: 0, percentage: 0 },
            { device: 'Desktop', count: 0, percentage: 0 },
            { device: 'Tablet', count: 0, percentage: 0 }
          ],
          timeSpentData: [],
          dropoffPoints: []
        });
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Analytics do Quiz</h3>
          <p className="text-muted-foreground">
            Insights detalhados sobre performance e engajamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Últimos 7 dias
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visualizações</p>
              <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Iniciados</p>
              <p className="text-2xl font-bold">{analytics.totalStarts.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leads</p>
              <p className="text-2xl font-bold">{analytics.totalLeads.toLocaleString()}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversão</p>
              <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Completion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Taxa de conclusão</p>
              <Badge variant="secondary">{analytics.completionRate}%</Badge>
            </div>
            <Progress value={analytics.completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {analytics.totalCompletions} de {analytics.totalStarts} completaram
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Taxa de conversão</p>
              <Badge variant="secondary">{analytics.conversionRate}%</Badge>
            </div>
            <Progress value={analytics.conversionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {analytics.totalLeads} leads capturados
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo médio</p>
              <p className="text-2xl font-bold">
                {Math.round(analytics.avgCompletionTime)}min
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="outcomes">Resultados</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Atividade nos últimos 7 dias</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="starts" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="completions" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Distribuição de Resultados</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.outcomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.outcomeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Detalhes dos Resultados</h4>
              <div className="space-y-3">
                {analytics.outcomeDistribution.map((outcome, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: outcome.color }}
                      />
                      <span className="text-sm font-medium">{outcome.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{outcome.value}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((outcome.value / analytics.totalCompletions) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Tempo por Pergunta</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.timeSpentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Math.round(value as number)}s`, 'Tempo médio']} />
                  <Bar dataKey="avgTime" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Pontos de Abandono</h4>
              <div className="space-y-3">
                {analytics.dropoffPoints.map((point, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pergunta {point.step}</span>
                      <span className="text-sm text-destructive font-medium">{point.dropoffRate}%</span>
                    </div>
                    <Progress value={point.dropoffRate} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Dispositivos Utilizados</h4>
            <div className="space-y-4">
              {analytics.deviceBreakdown.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{device.device}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {device.percentage}%
                    </span>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      ({device.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}