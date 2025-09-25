import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TestTube,
  Play,
  Pause,
  Square,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Copy,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Eye,
  MousePointer,
  Award,
  Zap,
  Calendar,
  Filter,
  Plus,
  Minus,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Equal,
  Lightbulb,
  Flag,
  Activity
} from 'lucide-react';
import { Quiz } from '@/types/quiz';

interface ABTestingManagerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  type: 'split_url' | 'element' | 'content' | 'flow' | 'design';
  hypothesis: string;
  startDate: string;
  endDate?: string;
  duration: number; // dias
  trafficSplit: number; // porcentagem para variante B
  variants: ABVariant[];
  metrics: ABMetric[];
  results?: ABTestResults;
  settings: ABTestSettings;
  createdAt: string;
  updatedAt: string;
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficPercentage: number;
  changes: VariantChange[];
  performance?: VariantPerformance;
}

interface VariantChange {
  type: 'text' | 'color' | 'layout' | 'image' | 'button' | 'form' | 'question' | 'outcome';
  element: string;
  property: string;
  oldValue: string;
  newValue: string;
  description: string;
}

interface ABMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'completion' | 'time' | 'score' | 'custom';
  description: string;
  isPrimary: boolean;
  target?: number;
  formula?: string;
}

interface ABTestResults {
  status: 'insufficient_data' | 'no_winner' | 'variant_a_wins' | 'variant_b_wins' | 'significant';
  confidence: number;
  pValue: number;
  effect: number;
  sampleSize: number;
  duration: number;
  summary: string;
  recommendations: string[];
}

interface VariantPerformance {
  visitors: number;
  conversions: number;
  conversionRate: number;
  averageTime: number;
  completionRate: number;
  averageScore: number;
  bounceRate: number;
  engagement: number;
  revenue?: number;
}

interface ABTestSettings {
  minSampleSize: number;
  maxDuration: number;
  confidenceLevel: number;
  trafficAllocation: number;
  autoStop: boolean;
  emailNotifications: boolean;
  excludeReturningUsers: boolean;
  deviceTargeting: string[];
  locationTargeting: string[];
}

interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ABTest['type'];
  hypothesis: string;
  variants: Omit<ABVariant, 'id' | 'performance'>[];
  metrics: Omit<ABMetric, 'id'>[];
  estimatedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
}

export function ABTestingManager({ quiz, onQuizUpdate }: ABTestingManagerProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('tests');
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadTests();
    loadTemplates();
  }, [quiz]);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de testes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTests: ABTest[] = [
        {
          id: 'test-1',
          name: 'Teste de Título Principal',
          description: 'Comparar diferentes títulos na página inicial do quiz',
          status: 'running',
          type: 'content',
          hypothesis: 'Um título mais direto e orientado a benefícios aumentará a taxa de início do quiz',
          startDate: '2024-01-15',
          duration: 14,
          trafficSplit: 50,
          variants: [
            {
              id: 'variant-a',
              name: 'Controle - Título Original',
              description: 'Título atual do quiz',
              isControl: true,
              trafficPercentage: 50,
              changes: [],
              performance: {
                visitors: 2500,
                conversions: 875,
                conversionRate: 35.0,
                averageTime: 180,
                completionRate: 78.5,
                averageScore: 72.3,
                bounceRate: 22.1,
                engagement: 8.2
              }
            },
            {
              id: 'variant-b',
              name: 'Variante - Título Otimizado',
              description: 'Novo título focado em benefícios',
              isControl: false,
              trafficPercentage: 50,
              changes: [
                {
                  type: 'text',
                  element: 'main-title',
                  property: 'innerHTML',
                  oldValue: 'Descubra Seu Perfil',
                  newValue: 'Descubra Seu Perfil em 2 Minutos e Receba Dicas Personalizadas',
                  description: 'Título mais específico com benefício claro'
                }
              ],
              performance: {
                visitors: 2450,
                conversions: 955,
                conversionRate: 39.0,
                averageTime: 175,
                completionRate: 81.2,
                averageScore: 74.1,
                bounceRate: 19.8,
                engagement: 8.7
              }
            }
          ],
          metrics: [
            {
              id: 'metric-1',
              name: 'Taxa de Conversão',
              type: 'conversion',
              description: 'Porcentagem de visitantes que iniciam o quiz',
              isPrimary: true,
              target: 40
            },
            {
              id: 'metric-2',
              name: 'Taxa de Conclusão',
              type: 'completion',
              description: 'Porcentagem que completa o quiz',
              isPrimary: false,
              target: 80
            }
          ],
          results: {
            status: 'variant_b_wins',
            confidence: 95.2,
            pValue: 0.032,
            effect: 11.4,
            sampleSize: 4950,
            duration: 8,
            summary: 'A variante B mostra melhoria significativa de 11.4% na conversão',
            recommendations: [
              'Implementar o novo título imediatamente',
              'Testar variações similares em outras páginas',
              'Monitorar impacto a longo prazo'
            ]
          },
          settings: {
            minSampleSize: 1000,
            maxDuration: 30,
            confidenceLevel: 95,
            trafficAllocation: 100,
            autoStop: true,
            emailNotifications: true,
            excludeReturningUsers: false,
            deviceTargeting: ['desktop', 'mobile'],
            locationTargeting: ['BR']
          },
          createdAt: '2024-01-10',
          updatedAt: '2024-01-23'
        },
        {
          id: 'test-2',
          name: 'Teste de Botão CTA',
          description: 'Comparar cores e textos do botão principal',
          status: 'completed',
          type: 'element',
          hypothesis: 'Um botão verde com texto mais urgente aumentará os cliques',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
          duration: 14,
          trafficSplit: 50,
          variants: [
            {
              id: 'variant-a2',
              name: 'Controle - Botão Azul',
              description: 'Botão azul com texto padrão',
              isControl: true,
              trafficPercentage: 50,
              changes: [],
              performance: {
                visitors: 3200,
                conversions: 1024,
                conversionRate: 32.0,
                averageTime: 190,
                completionRate: 75.2,
                averageScore: 69.8,
                bounceRate: 25.3,
                engagement: 7.8
              }
            },
            {
              id: 'variant-b2',
              name: 'Variante - Botão Verde',
              description: 'Botão verde com texto urgente',
              isControl: false,
              trafficPercentage: 50,
              changes: [
                {
                  type: 'color',
                  element: 'cta-button',
                  property: 'backgroundColor',
                  oldValue: '#3b82f6',
                  newValue: '#10b981',
                  description: 'Mudança de cor azul para verde'
                },
                {
                  type: 'text',
                  element: 'cta-button',
                  property: 'innerHTML',
                  oldValue: 'Começar Quiz',
                  newValue: 'Começar Agora - É Grátis!',
                  description: 'Texto mais urgente e com benefício'
                }
              ],
              performance: {
                visitors: 3180,
                conversions: 1017,
                conversionRate: 32.0,
                averageTime: 188,
                completionRate: 75.8,
                averageScore: 70.2,
                bounceRate: 24.9,
                engagement: 7.9
              }
            }
          ],
          metrics: [
            {
              id: 'metric-3',
              name: 'Taxa de Clique',
              type: 'engagement',
              description: 'Cliques no botão CTA',
              isPrimary: true,
              target: 35
            }
          ],
          results: {
            status: 'no_winner',
            confidence: 12.3,
            pValue: 0.876,
            effect: 0.1,
            sampleSize: 6380,
            duration: 14,
            summary: 'Não há diferença significativa entre as variantes',
            recommendations: [
              'Manter versão atual',
              'Testar mudanças mais dramáticas',
              'Focar em outros elementos'
            ]
          },
          settings: {
            minSampleSize: 2000,
            maxDuration: 21,
            confidenceLevel: 95,
            trafficAllocation: 100,
            autoStop: false,
            emailNotifications: true,
            excludeReturningUsers: true,
            deviceTargeting: ['desktop', 'mobile'],
            locationTargeting: ['BR', 'PT']
          },
          createdAt: '2023-12-28',
          updatedAt: '2024-01-14'
        }
      ];

      setTests(mockTests);
    } catch (error) {
      console.error('Erro ao carregar testes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const mockTemplates: TestTemplate[] = [
        {
          id: 'template-1',
          name: 'Teste de Título Principal',
          description: 'Comparar diferentes abordagens de título',
          category: 'Conversão',
          type: 'content',
          hypothesis: 'Títulos mais específicos e orientados a benefícios convertem melhor',
          variants: [
            {
              name: 'Controle',
              description: 'Título atual',
              isControl: true,
              trafficPercentage: 50,
              changes: []
            },
            {
              name: 'Título com Benefício',
              description: 'Título destacando benefício principal',
              isControl: false,
              trafficPercentage: 50,
              changes: [
                {
                  type: 'text',
                  element: 'main-title',
                  property: 'innerHTML',
                  oldValue: '',
                  newValue: '',
                  description: 'Adicionar benefício ao título'
                }
              ]
            }
          ],
          metrics: [
            {
              name: 'Taxa de Conversão',
              type: 'conversion',
              description: 'Visitantes que iniciam o quiz',
              isPrimary: true,
              target: 35
            }
          ],
          estimatedImpact: '+10-15% conversão',
          difficulty: 'easy',
          duration: 14
        },
        {
          id: 'template-2',
          name: 'Teste de Cores CTA',
          description: 'Comparar cores do botão principal',
          category: 'Engagement',
          type: 'element',
          hypothesis: 'Cores mais contrastantes aumentam cliques',
          variants: [
            {
              name: 'Controle',
              description: 'Cor atual',
              isControl: true,
              trafficPercentage: 50,
              changes: []
            },
            {
              name: 'Cor Contrastante',
              description: 'Cor com maior contraste',
              isControl: false,
              trafficPercentage: 50,
              changes: [
                {
                  type: 'color',
                  element: 'cta-button',
                  property: 'backgroundColor',
                  oldValue: '',
                  newValue: '',
                  description: 'Mudar cor do botão'
                }
              ]
            }
          ],
          metrics: [
            {
              name: 'Taxa de Clique',
              type: 'engagement',
              description: 'Cliques no CTA',
              isPrimary: true,
              target: 40
            }
          ],
          estimatedImpact: '+5-8% cliques',
          difficulty: 'easy',
          duration: 7
        },
        {
          id: 'template-3',
          name: 'Teste de Fluxo do Quiz',
          description: 'Comparar diferentes sequências de perguntas',
          category: 'Conclusão',
          type: 'flow',
          hypothesis: 'Perguntas mais fáceis no início aumentam conclusão',
          variants: [
            {
              name: 'Fluxo Atual',
              description: 'Sequência atual',
              isControl: true,
              trafficPercentage: 50,
              changes: []
            },
            {
              name: 'Fluxo Otimizado',
              description: 'Perguntas fáceis primeiro',
              isControl: false,
              trafficPercentage: 50,
              changes: [
                {
                  type: 'flow',
                  element: 'question-sequence',
                  property: 'order',
                  oldValue: '',
                  newValue: '',
                  description: 'Reordenar perguntas por dificuldade'
                }
              ]
            }
          ],
          metrics: [
            {
              name: 'Taxa de Conclusão',
              type: 'completion',
              description: 'Usuários que completam',
              isPrimary: true,
              target: 80
            }
          ],
          estimatedImpact: '+12-18% conclusão',
          difficulty: 'medium',
          duration: 21
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const createTest = (template?: TestTemplate) => {
    const newTest: ABTest = {
      id: `test-${Date.now()}`,
      name: template?.name || 'Novo Teste A/B',
      description: template?.description || '',
      status: 'draft',
      type: template?.type || 'content',
      hypothesis: template?.hypothesis || '',
      startDate: new Date().toISOString().split('T')[0],
      duration: template?.duration || 14,
      trafficSplit: 50,
      variants: template?.variants.map((v, i) => ({
        ...v,
        id: `variant-${Date.now()}-${i}`,
      })) || [
        {
          id: `variant-${Date.now()}-a`,
          name: 'Controle',
          description: 'Versão atual',
          isControl: true,
          trafficPercentage: 50,
          changes: []
        },
        {
          id: `variant-${Date.now()}-b`,
          name: 'Variante',
          description: 'Nova versão',
          isControl: false,
          trafficPercentage: 50,
          changes: []
        }
      ],
      metrics: template?.metrics.map((m, i) => ({
        ...m,
        id: `metric-${Date.now()}-${i}`
      })) || [
        {
          id: `metric-${Date.now()}`,
          name: 'Taxa de Conversão',
          type: 'conversion',
          description: 'Métrica principal',
          isPrimary: true
        }
      ],
      settings: {
        minSampleSize: 1000,
        maxDuration: 30,
        confidenceLevel: 95,
        trafficAllocation: 100,
        autoStop: true,
        emailNotifications: true,
        excludeReturningUsers: false,
        deviceTargeting: ['desktop', 'mobile'],
        locationTargeting: ['BR']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTests(prev => [newTest, ...prev]);
    setSelectedTest(newTest);
    setIsCreating(true);
  };

  const updateTest = (updatedTest: ABTest) => {
    setTests(prev => prev.map(test => 
      test.id === updatedTest.id 
        ? { ...updatedTest, updatedAt: new Date().toISOString() }
        : test
    ));
    setSelectedTest(updatedTest);
  };

  const deleteTest = (testId: string) => {
    setTests(prev => prev.filter(test => test.id !== testId));
    if (selectedTest?.id === testId) {
      setSelectedTest(null);
    }
  };

  const startTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      updateTest({
        ...test,
        status: 'running',
        startDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const pauseTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      updateTest({ ...test, status: 'paused' });
    }
  };

  const stopTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      updateTest({
        ...test,
        status: 'completed',
        endDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const duplicateTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      const duplicated = {
        ...test,
        id: `test-${Date.now()}`,
        name: `${test.name} (Cópia)`,
        status: 'draft' as const,
        startDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
        results: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTests(prev => [duplicated, ...prev]);
    }
  };

  const exportTests = () => {
    const exportData = {
      quiz: {
        id: quiz.id,
        name: quiz.name
      },
      tests,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-tests-${quiz.name || 'quiz'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultsColor = (status: string) => {
    switch (status) {
      case 'variant_a_wins': return 'text-blue-600';
      case 'variant_b_wins': return 'text-green-600';
      case 'no_winner': return 'text-gray-600';
      case 'significant': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const filteredTests = tests.filter(test => {
    if (filterStatus !== 'all' && test.status !== filterStatus) return false;
    if (filterType !== 'all' && test.type !== filterType) return false;
    return true;
  });

  const runningTests = tests.filter(t => t.status === 'running').length;
  const completedTests = tests.filter(t => t.status === 'completed').length;
  const winningTests = tests.filter(t => t.results?.status.includes('wins')).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando testes A/B...</p>
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
            <TestTube className="w-6 h-6" />
            A/B Testing
          </h3>
          <p className="text-muted-foreground">
            Otimize seu quiz com testes controlados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportTests}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => createTest()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Teste
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Testes Ativos</p>
                <p className="text-2xl font-bold text-green-600">{runningTests}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold text-blue-600">{completedTests}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Vencedor</p>
                <p className="text-2xl font-bold text-purple-600">{winningTests}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-orange-600">
                  {completedTests > 0 ? Math.round((winningTests / completedTests) * 100) : 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Label>Filtros:</Label>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="running">Executando</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="content">Conteúdo</SelectItem>
                    <SelectItem value="element">Elemento</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="flow">Fluxo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tests List */}
          <div className="grid gap-4">
            {filteredTests.map((test) => (
              <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{test.name}</h4>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status === 'running' ? 'Executando' :
                           test.status === 'paused' ? 'Pausado' :
                           test.status === 'completed' ? 'Completo' :
                           test.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                        </Badge>
                        {test.results && (
                          <Badge variant="outline" className={getResultsColor(test.results.status)}>
                            {test.results.status === 'variant_a_wins' ? 'A Vence' :
                             test.results.status === 'variant_b_wins' ? 'B Vence' :
                             test.results.status === 'no_winner' ? 'Empate' : 'Significativo'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{test.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(test.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {test.duration} dias
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {test.trafficSplit}% split
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => startTest(test.id)}>
                          <Play className="w-4 h-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => pauseTest(test.id)}>
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => stopTest(test.id)}>
                  <Square className="w-4 h-4 mr-1" />
                            Parar
                          </Button>
                        </>
                      )}
                      {test.status === 'paused' && (
                        <Button size="sm" onClick={() => startTest(test.id)}>
                          <Play className="w-4 h-4 mr-1" />
                          Retomar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => duplicateTest(test.id)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedTest(test)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteTest(test.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Test Progress */}
                  {test.status === 'running' && test.variants[0]?.performance && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso do Teste</span>
                        <span>{Math.min(100, ((test.variants[0].performance.visitors + (test.variants[1]?.performance?.visitors || 0)) / test.settings.minSampleSize) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, ((test.variants[0].performance.visitors + (test.variants[1]?.performance?.visitors || 0)) / test.settings.minSampleSize) * 100)} 
                        className="h-2"
                      />
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        {test.variants.map((variant) => (
                          <div key={variant.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{variant.name}</span>
                              {variant.performance && (
                                <span className="text-lg font-bold">
                                  {variant.performance.conversionRate.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            {variant.performance && (
                              <div className="text-sm text-muted-foreground">
                                {variant.performance.visitors.toLocaleString()} visitantes • {variant.performance.conversions} conversões
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Results */}
                  {test.results && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Resultados:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Confiança: {test.results.confidence.toFixed(1)}%</span>
                          <span className="text-sm">Efeito: {test.results.effect > 0 ? '+' : ''}{test.results.effect.toFixed(1)}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{test.results.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold mb-2">Nenhum teste encontrado</h4>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro teste A/B para começar a otimizar seu quiz
                </p>
                <Button onClick={() => createTest()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Teste
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant={
                          template.difficulty === 'easy' ? 'default' :
                          template.difficulty === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {template.difficulty === 'easy' ? 'Fácil' :
                           template.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Impacto estimado:</span>
                      <span className="font-medium text-green-600">{template.estimatedImpact}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="font-medium">{template.duration} dias</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => createTest(template)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid gap-4">
            {tests.filter(t => t.results).map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <Badge className={getResultsColor(test.results!.status)}>
                      {test.results!.status === 'variant_a_wins' ? 'Controle Vence' :
                       test.results!.status === 'variant_b_wins' ? 'Variante Vence' :
                       test.results!.status === 'no_winner' ? 'Sem Vencedor' : 'Significativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {test.results!.confidence.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Confiança</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {test.results!.effect > 0 ? '+' : ''}{test.results!.effect.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Efeito</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {test.results!.sampleSize.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Amostra</div>
                    </div>
                  </div>

                  {test.variants[0]?.performance && test.variants[1]?.performance && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {test.variants.map((variant) => (
                        <div key={variant.id} className="p-4 border rounded">
                          <h5 className="font-semibold mb-3">{variant.name}</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Visitantes:</span>
                              <span className="font-medium">{variant.performance!.visitors.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Conversões:</span>
                              <span className="font-medium">{variant.performance!.conversions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa de Conversão:</span>
                              <span className="font-medium">{variant.performance!.conversionRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa de Conclusão:</span>
                              <span className="font-medium">{variant.performance!.completionRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded">
                    <h5 className="font-semibold mb-2">Resumo:</h5>
                    <p className="text-sm mb-3">{test.results!.summary}</p>
                    
                    <h5 className="font-semibold mb-2">Recomendações:</h5>
                    <ul className="text-sm space-y-1">
                      {test.results!.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Lightbulb className="w-3 h-3 text-yellow-600" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Globais de A/B Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Tamanho Mínimo da Amostra</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                  <div>
                    <Label>Duração Máxima (dias)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div>
                    <Label>Nível de Confiança (%)</Label>
                    <Select defaultValue="95">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Parada Automática</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notificações por Email</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Excluir Usuários Recorrentes</Label>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-semibold">Segmentação Padrão</h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Dispositivos</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <Label className="text-sm">Desktop</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <Label className="text-sm">Mobile</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <Label className="text-sm">Tablet</Label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Localização</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <Label className="text-sm">Brasil</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <Label className="text-sm">Portugal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <Label className="text-sm">Outros</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{selectedTest.name}</h3>
              <Button variant="outline" onClick={() => setSelectedTest(null)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Hipótese</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedTest.hypothesis}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Variantes</Label>
                  <div className="space-y-3 mt-2">
                    {selectedTest.variants.map((variant) => (
                      <div key={variant.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{variant.name}</span>
                          {variant.isControl && <Badge variant="outline">Controle</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{variant.description}</p>
                        {variant.changes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Mudanças:</p>
                            {variant.changes.map((change, index) => (
                              <p key={index} className="text-xs text-muted-foreground">
                                • {change.description}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Métricas</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTest.metrics.map((metric) => (
                      <div key={metric.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{metric.name}</span>
                          {metric.isPrimary && <Badge>Principal</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{metric.description}</p>
                        {metric.target && (
                          <p className="text-xs text-muted-foreground">Meta: {metric.target}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedTest.results && (
                <div className="p-4 bg-gray-50 rounded">
                  <h5 className="font-semibold mb-3">Resultados Detalhados</h5>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{selectedTest.results.confidence.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Confiança</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{selectedTest.results.pValue.toFixed(3)}</div>
                      <div className="text-xs text-muted-foreground">P-Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{selectedTest.results.effect.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Efeito</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{selectedTest.results.duration}</div>
                      <div className="text-xs text-muted-foreground">Dias</div>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{selectedTest.results.summary}</p>
                  <div>
                    <p className="text-sm font-medium mb-2">Recomendações:</p>
                    <ul className="text-sm space-y-1">
                      {selectedTest.results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ABTestingManager;