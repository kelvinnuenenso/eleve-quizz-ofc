import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingDown, 
  Users, 
  Eye, 
  Play, 
  CheckCircle, 
  UserPlus,
  ArrowDown,
  AlertTriangle,
  Target,
  Clock,
  Percent,
  Download,
  Filter
} from 'lucide-react';
import { realAnalytics } from '@/lib/analytics';
import { localDB } from '@/lib/localStorage';
import { Quiz } from '@/types/quiz';

interface ConversionFunnelProps {
  quizId: string;
  quiz?: Quiz;
  dateRange?: string;
}

interface FunnelStep {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  avgTimeSpent: number;
  icon: React.ReactNode;
  color: string;
  insights: string[];
}

interface FunnelData {
  steps: FunnelStep[];
  totalViews: number;
  conversionRate: number;
  avgSessionTime: number;
  topDropoffPoints: Array<{
    step: string;
    rate: number;
    reason: string;
  }>;
  improvements: Array<{
    step: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export function ConversionFunnel({ quizId, quiz, dateRange = '7d' }: ConversionFunnelProps) {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('percentage');

  useEffect(() => {
    loadFunnelData();
  }, [quizId, dateRange]);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      
      // Get analytics data
      const analyticsData = realAnalytics.getAnalyticsData(quizId);
      const results = localDB.getResults().filter(r => r.quizId === quizId);
      const leads = localDB.getLeads().filter(l => l.quizId === quizId);
      
      if (!analyticsData) {
        setFunnelData(null);
        return;
      }

      // Calculate funnel steps
      const totalViews = analyticsData.totalViews || 0;
      const totalStarts = analyticsData.totalStarts || 0;
      const totalCompletions = analyticsData.totalCompletions || 0;
      const totalLeads = leads.length;

      // Calculate question-level dropoffs
      const questionDropoffs = quiz?.questions.map((question, index) => {
        const answersAtStep = results.filter(r => 
          r.answers.length > index
        ).length;
        
        const previousStep = index === 0 ? totalStarts : 
          results.filter(r => r.answers.length > index - 1).length;
        
        const dropoffRate = previousStep > 0 ? 
          ((previousStep - answersAtStep) / previousStep) * 100 : 0;

        return {
          questionIndex: index,
          questionTitle: question.title,
          answersAtStep,
          dropoffRate,
          avgTimeSpent: Math.random() * 30 + 10 // Simulated for now
        };
      }) || [];

      // Build funnel steps
      const steps: FunnelStep[] = [
        {
          id: 'views',
          name: 'Visualizações',
          description: 'Usuários que visualizaram o quiz',
          count: totalViews,
          percentage: 100,
          dropoffRate: totalViews > 0 ? ((totalViews - totalStarts) / totalViews) * 100 : 0,
          avgTimeSpent: 0,
          icon: <Eye className="w-5 h-5" />,
          color: '#3B82F6',
          insights: [
            totalViews > 100 ? 'Boa visibilidade do quiz' : 'Considere melhorar a divulgação',
            'Taxa de clique inicial pode ser otimizada'
          ]
        },
        {
          id: 'starts',
          name: 'Iniciaram',
          description: 'Usuários que começaram o quiz',
          count: totalStarts,
          percentage: totalViews > 0 ? (totalStarts / totalViews) * 100 : 0,
          dropoffRate: totalStarts > 0 ? ((totalStarts - totalCompletions) / totalStarts) * 100 : 0,
          avgTimeSpent: analyticsData.avgCompletionTime || 0,
          icon: <Play className="w-5 h-5" />,
          color: '#10B981',
          insights: [
            totalStarts / totalViews > 0.3 ? 'Boa taxa de engajamento inicial' : 'Título e descrição podem ser melhorados',
            'Primeira impressão é crucial'
          ]
        }
      ];

      // Add question steps
      questionDropoffs.forEach((q, index) => {
        steps.push({
          id: `question-${index}`,
          name: `Pergunta ${index + 1}`,
          description: q.questionTitle.substring(0, 50) + '...',
          count: q.answersAtStep,
          percentage: totalStarts > 0 ? (q.answersAtStep / totalStarts) * 100 : 0,
          dropoffRate: q.dropoffRate,
          avgTimeSpent: q.avgTimeSpent,
          icon: <Target className="w-5 h-5" />,
          color: index % 2 === 0 ? '#F59E0B' : '#EF4444',
          insights: [
            q.dropoffRate > 20 ? 'Alta taxa de abandono nesta pergunta' : 'Pergunta com boa retenção',
            q.avgTimeSpent > 30 ? 'Usuários demoram para responder' : 'Resposta rápida'
          ]
        });
      });

      // Add completion and lead steps
      steps.push(
        {
          id: 'completions',
          name: 'Completaram',
          description: 'Usuários que finalizaram o quiz',
          count: totalCompletions,
          percentage: totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0,
          dropoffRate: totalCompletions > 0 ? ((totalCompletions - totalLeads) / totalCompletions) * 100 : 0,
          avgTimeSpent: 0,
          icon: <CheckCircle className="w-5 h-5" />,
          color: '#8B5CF6',
          insights: [
            totalCompletions / totalStarts > 0.7 ? 'Excelente taxa de conclusão' : 'Considere reduzir o número de perguntas',
            'Resultado final é atrativo'
          ]
        },
        {
          id: 'leads',
          name: 'Viraram Leads',
          description: 'Usuários que forneceram contato',
          count: totalLeads,
          percentage: totalStarts > 0 ? (totalLeads / totalStarts) * 100 : 0,
          dropoffRate: 0,
          avgTimeSpent: 0,
          icon: <UserPlus className="w-5 h-5" />,
          color: '#EC4899',
          insights: [
            totalLeads / totalCompletions > 0.5 ? 'Boa conversão para leads' : 'Oferta pode ser mais atrativa',
            'Formulário de captura otimizado'
          ]
        }
      );

      // Identify top dropoff points
      const topDropoffPoints = steps
        .filter(s => s.dropoffRate > 0)
        .sort((a, b) => b.dropoffRate - a.dropoffRate)
        .slice(0, 3)
        .map(s => ({
          step: s.name,
          rate: s.dropoffRate,
          reason: s.dropoffRate > 30 ? 'Alto abandono' : s.dropoffRate > 15 ? 'Abandono moderado' : 'Abandono baixo'
        }));

      // Generate improvement suggestions
      const improvements = [
        {
          step: 'Visualizações → Iniciaram',
          suggestion: 'Melhore o título e descrição do quiz para aumentar o interesse',
          impact: 'high' as const
        },
        {
          step: 'Perguntas',
          suggestion: 'Reduza perguntas com alta taxa de abandono ou simplifique-as',
          impact: 'high' as const
        },
        {
          step: 'Completaram → Leads',
          suggestion: 'Ofereça um incentivo mais atrativo para captura de contato',
          impact: 'medium' as const
        }
      ];

      setFunnelData({
        steps,
        totalViews,
        conversionRate: totalViews > 0 ? (totalLeads / totalViews) * 100 : 0,
        avgSessionTime: analyticsData.avgCompletionTime || 0,
        topDropoffPoints,
        improvements
      });

    } catch (error) {
      console.error('Error loading funnel data:', error);
      setFunnelData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportFunnelData = () => {
    if (!funnelData) return;
    
    const csvData = funnelData.steps.map(step => ({
      'Etapa': step.name,
      'Usuários': step.count,
      'Percentual': `${step.percentage.toFixed(1)}%`,
      'Taxa de Abandono': `${step.dropoffRate.toFixed(1)}%`,
      'Tempo Médio': `${step.avgTimeSpent.toFixed(1)}s`
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funil-conversao-${quizId}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dados Insuficientes</h3>
          <p className="text-muted-foreground">
            Não há dados suficientes para gerar o funil de conversão.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Funil de Conversão</h2>
          <p className="text-muted-foreground">
            Análise detalhada do caminho do usuário
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'absolute' | 'percentage') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentual</SelectItem>
              <SelectItem value="absolute">Números Absolutos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportFunnelData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Visualizações</p>
                <p className="text-2xl font-bold">{funnelData.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{funnelData.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{Math.round(funnelData.avgSessionTime / 60)}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maior Abandono</p>
                <p className="text-2xl font-bold">
                  {funnelData.topDropoffPoints[0]?.rate.toFixed(1) || '0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funil Visual</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="improvements">Melhorias</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          {/* Funnel Visualization */}
          <div className="space-y-4">
            {funnelData.steps.map((step, index) => {
              const isSelected = selectedStep === step.id;
              const nextStep = funnelData.steps[index + 1];
              
              return (
                <div key={step.id} className="space-y-2">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedStep(isSelected ? null : step.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="p-3 rounded-full"
                            style={{ backgroundColor: `${step.color}20`, color: step.color }}
                          >
                            {step.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{step.name}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-2xl font-bold">
                                {viewMode === 'absolute' 
                                  ? step.count.toLocaleString()
                                  : `${step.percentage.toFixed(1)}%`
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {viewMode === 'absolute' ? 'usuários' : 'do total'}
                              </p>
                            </div>
                            
                            {step.dropoffRate > 0 && (
                              <div className="text-right">
                                <Badge variant={step.dropoffRate > 30 ? 'destructive' : step.dropoffRate > 15 ? 'secondary' : 'default'}>
                                  -{step.dropoffRate.toFixed(1)}%
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">abandono</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <Progress 
                          value={step.percentage} 
                          className="h-3"
                          style={{ 
                            '--progress-background': step.color 
                          } as React.CSSProperties}
                        />
                      </div>

                      {/* Expanded Details */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Usuários</p>
                              <p className="text-muted-foreground">{step.count.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-medium">Percentual</p>
                              <p className="text-muted-foreground">{step.percentage.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="font-medium">Taxa de Abandono</p>
                              <p className="text-muted-foreground">{step.dropoffRate.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="font-medium">Tempo Médio</p>
                              <p className="text-muted-foreground">{step.avgTimeSpent.toFixed(1)}s</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium mb-2">Insights:</p>
                            <ul className="space-y-1">
                              {step.insights.map((insight, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Arrow between steps */}
                  {nextStep && (
                    <div className="flex justify-center">
                      <ArrowDown className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Principais Pontos de Abandono</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {funnelData.topDropoffPoints.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{point.step}</p>
                      <p className="text-sm text-muted-foreground">{point.reason}</p>
                    </div>
                    <Badge variant="destructive">
                      {point.rate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de Engajamento Inicial</span>
                    <Badge variant={funnelData.steps[1]?.percentage > 30 ? 'default' : 'secondary'}>
                      {funnelData.steps[1]?.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de Conclusão</span>
                    <Badge variant={funnelData.steps.find(s => s.id === 'completions')?.percentage > 70 ? 'default' : 'secondary'}>
                      {funnelData.steps.find(s => s.id === 'completions')?.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversão Final</span>
                    <Badge variant={funnelData.conversionRate > 20 ? 'default' : 'secondary'}>
                      {funnelData.conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <div className="space-y-4">
            {funnelData.improvements.map((improvement, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge variant={
                      improvement.impact === 'high' ? 'destructive' :
                      improvement.impact === 'medium' ? 'secondary' : 'outline'
                    }>
                      {improvement.impact === 'high' ? 'Alto Impacto' :
                       improvement.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{improvement.step}</h4>
                      <p className="text-muted-foreground">{improvement.suggestion}</p>
                    </div>
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

export default ConversionFunnel;