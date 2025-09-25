import React, { useState, useEffect } from 'react';
import { Download, Upload, Shield, Clock, Database, AlertTriangle, CheckCircle, RefreshCw, Settings, Calendar, FileText, Archive, Trash2, Eye, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export interface BackupConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number; // dias
  includeQuizzes: boolean;
  includeResponses: boolean;
  includeAnalytics: boolean;
  includeSettings: boolean;
  includeIntegrations: boolean;
  compression: boolean;
  encryption: boolean;
  destination: 'local' | 'cloud' | 'external';
  cloudProvider?: 'aws' | 'google' | 'azure' | 'dropbox';
  externalUrl?: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface BackupFile {
  id: string;
  configId: string;
  name: string;
  size: number;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'failed' | 'in_progress' | 'corrupted';
  createdAt: Date;
  duration: number;
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
  metadata: {
    quizCount: number;
    responseCount: number;
    fileCount: number;
    version: string;
  };
  error?: string;
}

export interface RestoreOperation {
  id: string;
  backupId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  restoredItems: {
    quizzes: number;
    responses: number;
    settings: number;
    integrations: number;
  };
  error?: string;
}

export interface BackupManagerProps {
  userId?: string;
}

const defaultConfig: Omit<BackupConfig, 'id' | 'createdAt'> = {
  name: 'Backup Automático',
  description: 'Backup completo dos dados do sistema',
  enabled: true,
  frequency: 'daily',
  time: '02:00',
  retention: 30,
  includeQuizzes: true,
  includeResponses: true,
  includeAnalytics: true,
  includeSettings: true,
  includeIntegrations: true,
  compression: true,
  encryption: true,
  destination: 'local'
};

export const BackupManager: React.FC<BackupManagerProps> = ({ userId }) => {
  const [configs, setConfigs] = useState<BackupConfig[]>([]);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [restoreOperations, setRestoreOperations] = useState<RestoreOperation[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<BackupConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<{
    type: 'backup' | 'restore';
    progress: number;
    status: string;
  } | null>(null);

  // Inicializar dados simulados
  useEffect(() => {
    const simulatedConfigs: BackupConfig[] = [
      {
        id: '1',
        name: 'Backup Diário Completo',
        description: 'Backup automático de todos os dados do sistema',
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retention: 30,
        includeQuizzes: true,
        includeResponses: true,
        includeAnalytics: true,
        includeSettings: true,
        includeIntegrations: true,
        compression: true,
        encryption: true,
        destination: 'cloud',
        cloudProvider: 'aws',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Backup Semanal Arquivos',
        description: 'Backup semanal apenas dos quizzes e configurações',
        enabled: true,
        frequency: 'weekly',
        time: '01:00',
        retention: 90,
        includeQuizzes: true,
        includeResponses: false,
        includeAnalytics: false,
        includeSettings: true,
        includeIntegrations: true,
        compression: true,
        encryption: false,
        destination: 'local',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    ];

    const simulatedBackups: BackupFile[] = [
      {
        id: '1',
        configId: '1',
        name: 'backup_completo_2024_01_20.zip',
        size: 15728640, // 15MB
        type: 'full',
        status: 'completed',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        duration: 45000, // 45 segundos
        checksum: 'sha256:a1b2c3d4e5f6...',
        compressed: true,
        encrypted: true,
        metadata: {
          quizCount: 25,
          responseCount: 1250,
          fileCount: 156,
          version: '1.0.0'
        }
      },
      {
        id: '2',
        configId: '1',
        name: 'backup_completo_2024_01_19.zip',
        size: 14680064, // 14MB
        type: 'full',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        duration: 42000,
        checksum: 'sha256:b2c3d4e5f6g7...',
        compressed: true,
        encrypted: true,
        metadata: {
          quizCount: 24,
          responseCount: 1180,
          fileCount: 148,
          version: '1.0.0'
        }
      },
      {
        id: '3',
        configId: '2',
        name: 'backup_semanal_2024_01_15.zip',
        size: 5242880, // 5MB
        type: 'incremental',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 18000,
        checksum: 'sha256:c3d4e5f6g7h8...',
        compressed: true,
        encrypted: false,
        metadata: {
          quizCount: 25,
          responseCount: 0,
          fileCount: 89,
          version: '1.0.0'
        }
      }
    ];

    setConfigs(simulatedConfigs);
    setBackups(simulatedBackups);
  }, []);

  // Criar nova configuração
  const createConfig = () => {
    const newConfig: BackupConfig = {
      ...defaultConfig,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setConfigs([...configs, newConfig]);
    setSelectedConfig(newConfig);
    setIsCreating(true);
  };

  // Salvar configuração
  const saveConfig = (config: BackupConfig) => {
    setConfigs(configs.map(c => c.id === config.id ? config : c));
    setIsCreating(false);
    setSelectedConfig(null);
    toast.success('Configuração de backup salva');
  };

  // Excluir configuração
  const deleteConfig = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
    toast.success('Configuração excluída');
  };

  // Executar backup manual
  const runBackup = async (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    setCurrentOperation({
      type: 'backup',
      progress: 0,
      status: 'Iniciando backup...'
    });

    // Simular processo de backup
    const steps = [
      'Coletando dados dos quizzes...',
      'Coletando respostas...',
      'Coletando analytics...',
      'Coletando configurações...',
      'Comprimindo arquivos...',
      'Criptografando dados...',
      'Enviando para destino...',
      'Verificando integridade...',
      'Finalizando backup...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentOperation({
        type: 'backup',
        progress: ((i + 1) / steps.length) * 100,
        status: steps[i]
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Criar novo arquivo de backup
    const newBackup: BackupFile = {
      id: Date.now().toString(),
      configId,
      name: `backup_${config.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`,
      size: Math.floor(Math.random() * 20000000) + 5000000, // 5-25MB
      type: 'full',
      status: 'completed',
      createdAt: new Date(),
      duration: 9000, // 9 segundos
      checksum: `sha256:${Math.random().toString(36).substring(2, 15)}...`,
      compressed: config.compression,
      encrypted: config.encryption,
      metadata: {
        quizCount: Math.floor(Math.random() * 50) + 10,
        responseCount: Math.floor(Math.random() * 2000) + 500,
        fileCount: Math.floor(Math.random() * 200) + 50,
        version: '1.0.0'
      }
    };

    setBackups([newBackup, ...backups]);
    setCurrentOperation(null);
    toast.success('Backup concluído com sucesso');
  };

  // Restaurar backup
  const restoreBackup = async (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    setCurrentOperation({
      type: 'restore',
      progress: 0,
      status: 'Iniciando restauração...'
    });

    const steps = [
      'Verificando integridade do backup...',
      'Descriptografando dados...',
      'Descomprimindo arquivos...',
      'Restaurando quizzes...',
      'Restaurando respostas...',
      'Restaurando configurações...',
      'Restaurando integrações...',
      'Verificando consistência...',
      'Finalizando restauração...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentOperation({
        type: 'restore',
        progress: ((i + 1) / steps.length) * 100,
        status: steps[i]
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setCurrentOperation(null);
    toast.success('Restauração concluída com sucesso');
  };

  // Baixar backup
  const downloadBackup = (backup: BackupFile) => {
    // Simular download
    const link = document.createElement('a');
    link.href = '#';
    link.download = backup.name;
    link.click();
    toast.success('Download iniciado');
  };

  // Verificar integridade
  const verifyBackup = async (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    toast.info('Verificando integridade do backup...');
    
    // Simular verificação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isValid = Math.random() > 0.1; // 90% chance de ser válido
    
    if (isValid) {
      toast.success('Backup íntegro e válido');
    } else {
      toast.error('Backup corrompido ou inválido');
      setBackups(backups.map(b => 
        b.id === backupId ? { ...b, status: 'corrupted' as const } : b
      ));
    }
  };

  // Formatar tamanho
  const formatSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Formatar duração
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Estatísticas
  const stats = {
    totalBackups: backups.length,
    totalSize: backups.reduce((sum, b) => sum + b.size, 0),
    successRate: backups.filter(b => b.status === 'completed').length / backups.length * 100,
    lastBackup: backups.length > 0 ? backups[0].createdAt : null,
    activeConfigs: configs.filter(c => c.enabled).length
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup e Recuperação</h2>
          <p className="text-gray-600">Gerencie backups e restaurações dos seus dados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createConfig}>
            <Database className="w-4 h-4 mr-2" />
            Nova Configuração
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Backups</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Tamanho Total</p>
                <p className="text-2xl font-bold">{formatSize(stats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Último Backup</p>
                <p className="text-sm font-medium">
                  {stats.lastBackup ? stats.lastBackup.toLocaleDateString() : 'Nunca'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Configs Ativas</p>
                <p className="text-2xl font-bold">{stats.activeConfigs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operação em andamento */}
      {currentOperation && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {currentOperation.type === 'backup' ? 'Executando Backup' : 'Restaurando Dados'}
                </p>
                <p className="text-sm text-blue-700">{currentOperation.status}</p>
                <Progress value={currentOperation.progress} className="mt-2" />
              </div>
              <span className="text-sm font-medium text-blue-900">
                {Math.round(currentOperation.progress)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="restore">Restauração</TabsTrigger>
          <TabsTrigger value="settings">Configurações Globais</TabsTrigger>
        </TabsList>

        {/* Configurações de Backup */}
        <TabsContent value="configs" className="space-y-4">
          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{config.name}</h3>
                        <Badge variant={config.enabled ? 'default' : 'secondary'}>
                          {config.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">{config.frequency}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Próximo: {config.nextRun?.toLocaleString()}</span>
                        <span>Último: {config.lastRun?.toLocaleString() || 'Nunca'}</span>
                        <span>Retenção: {config.retention} dias</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runBackup(config.id)}
                        disabled={!!currentOperation}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Executar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConfig(config);
                          setIsCreating(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lista de Backups */}
        <TabsContent value="backups" className="space-y-4">
          <div className="grid gap-4">
            {backups.map((backup) => (
              <Card key={backup.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{backup.name}</h3>
                        <Badge variant={
                          backup.status === 'completed' ? 'default' :
                          backup.status === 'failed' ? 'destructive' :
                          backup.status === 'corrupted' ? 'destructive' : 'secondary'
                        }>
                          {backup.status === 'completed' ? 'Concluído' :
                           backup.status === 'failed' ? 'Falhou' :
                           backup.status === 'corrupted' ? 'Corrompido' : 'Em Progresso'}
                        </Badge>
                        <Badge variant="outline">{backup.type}</Badge>
                        {backup.encrypted && <Badge variant="outline">Criptografado</Badge>}
                        {backup.compressed && <Badge variant="outline">Comprimido</Badge>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Tamanho:</span> {formatSize(backup.size)}
                        </div>
                        <div>
                          <span className="font-medium">Duração:</span> {formatDuration(backup.duration)}
                        </div>
                        <div>
                          <span className="font-medium">Quizzes:</span> {backup.metadata.quizCount}
                        </div>
                        <div>
                          <span className="font-medium">Respostas:</span> {backup.metadata.responseCount}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Criado em: {backup.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyBackup(backup.id)}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                        disabled={!!currentOperation || backup.status !== 'completed'}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Restauração */}
        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurar Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Selecionar Backup</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um backup" />
                    </SelectTrigger>
                    <SelectContent>
                      {backups.filter(b => b.status === 'completed').map((backup) => (
                        <SelectItem key={backup.id} value={backup.id}>
                          {backup.name} - {backup.createdAt.toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Restauração</Label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Restauração Completa</SelectItem>
                      <SelectItem value="selective">Restauração Seletiva</SelectItem>
                      <SelectItem value="merge">Mesclar com Dados Existentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Itens para Restaurar</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="restore-quizzes" defaultChecked />
                    <Label htmlFor="restore-quizzes">Quizzes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="restore-responses" defaultChecked />
                    <Label htmlFor="restore-responses">Respostas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="restore-analytics" />
                    <Label htmlFor="restore-analytics">Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="restore-settings" />
                    <Label htmlFor="restore-settings">Configurações</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Atenção</p>
                  <p className="text-yellow-700">
                    A restauração irá substituir os dados existentes. Recomendamos fazer um backup antes de prosseguir.
                  </p>
                </div>
              </div>

              <Button className="w-full" disabled={!!currentOperation}>
                <Upload className="w-4 h-4 mr-2" />
                Iniciar Restauração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Globais */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Globais de Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-gray-600">Executar backups automaticamente</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações</Label>
                    <p className="text-sm text-gray-600">Receber notificações sobre backups</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Limpeza Automática</Label>
                    <p className="text-sm text-gray-600">Remover backups antigos automaticamente</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Retenção Padrão (dias)</Label>
                  <Input type="number" defaultValue="30" className="mt-1" />
                </div>

                <div>
                  <Label>Tamanho Máximo por Backup (MB)</Label>
                  <Input type="number" defaultValue="100" className="mt-1" />
                </div>

                <div>
                  <Label>Localização Padrão</Label>
                  <Select defaultValue="local">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Armazenamento Local</SelectItem>
                      <SelectItem value="cloud">Nuvem</SelectItem>
                      <SelectItem value="external">URL Externa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Configuração */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedConfig ? 'Editar Configuração' : 'Nova Configuração de Backup'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedConfig && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={selectedConfig.name}
                    onChange={(e) => setSelectedConfig({
                      ...selectedConfig,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>Frequência</Label>
                  <Select
                    value={selectedConfig.frequency}
                    onValueChange={(value: any) => setSelectedConfig({
                      ...selectedConfig,
                      frequency: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={selectedConfig.description}
                  onChange={(e) => setSelectedConfig({
                    ...selectedConfig,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={selectedConfig.time}
                    onChange={(e) => setSelectedConfig({
                      ...selectedConfig,
                      time: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>Retenção (dias)</Label>
                  <Input
                    type="number"
                    value={selectedConfig.retention}
                    onChange={(e) => setSelectedConfig({
                      ...selectedConfig,
                      retention: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Incluir nos Backups</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-quizzes"
                      checked={selectedConfig.includeQuizzes}
                      onChange={(e) => setSelectedConfig({
                        ...selectedConfig,
                        includeQuizzes: e.target.checked
                      })}
                    />
                    <Label htmlFor="include-quizzes">Quizzes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-responses"
                      checked={selectedConfig.includeResponses}
                      onChange={(e) => setSelectedConfig({
                        ...selectedConfig,
                        includeResponses: e.target.checked
                      })}
                    />
                    <Label htmlFor="include-responses">Respostas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-analytics"
                      checked={selectedConfig.includeAnalytics}
                      onChange={(e) => setSelectedConfig({
                        ...selectedConfig,
                        includeAnalytics: e.target.checked
                      })}
                    />
                    <Label htmlFor="include-analytics">Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-settings"
                      checked={selectedConfig.includeSettings}
                      onChange={(e) => setSelectedConfig({
                        ...selectedConfig,
                        includeSettings: e.target.checked
                      })}
                    />
                    <Label htmlFor="include-settings">Configurações</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => saveConfig(selectedConfig)}
                  className="flex-1"
                >
                  Salvar Configuração
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedConfig(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupManager;