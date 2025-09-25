import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar as CalendarIcon,
  Filter,
  Settings,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Eye,
  MousePointer
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { localDB } from '@/lib/localStorage';

interface ExportField {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'analytics' | 'custom';
  required?: boolean;
  selected: boolean;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
  format: 'csv' | 'excel' | 'json' | 'pdf';
  filters: ExportFilters;
  isDefault?: boolean;
}

interface ExportFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  quizzes: string[];
  status: string[];
  sources: string[];
  tags: string[];
  minScore?: number;
  maxScore?: number;
  completedOnly: boolean;
  includeAnonymous: boolean;
}

interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  format: string;
  recordCount: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}

interface AdvancedExportManagerProps {
  quizId?: string;
}

export function AdvancedExportManager({ quizId }: AdvancedExportManagerProps) {
  const [exportFields, setExportFields] = useState<ExportField[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: { start: null, end: null },
    quizzes: quizId ? [quizId] : [],
    status: [],
    sources: [],
    tags: [],
    completedOnly: false,
    includeAnonymous: true
  });
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    format: 'csv' as const
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [scheduledExports, setScheduledExports] = useState<any[]>([]);

  useEffect(() => {
    initializeExportFields();
    loadTemplates();
    loadExportJobs();
    loadScheduledExports();
  }, []);

  const initializeExportFields = () => {
    const fields: ExportField[] = [
      // Campos Básicos
      { id: 'id', name: 'ID', description: 'Identificador único', category: 'basic', required: true, selected: true },
      { id: 'name', name: 'Nome', description: 'Nome do lead', category: 'basic', selected: true },
      { id: 'email', name: 'Email', description: 'Email do lead', category: 'basic', selected: true },
      { id: 'phone', name: 'Telefone', description: 'Telefone do lead', category: 'basic', selected: false },
      { id: 'createdAt', name: 'Data de Criação', description: 'Quando o lead foi criado', category: 'basic', selected: true },
      { id: 'status', name: 'Status', description: 'Status atual do lead', category: 'basic', selected: true },
      { id: 'source', name: 'Origem', description: 'Fonte do tráfego', category: 'basic', selected: true },
      { id: 'tags', name: 'Tags', description: 'Tags associadas', category: 'basic', selected: false },
      
      // Campos Avançados
      { id: 'quizTitle', name: 'Título do Quiz', description: 'Nome do quiz respondido', category: 'advanced', selected: true },
      { id: 'quizId', name: 'ID do Quiz', description: 'Identificador do quiz', category: 'advanced', selected: false },
      { id: 'score', name: 'Pontuação', description: 'Pontuação obtida no quiz', category: 'advanced', selected: true },
      { id: 'maxScore', name: 'Pontuação Máxima', description: 'Pontuação máxima possível', category: 'advanced', selected: false },
      { id: 'percentage', name: 'Percentual', description: 'Percentual de acerto', category: 'advanced', selected: true },
      { id: 'completionTime', name: 'Tempo de Conclusão', description: 'Tempo para completar (segundos)', category: 'advanced', selected: false },
      { id: 'startedAt', name: 'Iniciado em', description: 'Quando começou o quiz', category: 'advanced', selected: false },
      { id: 'completedAt', name: 'Concluído em', description: 'Quando terminou o quiz', category: 'advanced', selected: true },
      { id: 'abandoned', name: 'Abandonado', description: 'Se o quiz foi abandonado', category: 'advanced', selected: false },
      { id: 'lastQuestion', name: 'Última Pergunta', description: 'Última pergunta respondida', category: 'advanced', selected: false },
      
      // Campos de Analytics
      { id: 'sessionId', name: 'ID da Sessão', description: 'Identificador da sessão', category: 'analytics', selected: false },
      { id: 'userAgent', name: 'User Agent', description: 'Navegador utilizado', category: 'analytics', selected: false },
      { id: 'ipAddress', name: 'Endereço IP', description: 'IP do usuário', category: 'analytics', selected: false },
      { id: 'referrer', name: 'Referrer', description: 'Página de origem', category: 'analytics', selected: false },
      { id: 'utmSource', name: 'UTM Source', description: 'Fonte UTM', category: 'analytics', selected: false },
      { id: 'utmMedium', name: 'UTM Medium', description: 'Meio UTM', category: 'analytics', selected: false },
      { id: 'utmCampaign', name: 'UTM Campaign', description: 'Campanha UTM', category: 'analytics', selected: false },
      { id: 'device', name: 'Dispositivo', description: 'Tipo de dispositivo', category: 'analytics', selected: false },
      { id: 'browser', name: 'Navegador', description: 'Navegador utilizado', category: 'analytics', selected: false },
      { id: 'os', name: 'Sistema Operacional', description: 'SO utilizado', category: 'analytics', selected: false },
      { id: 'country', name: 'País', description: 'País do usuário', category: 'analytics', selected: false },
      { id: 'city', name: 'Cidade', description: 'Cidade do usuário', category: 'analytics', selected: false },
      
      // Campos Customizados
      { id: 'customField1', name: 'Campo Personalizado 1', description: 'Campo customizado', category: 'custom', selected: false },
      { id: 'customField2', name: 'Campo Personalizado 2', description: 'Campo customizado', category: 'custom', selected: false },
      { id: 'notes', name: 'Observações', description: 'Notas adicionais', category: 'custom', selected: false },
      { id: 'leadQuality', name: 'Qualidade do Lead', description: 'Score de qualidade', category: 'custom', selected: false },
      { id: 'conversionProbability', name: 'Probabilidade de Conversão', description: 'Probabilidade calculada', category: 'custom', selected: false }
    ];

    setExportFields(fields);
  };

  const loadTemplates = () => {
    const defaultTemplates: ExportTemplate[] = [
      {
        id: 'basic-leads',
        name: 'Leads Básicos',
        description: 'Informações essenciais dos leads',
        fields: ['id', 'name', 'email', 'createdAt', 'status', 'source'],
        format: 'csv',
        filters: {
          dateRange: { start: null, end: null },
          quizzes: [],
          status: [],
          sources: [],
          tags: [],
          completedOnly: false,
          includeAnonymous: true
        },
        isDefault: true
      },
      {
        id: 'complete-analytics',
        name: 'Analytics Completo',
        description: 'Todos os dados de analytics e performance',
        fields: ['id', 'name', 'email', 'quizTitle', 'score', 'percentage', 'completionTime', 'source', 'utmSource', 'utmMedium', 'device', 'browser'],
        format: 'excel',
        filters: {
          dateRange: { start: null, end: null },
          quizzes: [],
          status: [],
          sources: [],
          tags: [],
          completedOnly: true,
          includeAnonymous: false
        },
        isDefault: true
      },
      {
        id: 'marketing-report',
        name: 'Relatório de Marketing',
        description: 'Dados focados em marketing e conversão',
        fields: ['name', 'email', 'source', 'utmSource', 'utmMedium', 'utmCampaign', 'createdAt', 'status', 'leadQuality'],
        format: 'excel',
        filters: {
          dateRange: { start: null, end: null },
          quizzes: [],
          status: ['new', 'qualified'],
          sources: [],
          tags: [],
          completedOnly: false,
          includeAnonymous: false
        },
        isDefault: true
      },
      {
        id: 'performance-analysis',
        name: 'Análise de Performance',
        description: 'Dados de performance dos quizzes',
        fields: ['quizTitle', 'score', 'percentage', 'completionTime', 'startedAt', 'completedAt', 'abandoned', 'lastQuestion'],
        format: 'csv',
        filters: {
          dateRange: { start: null, end: null },
          quizzes: [],
          status: [],
          sources: [],
          tags: [],
          completedOnly: false,
          includeAnonymous: true
        },
        isDefault: true
      }
    ];

    setTemplates(defaultTemplates);
  };

  const loadExportJobs = () => {
    // Simular jobs de exportação
    const jobs: ExportJob[] = [
      {
        id: 'job_1',
        name: 'Leads Básicos - Janeiro 2024',
        status: 'completed',
        progress: 100,
        format: 'CSV',
        recordCount: 1250,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
        downloadUrl: '#'
      },
      {
        id: 'job_2',
        name: 'Analytics Completo - Dezembro 2023',
        status: 'processing',
        progress: 65,
        format: 'Excel',
        recordCount: 3420,
        createdAt: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        id: 'job_3',
        name: 'Relatório de Marketing - Q4 2023',
        status: 'failed',
        progress: 0,
        format: 'Excel',
        recordCount: 0,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        error: 'Erro ao processar dados de UTM'
      }
    ];

    setExportJobs(jobs);
  };

  const loadScheduledExports = () => {
    const scheduled = [
      {
        id: 'sched_1',
        name: 'Relatório Semanal de Leads',
        template: 'basic-leads',
        frequency: 'weekly',
        nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        active: true
      },
      {
        id: 'sched_2',
        name: 'Analytics Mensal',
        template: 'complete-analytics',
        frequency: 'monthly',
        nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        active: true
      }
    ];

    setScheduledExports(scheduled);
  };

  const toggleField = (fieldId: string) => {
    setExportFields(fields => 
      fields.map(field => 
        field.id === fieldId 
          ? { ...field, selected: !field.selected }
          : field
      )
    );
  };

  const selectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFilters(template.filters);
      setExportFields(fields => 
        fields.map(field => ({
          ...field,
          selected: template.fields.includes(field.id)
        }))
      );
    }
  };

  const createCustomTemplate = () => {
    const selectedFields = exportFields.filter(f => f.selected).map(f => f.id);
    
    const newTemplate: ExportTemplate = {
      id: `custom_${Date.now()}`,
      name: customTemplate.name,
      description: customTemplate.description,
      fields: selectedFields,
      format: customTemplate.format,
      filters: { ...filters }
    };

    setTemplates([...templates, newTemplate]);
    setIsCreatingTemplate(false);
    setCustomTemplate({ name: '', description: '', format: 'csv' });
  };

  const startExport = async (format: 'csv' | 'excel' | 'json' | 'pdf' = 'csv') => {
    const selectedFields = exportFields.filter(f => f.selected);
    
    if (selectedFields.length === 0) {
      alert('Selecione pelo menos um campo para exportar');
      return;
    }

    const jobId = `job_${Date.now()}`;
    const newJob: ExportJob = {
      id: jobId,
      name: `Exportação ${format.toUpperCase()} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      status: 'processing',
      progress: 0,
      format: format.toUpperCase(),
      recordCount: 0,
      createdAt: new Date()
    };

    setExportJobs([newJob, ...exportJobs]);

    // Simular processamento
    const progressInterval = setInterval(() => {
      setExportJobs(jobs => 
        jobs.map(job => 
          job.id === jobId 
            ? { ...job, progress: Math.min(100, job.progress + Math.random() * 20) }
            : job
        )
      );
    }, 500);

    // Simular conclusão após 3 segundos
    setTimeout(() => {
      clearInterval(progressInterval);
      setExportJobs(jobs => 
        jobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status: 'completed' as const, 
                progress: 100,
                recordCount: Math.floor(Math.random() * 2000) + 500,
                completedAt: new Date(),
                downloadUrl: '#'
              }
            : job
        )
      );
    }, 3000);

    // Gerar arquivo real baseado no formato
    generateExportFile(selectedFields, format);
  };

  const generateExportFile = (fields: ExportField[], format: string) => {
    // Obter dados do localStorage
    const leads = localDB.getLeads();
    const results = localDB.getResults();
    const quizzes = localDB.getQuizzes();

    // Filtrar dados baseado nos filtros
    let filteredData = leads.filter(lead => {
      // Filtro por data
      if (filters.dateRange.start && new Date(lead.createdAt) < filters.dateRange.start) return false;
      if (filters.dateRange.end && new Date(lead.createdAt) > filters.dateRange.end) return false;
      
      // Filtro por quiz
      if (filters.quizzes.length > 0 && !filters.quizzes.includes(lead.quizId)) return false;
      
      // Filtro por status
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false;
      
      // Filtro por origem
      if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) return false;
      
      return true;
    });

    // Preparar dados para exportação
    const exportData = filteredData.map(lead => {
      const result = results.find(r => r.leadId === lead.id);
      const quiz = quizzes.find(q => q.id === lead.quizId);
      
      const row: any = {};
      
      fields.forEach(field => {
        switch (field.id) {
          case 'id':
            row[field.name] = lead.id;
            break;
          case 'name':
            row[field.name] = lead.name;
            break;
          case 'email':
            row[field.name] = lead.email;
            break;
          case 'phone':
            row[field.name] = lead.phone || '';
            break;
          case 'createdAt':
            row[field.name] = format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR });
            break;
          case 'status':
            row[field.name] = lead.status;
            break;
          case 'source':
            row[field.name] = lead.source;
            break;
          case 'tags':
            row[field.name] = lead.tags?.join(', ') || '';
            break;
          case 'quizTitle':
            row[field.name] = quiz?.title || '';
            break;
          case 'quizId':
            row[field.name] = lead.quizId;
            break;
          case 'score':
            row[field.name] = result?.score || 0;
            break;
          case 'maxScore':
            row[field.name] = result?.maxScore || 0;
            break;
          case 'percentage':
            row[field.name] = result ? `${((result.score / result.maxScore) * 100).toFixed(1)}%` : '0%';
            break;
          case 'completionTime':
            row[field.name] = result?.completionTime || 0;
            break;
          case 'startedAt':
            row[field.name] = result?.createdAt ? format(new Date(result.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '';
            break;
          case 'completedAt':
            row[field.name] = result?.completedAt ? format(new Date(result.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '';
            break;
          case 'abandoned':
            row[field.name] = result?.completedAt ? 'Não' : 'Sim';
            break;
          default:
            row[field.name] = ''; // Campos não implementados
        }
      });
      
      return row;
    });

    // Gerar arquivo baseado no formato
    if (format === 'csv') {
      generateCSV(exportData, fields);
    } else if (format === 'json') {
      generateJSON(exportData);
    }
  };

  const generateCSV = (data: any[], fields: ExportField[]) => {
    const headers = fields.map(f => f.name).join(',');
    const rows = data.map(row => 
      fields.map(f => `"${row[f.name] || ''}"`).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const generateJSON = (data: any[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const downloadJob = (job: ExportJob) => {
    if (job.downloadUrl) {
      // Em uma implementação real, isso seria um link para o arquivo
      alert(`Download iniciado para: ${job.name}`);
    }
  };

  const selectedFieldsCount = exportFields.filter(f => f.selected).length;
  const estimatedRecords = localDB.getLeads().length; // Simplificado

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Exportação Avançada</h3>
          <p className="text-muted-foreground">
            Exporte dados detalhados em múltiplos formatos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCreatingTemplate(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Criar Template
          </Button>
          <Button onClick={() => startExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configure">Configurar</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="jobs">Histórico</TabsTrigger>
          <TabsTrigger value="schedule">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Templates Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Templates Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.filter(t => t.isDefault).map(template => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => selectTemplate(template.id)}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {filters.dateRange.start 
                            ? format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })
                            : 'Início'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.start || undefined}
                          onSelect={(date) => setFilters({
                            ...filters,
                            dateRange: { ...filters.dateRange, start: date || null }
                          })}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {filters.dateRange.end 
                            ? format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })
                            : 'Fim'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.end || undefined}
                          onSelect={(date) => setFilters({
                            ...filters,
                            dateRange: { ...filters.dateRange, end: date || null }
                          })}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="qualified">Qualificado</SelectItem>
                      <SelectItem value="contacted">Contatado</SelectItem>
                      <SelectItem value="converted">Convertido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="completed-only"
                    checked={filters.completedOnly}
                    onCheckedChange={(checked) => 
                      setFilters({ ...filters, completedOnly: !!checked })
                    }
                  />
                  <Label htmlFor="completed-only">Apenas concluídos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-anonymous"
                    checked={filters.includeAnonymous}
                    onCheckedChange={(checked) => 
                      setFilters({ ...filters, includeAnonymous: !!checked })
                    }
                  />
                  <Label htmlFor="include-anonymous">Incluir anônimos</Label>
                </div>
              </CardContent>
            </Card>

            {/* Resumo da Exportação */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Campos selecionados</span>
                  <Badge>{selectedFieldsCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Registros estimados</span>
                  <Badge variant="outline">{estimatedRecords.toLocaleString()}</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Formato de Exportação</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => startExport('csv')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => startExport('excel')}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => startExport('json')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => startExport('pdf')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Campos */}
          <Card>
            <CardHeader>
              <CardTitle>Campos para Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Básicos</TabsTrigger>
                  <TabsTrigger value="advanced">Avançados</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="custom">Personalizados</TabsTrigger>
                </TabsList>

                {['basic', 'advanced', 'analytics', 'custom'].map(category => (
                  <TabsContent key={category} value={category}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exportFields
                        .filter(field => field.category === category)
                        .map(field => (
                          <div key={field.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={field.id}
                              checked={field.selected}
                              onCheckedChange={() => toggleField(field.id)}
                              disabled={field.required}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Label
                                htmlFor={field.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.name}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && <Badge variant="secondary">Padrão</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Campos:</span>
                      <Badge variant="outline">{template.fields.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Formato:</span>
                      <Badge>{template.format.toUpperCase()}</Badge>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => selectTemplate(template.id)}
                    >
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="space-y-4">
            {exportJobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{job.name}</h4>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'processing' ? 'secondary' :
                          job.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {job.status === 'completed' ? 'Concluído' :
                           job.status === 'processing' ? 'Processando' :
                           job.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{job.format}</span>
                        <span>{job.recordCount.toLocaleString()} registros</span>
                        <span>{format(job.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      </div>

                      {job.status === 'processing' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}

                      {job.error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                          <AlertCircle className="w-4 h-4" />
                          {job.error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button size="sm" onClick={() => downloadJob(job)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {job.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {job.status === 'processing' && (
                        <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {job.status === 'failed' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="space-y-4">
            {scheduledExports.map(scheduled => (
              <Card key={scheduled.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{scheduled.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Template: {templates.find(t => t.id === scheduled.template)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Próxima execução: {format(scheduled.nextRun, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={scheduled.active ? 'default' : 'secondary'}>
                        {scheduled.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Template Modal */}
      {isCreatingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Criar Template Personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input 
                  id="template-name" 
                  placeholder="Ex: Relatório Personalizado"
                  value={customTemplate.name}
                  onChange={(e) => setCustomTemplate({ ...customTemplate, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-description">Descrição</Label>
                <Textarea 
                  id="template-description" 
                  placeholder="Descreva o propósito deste template..."
                  value={customTemplate.description}
                  onChange={(e) => setCustomTemplate({ ...customTemplate, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-format">Formato Padrão</Label>
                <Select 
                  value={customTemplate.format} 
                  onValueChange={(value: 'csv' | 'excel' | 'json' | 'pdf') => 
                    setCustomTemplate({ ...customTemplate, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>
                  Cancelar
                </Button>
                <Button onClick={createCustomTemplate}>
                  Criar Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdvancedExportManager;