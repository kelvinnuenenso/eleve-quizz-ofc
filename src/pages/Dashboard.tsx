import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listQuizzes, saveQuiz } from '@/lib/quizzes';
import { quizzesApi } from '@/lib/supabaseApi';
import { localDB } from '@/lib/localStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Quiz } from '@/types/quiz';
import { generateTestAnalyticsData, clearTestAnalyticsData } from '@/lib/generateTestAnalytics';
import {
  Plus,
  BarChart3,
  Users,
  Eye,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  LogOut,
  Settings as SettingsIcon,
  Download,
  MousePointer,
  Trophy,
  Target,
  Mail,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuizImporter from '@/components/quiz/QuizImporter';
import { HeatmapAnalytics } from '@/components/analytics/HeatmapAnalytics';
import { ABTestingManager } from '@/components/analytics/ABTestingManager';
import { CohortAnalysis } from '@/components/analytics/CohortAnalysis';
import { AchievementSystem } from '@/components/gamification/AchievementSystem';
import LeadsManager from '@/components/quiz/LeadsManager';
import { WebhookManager } from '@/components/integrations/WebhookManager';
import { ThemeToggle } from '@/components/ThemeToggle';


const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, session } = useAuth();
  const { isDemoMode, exitDemoMode, demoUser } = useDemoMode();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      if (user && session) {
        try {
          const response = await fetch('/api/consolidated/quizzes', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setQuizzes(data.data || []);
            return;
          } else {
            console.warn('Failed to load from API, falling back to localStorage');
          }
        } catch (apiError) {
          console.warn('Failed to load from API, falling back to localStorage:', apiError);
        }
      }
      
      // Fallback to localStorage
      const loadedQuizzes = await listQuizzes();
      setQuizzes(loadedQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    setIsCreating(true);
    try {
      const newQuizData = {
        name: 'Novo Quiz', // Corrigido: usar 'name' ao invés de 'title'
        description: 'Descreva seu quiz aqui...',
        status: 'draft',
        theme: {
          primary: '#2563EB',
          background: '#FFFFFF',
          text: '#0B0B0B'
        },
        settings: {
          progressBar: true,
          requireEmail: false
        },
        questions: [
          {
            id: crypto.randomUUID(),
            idx: 1,
            type: 'single',
            title: 'Qual é sua primeira pergunta?',
            description: 'Edite esta pergunta para começar',
            options: [
              { id: '1', label: 'Opção A', score: 10 },
              { id: '2', label: 'Opção B', score: 5 }
            ],
            required: true
          }
        ],
        outcomes: {
          default: {
            title: 'Obrigado pela participação!',
            description: 'Recebemos suas respostas e entraremos em contato em breve.',
            cta: {
              label: 'Falar no WhatsApp',
              href: '#'
            }
          }
        }
      };

      if (user && session) {
        try {
          console.log('User authenticated:', { userId: user.id, hasToken: !!session.access_token });
          console.log('Creating quiz with data:', newQuizData);
          
          const response = await fetch('/api/consolidated/quizzes', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newQuizData)
          });
          
          console.log('API Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            await loadQuizzes();
            
            toast({
              title: "Quiz criado com sucesso!",
              description: "Você pode começar a editá-lo agora."
            });

            navigate(`/app/edit/${data.data.id}`);
            return;
          } else {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(errorData.error || 'Erro ao criar quiz');
          }
        } catch (apiError) {
          console.warn('Failed to create via API, falling back to localStorage:', apiError);
          toast({
            title: "Erro ao criar quiz",
            description: apiError.message || "Tente novamente mais tarde.",
            variant: "destructive"
          });
        }
      } else {
        console.log('User not authenticated:', { user: !!user, session: !!session });
        // Fallback to localStorage for non-authenticated users
        const newQuiz: Quiz = {
          id: crypto.randomUUID(),
          publicId: Math.random().toString(36).slice(2, 8),
          ...newQuizData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveQuiz(newQuiz);
        await loadQuizzes();
        
        toast({
          title: "Quiz criado com sucesso!",
          description: "Você pode começar a editá-lo agora."
        });

        navigate(`/app/edit/${newQuiz.id}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Erro ao criar quiz",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyPublicLink = (publicId: string) => {
    const url = `${window.location.origin}/quiz/${publicId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link do quiz foi copiado para sua área de transferência."
    });
  };

  const getQuizStats = async (quizId: string) => {
    // Verificar se estamos em modo demo
    if (isDemoMode) {
      // Retornar estatísticas demo
      return {
        totalStarts: 142,
        totalLeads: 85,
        conversionRate: 60
      };
    }
    
    // Carregar dados reais do Supabase para usuários autenticados
    try {
      const { data: responses, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('quiz_id', quizId);
      
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('quiz_id', quizId);
      
      if (responsesError || leadsError) {
        console.error('Error fetching quiz stats:', responsesError || leadsError);
        // Fallback to localStorage
        const results = localDB.getQuizResults(quizId);
        const localLeads = localDB.getQuizLeads(quizId);
        
        return {
          totalStarts: results.length,
          totalLeads: localLeads.length,
          conversionRate: results.length > 0 ? Math.round((localLeads.length / results.length) * 100) : 0
        };
      }
      
      const totalStarts = responses?.length || 0;
      const totalLeads = leads?.length || 0;
      
      return {
        totalStarts,
        totalLeads,
        conversionRate: totalStarts > 0 ? Math.round((totalLeads / totalStarts) * 100) : 0
      };
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      // Fallback to localStorage
      const results = localDB.getQuizResults(quizId);
      const localLeads = localDB.getQuizLeads(quizId);
      
      return {
        totalStarts: results.length,
        totalLeads: localLeads.length,
        conversionRate: results.length > 0 ? Math.round((localLeads.length / results.length) * 100) : 0
      };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateTestData = async () => {
    try {
      await generateTestAnalyticsData();
      toast({
        title: "Dados de teste gerados!",
        description: "Analytics de teste foram criados com sucesso."
      });
    } catch (error) {
      console.error('Error generating test data:', error);
      toast({
        title: "Erro ao gerar dados",
        description: "Não foi possível gerar os dados de teste.",
        variant: "destructive"
      });
    }
  };

  const handleClearTestData = async () => {
    try {
      await clearTestAnalyticsData();
      toast({
        title: "Dados limpos!",
        description: "Todos os dados de analytics foram removidos."
      });
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast({
        title: "Erro ao limpar dados",
        description: "Não foi possível limpar os dados.",
        variant: "destructive"
      });
    }
  };

  const handleImportQuiz = async (quiz: Quiz) => {
    try {
      await saveQuiz(quiz);
      await loadQuizzes();
      
      toast({
        title: "Quiz importado com sucesso!",
        description: "O quiz foi adicionado ao seu dashboard."
      });

      navigate(`/app/edit/${quiz.id}`);
    } catch (error) {
      console.error('Error saving imported quiz:', error);
      toast({
        title: "Erro ao importar quiz",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <LoadingState message="Carregando seus quizzes..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Dashboard</h1>
                {isDemoMode && (
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700 transition-colors duration-300">
                    🎮 MODO DEMO
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
                {isDemoMode 
                  ? "Explorando funcionalidades com dados de exemplo (somente leitura)"
                  : "Gerencie seus quizzes e monitore performance"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
    
              <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Olá, {isDemoMode ? demoUser?.name : (user?.user_metadata?.full_name || user?.email)}
              </span>
              {isDemoMode && (
                <Button 
                  onClick={() => {
                    exitDemoMode();
                    navigate('/auth');
                  }}
                  variant="outline" 
                  className="gap-2 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900 transition-colors duration-300"
                  size="sm"
                >
                  Sair do DEMO
                </Button>
              )}
              <Button 
                onClick={handleGenerateTestData}
                variant="outline" 
                className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                size="sm"
              >
                <Database className="w-4 h-4" />
                Gerar Dados Teste
              </Button>
              <Button 
                onClick={handleClearTestData}
                variant="outline" 
                className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Dados
              </Button>
              <Button 
                onClick={() => navigate('/app/settings')} 
                variant="outline" 
                className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <SettingsIcon className="w-4 h-4" />
                Configurações
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Total de Quizzes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{quizzes.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Respostas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {quizzes.reduce((total, quiz) => total + getQuizStats(quiz.id).totalStarts, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Leads Capturados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {quizzes.reduce((total, quiz) => total + getQuizStats(quiz.id).totalLeads, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">Taxa Conversão</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {quizzes.length > 0 
                    ? Math.round(quizzes.reduce((total, quiz) => total + getQuizStats(quiz.id).conversionRate, 0) / quizzes.length)
                    : 0}%
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-600 dark:text-orange-400 transition-colors duration-300" />
            </div>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-700 transition-colors duration-300">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Analytics</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Leads</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Integrações</TabsTrigger>
            <TabsTrigger value="gamification" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Gamificação</TabsTrigger>
            <TabsTrigger value="quizzes" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Seus Quizzes</h2>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/app/templates')} 
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  Ver Templates
                </Button>
                <Button 
                  onClick={() => setShowImporter(true)} 
                  variant="outline"
                  className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  <Download className="w-4 h-4" />
                  Importar Quiz
                </Button>
                <Button 
                  onClick={isDemoMode ? () => {
                    toast({
                      title: "Funcionalidade restrita",
                      description: "No modo DEMO você pode apenas visualizar. Faça login para criar quizzes.",
                      variant: "destructive"
                    });
                  } : createQuiz} 
                  disabled={isCreating || isDemoMode} 
                  className={isDemoMode ? "opacity-50 cursor-not-allowed" : "bg-primary hover:bg-primary/90"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isCreating ? 'Criando...' : 'Novo Quiz'}
                </Button>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                  <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white transition-colors duration-300">Nenhum quiz criado ainda</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto transition-colors duration-300">
                  Crie seu primeiro quiz interativo e comece a converter visitantes em leads qualificados.
                </p>
                <Button 
                  onClick={isDemoMode ? () => {
                    toast({
                      title: "Funcionalidade restrita",
                      description: "No modo DEMO você pode apenas visualizar. Faça login para criar quizzes.",
                      variant: "destructive"
                    });
                  } : createQuiz} 
                  disabled={isCreating || isDemoMode} 
                  size="lg"
                  className={isDemoMode ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro quiz
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="p-6 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">{quiz.name}</h3>
                          <Badge 
                            variant={quiz.status === 'published' ? 'default' : 'secondary'}
                            className={quiz.status === 'published' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 transition-colors duration-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300'}
                          >
                            {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                        
                        {quiz.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{quiz.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                          <span>{quiz?.questions?.length || 0} perguntas</span>
                          <span>{getQuizStats(quiz.id).totalStarts} respostas</span>
                          <span>{getQuizStats(quiz.id).totalLeads} leads</span>
                          <span>{getQuizStats(quiz.id).conversionRate}% conversão</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/app/edit/${quiz.id}`)}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>

                        {quiz.status === 'published' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/quiz/${quiz.public_id || quiz.publicId}`, '_blank')}
                              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPublicLink(quiz.public_id || quiz.publicId)}
                              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copiar link
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Tabs defaultValue="heatmap" className="space-y-4">
              <TabsList className="bg-gray-100 dark:bg-gray-700 transition-colors duration-300">
                <TabsTrigger value="heatmap" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Mapa de Calor</TabsTrigger>
                <TabsTrigger value="abtest" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Testes A/B</TabsTrigger>
                <TabsTrigger value="cohort" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 transition-colors duration-300">Análise de Coorte</TabsTrigger>
              </TabsList>
              
              <TabsContent value="heatmap">
                <HeatmapAnalytics quizId={quizzes[0]?.id || 'demo'} />
              </TabsContent>
              
              <TabsContent value="abtest">
                <ABTestingManager quizId={quizzes[0]?.id || 'demo'} />
              </TabsContent>
              
              <TabsContent value="cohort">
                <CohortAnalysis quizId={quizzes[0]?.id || 'demo'} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <LeadsManager quizId={quizzes[0]?.id || 'demo'} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <WebhookManager 
              quizId={quizzes[0]?.id || 'demo'}
            />
          </TabsContent>

          <TabsContent value="gamification" className="space-y-6">
            <AchievementSystem 
              userId={user?.id || 'demo-user'} 
              onAchievementUnlocked={(achievement) => {
                toast({
                  title: "🎉 Nova Conquista!",
                  description: `Você desbloqueou: ${achievement.title}`
                });
              }}
            />
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gerenciar Quizzes</h2>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/app/templates')} 
                  variant="outline"
                >
                  Ver Templates
                </Button>
                <Button 
                  onClick={() => setShowImporter(true)} 
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Importar Quiz
                </Button>
                <Button onClick={createQuiz} disabled={isCreating} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  {isCreating ? 'Criando...' : 'Novo Quiz'}
                </Button>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum quiz criado ainda</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Crie seu primeiro quiz interativo e comece a converter visitantes em leads qualificados.
                </p>
                <Button onClick={createQuiz} disabled={isCreating} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro quiz
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{quiz.name}</h3>
                          <Badge 
                            variant={quiz.status === 'published' ? 'default' : 'secondary'}
                            className={quiz.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                        
                        {quiz.description && (
                          <p className="text-muted-foreground mb-4">{quiz.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>{quiz?.questions?.length || 0} perguntas</span>
                          <span>{getQuizStats(quiz.id).totalStarts} respostas</span>
                          <span>{getQuizStats(quiz.id).totalLeads} leads</span>
                          <span>{getQuizStats(quiz.id).conversionRate}% conversão</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/app/edit/${quiz.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>

                        {quiz.status === 'published' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/q/${quiz.publicId}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPublicLink(quiz.publicId)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copiar link
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <QuizImporter
          open={showImporter}
          onOpenChange={setShowImporter}
          onImport={handleImportQuiz}
        />
      </div>
    </div>
  );
};

export default Dashboard;