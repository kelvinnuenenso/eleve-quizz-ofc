import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  GitBranch, 
  ArrowRight, 
  ArrowDown,
  Settings,
  Eye,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Target,
  Filter,
  Link,
  Copy,
  Save
} from 'lucide-react';
import type { 
  Quiz, 
  Question, 
  QuestionLogic, 
  FlowCondition, 
  LogicRule, 
  StepLogic,
  ResponseBranch,
  BranchCondition
} from '@/types/quiz';

interface ConditionalLogicManagerProps {
  quiz: Quiz;
  onQuizUpdate: (quiz: Quiz) => void;
}

interface LogicTemplate {
  id: string;
  name: string;
  description: string;
  category: 'scoring' | 'branching' | 'filtering' | 'personalization';
  conditions: FlowCondition[];
  actions: LogicAction[];
}

interface LogicAction {
  type: 'show_question' | 'hide_question' | 'jump_to_question' | 'set_outcome' | 'add_tag' | 'calculate_score';
  target: string;
  value?: string | number;
}

interface ConditionalFlow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  questions: string[];
  rules: LogicRule[];
  testResults?: FlowTestResult[];
}

interface FlowTestResult {
  scenario: string;
  inputs: Record<string, any>;
  expectedPath: string[];
  actualPath: string[];
  passed: boolean;
  errors?: string[];
}

export function ConditionalLogicManager({ quiz, onQuizUpdate }: ConditionalLogicManagerProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [logicRules, setLogicRules] = useState<LogicRule[]>([]);
  const [conditionalFlows, setConditionalFlows] = useState<ConditionalFlow[]>([]);
  const [templates, setTemplates] = useState<LogicTemplate[]>([]);
  const [isTestingFlow, setIsTestingFlow] = useState(false);
  const [testScenarios, setTestScenarios] = useState<FlowTestResult[]>([]);
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    initializeTemplates();
    loadExistingLogic();
  }, [quiz]);

  const initializeTemplates = () => {
    const defaultTemplates: LogicTemplate[] = [
      {
        id: 'score_based_branching',
        name: 'Ramificação por Pontuação',
        description: 'Direciona usuários baseado na pontuação atual',
        category: 'scoring',
        conditions: [
          {
            id: 'score_high',
            type: 'score',
            field: 'current_score',
            operator: 'greater_than',
            value: 80
          }
        ],
        actions: [
          {
            type: 'jump_to_question',
            target: 'advanced_questions',
            value: 'high_score_path'
          }
        ]
      },
      {
        id: 'answer_based_filtering',
        name: 'Filtro por Resposta',
        description: 'Mostra/oculta perguntas baseado em respostas específicas',
        category: 'filtering',
        conditions: [
          {
            id: 'answer_yes',
            type: 'response',
            field: 'question_1',
            operator: 'equals',
            value: 'yes'
          }
        ],
        actions: [
          {
            type: 'show_question',
            target: 'follow_up_question'
          }
        ]
      },
      {
        id: 'demographic_personalization',
        name: 'Personalização Demográfica',
        description: 'Personaliza experiência baseado em dados demográficos',
        category: 'personalization',
        conditions: [
          {
            id: 'age_young',
            type: 'response',
            field: 'age_range',
            operator: 'equals',
            value: '18-25'
          }
        ],
        actions: [
          {
            type: 'add_tag',
            target: 'young_audience',
            value: 'millennial'
          }
        ]
      },
      {
        id: 'interest_based_routing',
        name: 'Roteamento por Interesse',
        description: 'Direciona fluxo baseado nos interesses declarados',
        category: 'branching',
        conditions: [
          {
            id: 'interest_tech',
            type: 'response',
            field: 'interests',
            operator: 'contains',
            value: 'technology'
          }
        ],
        actions: [
          {
            type: 'jump_to_question',
            target: 'tech_questions'
          }
        ]
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadExistingLogic = () => {
    // Carregar lógica existente das perguntas
    const existingRules: LogicRule[] = [];
    const flows: ConditionalFlow[] = [];

    quiz.questions.forEach(question => {
      if (question.logic) {
        // Converter QuestionLogic para LogicRule
        if (question.logic.showIf) {
          question.logic.showIf.forEach((condition, index) => {
            existingRules.push({
              id: `${question.id}_show_${index}`,
              conditions: [{
                id: `condition_${index}`,
                type: 'response',
                field: condition.questionId,
                operator: condition.operator,
                value: condition.value
              }],
              operator: 'AND',
              nextStepId: question.id,
              label: `Mostrar ${question.title}`
            });
          });
        }

        if (question.logic.skipIf) {
          question.logic.skipIf.forEach((condition, index) => {
            existingRules.push({
              id: `${question.id}_skip_${index}`,
              conditions: [{
                id: `condition_${index}`,
                type: 'response',
                field: condition.questionId,
                operator: condition.operator,
                value: condition.value
              }],
              operator: 'AND',
              nextStepId: 'skip',
              label: `Pular ${question.title}`
            });
          });
        }
      }
    });

    setLogicRules(existingRules);

    // Criar fluxos baseados nas regras existentes
    if (existingRules.length > 0) {
      const mainFlow: ConditionalFlow = {
        id: 'main_flow',
        name: 'Fluxo Principal',
        description: 'Fluxo principal do quiz com lógica condicional',
        enabled: true,
        questions: quiz.questions.map(q => q.id),
        rules: existingRules,
        testResults: []
      };

      flows.push(mainFlow);
    }

    setConditionalFlows(flows);
  };

  const createNewRule = () => {
    const newRule: LogicRule = {
      id: `rule_${Date.now()}`,
      conditions: [{
        id: `condition_${Date.now()}`,
        type: 'response',
        field: '',
        operator: 'equals',
        value: ''
      }],
      operator: 'AND',
      nextStepId: '',
      label: 'Nova Regra'
    };

    setLogicRules([...logicRules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    setLogicRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    setLogicRules(rules => rules.filter(rule => rule.id !== ruleId));
  };

  const addConditionToRule = (ruleId: string) => {
    const newCondition: FlowCondition = {
      id: `condition_${Date.now()}`,
      type: 'response',
      field: '',
      operator: 'equals',
      value: ''
    };

    updateRule(ruleId, {
      conditions: [...(logicRules.find(r => r.id === ruleId)?.conditions || []), newCondition]
    });
  };

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<FlowCondition>) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule) {
      const updatedConditions = rule.conditions.map(condition =>
        condition.id === conditionId ? { ...condition, ...updates } : condition
      );
      updateRule(ruleId, { conditions: updatedConditions });
    }
  };

  const removeCondition = (ruleId: string, conditionId: string) => {
    const rule = logicRules.find(r => r.id === ruleId);
    if (rule) {
      const updatedConditions = rule.conditions.filter(c => c.id !== conditionId);
      updateRule(ruleId, { conditions: updatedConditions });
    }
  };

  const applyTemplate = (templateId: string, targetQuestionId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newRule: LogicRule = {
      id: `rule_${Date.now()}`,
      conditions: template.conditions.map(condition => ({
        ...condition,
        id: `condition_${Date.now()}_${condition.id}`
      })),
      operator: 'AND',
      nextStepId: targetQuestionId,
      label: template.name
    };

    setLogicRules([...logicRules, newRule]);
  };

  const testFlow = async (flowId: string) => {
    setIsTestingFlow(true);
    
    const flow = conditionalFlows.find(f => f.id === flowId);
    if (!flow) return;

    // Simular diferentes cenários de teste
    const testScenarios: FlowTestResult[] = [
      {
        scenario: 'Usuário com pontuação alta',
        inputs: { score: 90, question_1: 'yes', age_range: '25-35' },
        expectedPath: ['question_1', 'question_3', 'outcome_high'],
        actualPath: [],
        passed: false
      },
      {
        scenario: 'Usuário com pontuação baixa',
        inputs: { score: 30, question_1: 'no', age_range: '18-25' },
        expectedPath: ['question_1', 'question_2', 'outcome_low'],
        actualPath: [],
        passed: false
      },
      {
        scenario: 'Fluxo de interesse em tecnologia',
        inputs: { interests: ['technology', 'innovation'], question_1: 'yes' },
        expectedPath: ['question_1', 'tech_questions', 'outcome_tech'],
        actualPath: [],
        passed: false
      }
    ];

    // Simular execução dos cenários
    for (const scenario of testScenarios) {
      const actualPath = simulateFlowExecution(flow, scenario.inputs);
      scenario.actualPath = actualPath;
      scenario.passed = JSON.stringify(actualPath) === JSON.stringify(scenario.expectedPath);
      
      if (!scenario.passed) {
        scenario.errors = [`Caminho esperado: ${scenario.expectedPath.join(' → ')}`, `Caminho atual: ${actualPath.join(' → ')}`];
      }
    }

    setTestScenarios(testScenarios);
    
    // Atualizar o fluxo com os resultados do teste
    setConditionalFlows(flows =>
      flows.map(f =>
        f.id === flowId ? { ...f, testResults: testScenarios } : f
      )
    );

    setTimeout(() => setIsTestingFlow(false), 2000);
  };

  const simulateFlowExecution = (flow: ConditionalFlow, inputs: Record<string, any>): string[] => {
    const path: string[] = [];
    let currentStep = flow.questions[0];

    while (currentStep && path.length < 10) { // Limite para evitar loops infinitos
      path.push(currentStep);

      // Encontrar regra aplicável
      const applicableRule = flow.rules.find(rule => {
        return rule.conditions.every(condition => {
          const inputValue = inputs[condition.field];
          const conditionValue = condition.value;

          switch (condition.operator) {
            case 'equals':
              return inputValue === conditionValue;
            case 'not_equals':
              return inputValue !== conditionValue;
            case 'greater_than':
              return Number(inputValue) > Number(conditionValue);
            case 'less_than':
              return Number(inputValue) < Number(conditionValue);
            case 'contains':
              return Array.isArray(inputValue) 
                ? inputValue.includes(conditionValue)
                : String(inputValue).includes(String(conditionValue));
            default:
              return false;
          }
        });
      });

      if (applicableRule) {
        currentStep = applicableRule.nextStepId;
      } else {
        // Próxima pergunta na sequência
        const currentIndex = flow.questions.indexOf(currentStep);
        currentStep = flow.questions[currentIndex + 1] || 'end';
      }

      if (currentStep === 'end' || currentStep === 'skip') break;
    }

    return path;
  };

  const saveLogicToQuiz = () => {
    const updatedQuiz = { ...quiz };

    // Aplicar regras às perguntas
    updatedQuiz.questions = quiz.questions.map(question => {
      const questionRules = logicRules.filter(rule => 
        rule.nextStepId === question.id || 
        rule.conditions.some(c => c.field === question.id)
      );

      if (questionRules.length > 0) {
        const logic: QuestionLogic = {};

        // Converter regras para QuestionLogic
        const showRules = questionRules.filter(rule => rule.label?.includes('Mostrar'));
        const skipRules = questionRules.filter(rule => rule.label?.includes('Pular'));

        if (showRules.length > 0) {
          logic.showIf = showRules.flatMap(rule =>
            rule.conditions.map(condition => ({
              questionId: condition.field,
              operator: condition.operator as any,
              value: condition.value
            }))
          );
        }

        if (skipRules.length > 0) {
          logic.skipIf = skipRules.flatMap(rule =>
            rule.conditions.map(condition => ({
              questionId: condition.field,
              operator: condition.operator as any,
              value: condition.value
            }))
          );
        }

        return { ...question, logic };
      }

      return question;
    });

    onQuizUpdate(updatedQuiz);
  };

  const exportLogicConfig = () => {
    const config = {
      rules: logicRules,
      flows: conditionalFlows,
      templates: templates.filter(t => !['score_based_branching', 'answer_based_filtering', 'demographic_personalization', 'interest_based_routing'].includes(t.id))
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-logic-${quiz.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getQuestionOptions = (questionId: string) => {
    const question = quiz.questions.find(q => q.id === questionId);
    return question?.options?.map(opt => ({ value: opt.value || opt.label, label: opt.label })) || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6" />
            Lógica Condicional
          </h3>
          <p className="text-muted-foreground">
            Configure fluxos inteligentes baseados nas respostas dos usuários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLogicConfig}>
            <Copy className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={saveLogicToQuiz}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Lógica
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="flows">Fluxos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="testing">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Regras de Lógica</h4>
            <Button onClick={createNewRule}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="space-y-4">
            {logicRules.map(rule => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={rule.label || ''}
                        onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                        placeholder="Nome da regra"
                        className="font-semibold"
                      />
                      <Badge variant="outline">
                        {rule.conditions.length} condição{rule.conditions.length !== 1 ? 'ões' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addConditionToRule(rule.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Condições */}
                  <div className="space-y-3">
                    <Label>Condições</Label>
                    {rule.conditions.map((condition, index) => (
                      <div key={condition.id} className="flex items-center gap-2 p-3 border rounded-lg">
                        {index > 0 && (
                          <Select
                            value={rule.operator}
                            onValueChange={(value: 'AND' | 'OR') => updateRule(rule.id, { operator: value })}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">E</SelectItem>
                              <SelectItem value="OR">OU</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(rule.id, condition.id, { field: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecione a pergunta" />
                          </SelectTrigger>
                          <SelectContent>
                            {quiz.questions.map(q => (
                              <SelectItem key={q.id} value={q.id}>
                                {q.title}
                              </SelectItem>
                            ))}
                            <SelectItem value="current_score">Pontuação Atual</SelectItem>
                            <SelectItem value="completion_time">Tempo de Conclusão</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value: any) => updateCondition(rule.id, condition.id, { operator: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Igual a</SelectItem>
                            <SelectItem value="not_equals">Diferente de</SelectItem>
                            <SelectItem value="contains">Contém</SelectItem>
                            <SelectItem value="greater_than">Maior que</SelectItem>
                            <SelectItem value="less_than">Menor que</SelectItem>
                            <SelectItem value="between">Entre</SelectItem>
                          </SelectContent>
                        </Select>

                        {condition.field && getQuestionOptions(condition.field).length > 0 ? (
                          <Select
                            value={String(condition.value)}
                            onValueChange={(value) => updateCondition(rule.id, condition.id, { value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Selecione o valor" />
                            </SelectTrigger>
                            <SelectContent>
                              {getQuestionOptions(condition.field).map(option => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={String(condition.value)}
                            onChange={(e) => updateCondition(rule.id, condition.id, { value: e.target.value })}
                            placeholder="Valor"
                            className="w-40"
                          />
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCondition(rule.id, condition.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Ação */}
                  <div className="space-y-2">
                    <Label>Então</Label>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={rule.nextStepId}
                        onValueChange={(value) => updateRule(rule.id, { nextStepId: value })}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Selecione a ação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Pular pergunta</SelectItem>
                          {quiz.questions.map(q => (
                            <SelectItem key={q.id} value={q.id}>
                              Ir para: {q.title}
                            </SelectItem>
                          ))}
                          {quiz.outcomes && Object.keys(quiz.outcomes).map(key => (
                            <SelectItem key={key} value={key}>
                              Resultado: {quiz.outcomes![key].title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {logicRules.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h4>
                  <p className="text-muted-foreground mb-4">
                    Crie regras de lógica condicional para personalizar a experiência do usuário
                  </p>
                  <Button onClick={createNewRule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Regra
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Fluxos Condicionais</h4>
            <Button onClick={() => {
              const newFlow: ConditionalFlow = {
                id: `flow_${Date.now()}`,
                name: 'Novo Fluxo',
                description: '',
                enabled: true,
                questions: quiz.questions.map(q => q.id),
                rules: []
              };
              setConditionalFlows([...conditionalFlows, newFlow]);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fluxo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {conditionalFlows.map(flow => (
              <Card key={flow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {flow.name}
                        <Switch
                          checked={flow.enabled}
                          onCheckedChange={(enabled) => {
                            setConditionalFlows(flows =>
                              flows.map(f => f.id === flow.id ? { ...f, enabled } : f)
                            );
                          }}
                        />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{flow.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testFlow(flow.id)}
                      disabled={isTestingFlow}
                    >
                      {isTestingFlow ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Perguntas: {flow.questions.length}</span>
                    <span>Regras: {flow.rules.length}</span>
                  </div>

                  {flow.testResults && flow.testResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Resultados dos Testes</Label>
                      {flow.testResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {result.passed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                            {result.scenario}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Templates de Lógica</h4>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Template
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.category === 'scoring' && <Target className="w-4 h-4" />}
                        {template.category === 'branching' && <GitBranch className="w-4 h-4" />}
                        {template.category === 'filtering' && <Filter className="w-4 h-4" />}
                        {template.category === 'personalization' && <Zap className="w-4 h-4" />}
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Condições: {template.conditions.length}</span>
                      <span>Ações: {template.actions.length}</span>
                    </div>
                    
                    <Select onValueChange={(questionId) => applyTemplate(template.id, questionId)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Aplicar à pergunta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {quiz.questions.map(q => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Teste de Fluxos</h4>
            <Button 
              onClick={() => conditionalFlows.forEach(flow => testFlow(flow.id))}
              disabled={isTestingFlow}
            >
              {isTestingFlow ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Testar Todos
                </>
              )}
            </Button>
          </div>

          {testScenarios.length > 0 && (
            <div className="space-y-4">
              {testScenarios.map((scenario, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {scenario.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        {scenario.scenario}
                      </CardTitle>
                      <Badge variant={scenario.passed ? 'default' : 'destructive'}>
                        {scenario.passed ? 'Passou' : 'Falhou'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Entradas do Teste</Label>
                      <div className="text-sm text-muted-foreground">
                        {Object.entries(scenario.inputs).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Caminho Esperado</Label>
                        <div className="text-sm">
                          {scenario.expectedPath.join(' → ')}
                        </div>
                      </div>
                      <div>
                        <Label>Caminho Atual</Label>
                        <div className="text-sm">
                          {scenario.actualPath.join(' → ')}
                        </div>
                      </div>
                    </div>

                    {scenario.errors && scenario.errors.length > 0 && (
                      <div>
                        <Label>Erros</Label>
                        <div className="space-y-1">
                          {scenario.errors.map((error, errorIndex) => (
                            <div key={errorIndex} className="text-sm text-red-600 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {testScenarios.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold mb-2">Nenhum teste executado</h4>
                <p className="text-muted-foreground mb-4">
                  Execute testes para validar o comportamento dos seus fluxos condicionais
                </p>
                <Button onClick={() => conditionalFlows.forEach(flow => testFlow(flow.id))}>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Testes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ConditionalLogicManager;