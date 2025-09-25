import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { quizzesApi, responsesApi } from '@/lib/supabaseApi';
import { useAuth } from '@/components/SimpleAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { errorHandler } from '@/lib/errorHandling';
import { BarChart3, Users, TrendingUp, Eye, RefreshCw } from 'lucide-react';

interface QuizStats {
  totalResponses: number;
  averageScore: number;
  completionRate: number;
  topPerformingQuestions: Array<{
    questionId: string;
    questionTitle: string;
    averageScore: number;
    responseCount: number;
  }>;
  responsesByDate: Array<{
    date: string;
    count: number;
  }>;
}

interface QuizAnalyticsProps {
  quizId: string;
}

export const QuizAnalytics = ({ quizId }: QuizAnalyticsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && quizId) {
      loadAnalytics();
    }
  }, [user, quizId]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar respostas do quiz
      const responses = await responsesApi.getByQuizId(quizId);
      
      if (responses.length === 0) {
        setStats(null);
        return;
      }

      // Calcular estatísticas
      const totalResponses = responses.length;
      const completedResponses = responses.filter(r => r.completedAt);
      const completionRate = (completedResponses.length / totalResponses) * 100;
      const averageScore = completedResponses.reduce((sum, r) => sum + (r.score || 0), 0) / completedResponses.length;

      // Agrupar respostas por data
      const responsesByDate = responses.reduce((acc, response) => {
        const date = new Date(response.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statsData: QuizStats = {
        totalResponses,
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        topPerformingQuestions: [], // TODO: Implementar análise por pergunta
        responsesByDate: Object.entries(responsesByDate).map(([date, count]) => ({
          date,
          count
        })).sort((a, b) => a.date.localeCompare(b.date))
      };

      setStats(statsData);
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'QuizAnalytics.loadAnalytics',
        userId: user.id,
        quizId
      });
      
      toast({
        title: "Erro ao carregar analytics",
        description: "Não foi possível carregar as estatísticas do quiz.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = () => {
    loadAnalytics();
    toast({
      title: "Analytics atualizados",
      description: "Os dados foram recarregados com sucesso."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics do Quiz
          </CardTitle>
          <CardDescription>
            Não há dados suficientes para exibir analytics ainda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Quando pessoas começarem a responder seu quiz, você verá estatísticas detalhadas aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics do Quiz
        </h2>
        <Button onClick={refreshAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              pessoas responderam
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontuação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              pontos em média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              completaram o quiz
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Pergunta</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topPerformingQuestions[0]?.averageScore.toFixed(1) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              pontuação média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList>
          <TabsTrigger value="questions">Perguntas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Pergunta</CardTitle>
              <CardDescription>
                Veja como cada pergunta está performando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topPerformingQuestions.map((question, index) => (
                  <div key={question.questionId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{question.questionTitle}</h4>
                      <p className="text-sm text-muted-foreground">
                        {question.responseCount} respostas
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {question.averageScore.toFixed(1)} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Respostas por Data</CardTitle>
              <CardDescription>
                Acompanhe o engajamento ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.responsesByDate.map((entry) => (
                  <div key={entry.date} className="flex items-center justify-between p-2 border-b">
                    <span className="text-sm">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                    <Badge variant="outline">{entry.count} respostas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizAnalytics;