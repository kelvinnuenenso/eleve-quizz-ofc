import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertTriangle, Info, Settings, Filter, Archive, Trash2, Eye, EyeOff, Volume2, VolumeX, Clock, User, Tag, Search, Download, Upload } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Tipos de notificação
export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'quiz_complete' | 'lead_capture' | 'system' | 'integration' | 'analytics';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  userId?: string;
  quizId?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: Record<string, boolean>;
  priority: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'batched' | 'daily';
}

export interface NotificationSystemProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  email: false,
  categories: {
    quiz_complete: true,
    lead_capture: true,
    system: true,
    integration: true,
    analytics: true,
    success: true,
    warning: true,
    error: true,
    info: true
  },
  priority: {
    low: true,
    medium: true,
    high: true,
    urgent: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  frequency: 'immediate'
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  userId,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<{
    category: string;
    priority: string;
    read: string;
    search: string;
  }>({
    category: 'all',
    priority: 'all',
    read: 'all',
    search: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Inicializar notificações simuladas
  useEffect(() => {
    const simulatedNotifications: Notification[] = [
      {
        id: '1',
        type: 'quiz_complete',
        title: 'Quiz Completado',
        message: 'O quiz "Descubra seu Perfil de Cliente" foi completado por João Silva',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'medium',
        category: 'Quiz',
        quizId: 'quiz-1',
        actions: [
          {
            id: 'view-results',
            label: 'Ver Resultados',
            action: () => toast.success('Abrindo resultados do quiz')
          }
        ]
      },
      {
        id: '2',
        type: 'lead_capture',
        title: 'Novo Lead Capturado',
        message: 'Maria Santos forneceu email: maria@email.com no quiz de Marketing',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'high',
        category: 'Leads',
        actions: [
          {
            id: 'view-lead',
            label: 'Ver Lead',
            action: () => toast.success('Abrindo perfil do lead')
          },
          {
            id: 'add-to-crm',
            label: 'Adicionar ao CRM',
            action: () => toast.success('Lead adicionado ao CRM')
          }
        ]
      },
      {
        id: '3',
        type: 'warning',
        title: 'Taxa de Abandono Alta',
        message: 'O quiz "Avaliação de Produto" tem 65% de abandono na pergunta 3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'high',
        category: 'Analytics',
        actions: [
          {
            id: 'analyze',
            label: 'Analisar',
            action: () => toast.success('Abrindo análise de abandono')
          }
        ]
      },
      {
        id: '4',
        type: 'integration',
        title: 'Webhook Falhou',
        message: 'Falha ao enviar dados para HubSpot - Erro 500',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: false,
        priority: 'urgent',
        category: 'Integrações',
        actions: [
          {
            id: 'retry',
            label: 'Tentar Novamente',
            action: () => toast.success('Reenviando webhook')
          },
          {
            id: 'check-config',
            label: 'Verificar Configuração',
            action: () => toast.success('Abrindo configurações do webhook')
          }
        ]
      },
      {
        id: '5',
        type: 'success',
        title: 'Backup Concluído',
        message: 'Backup automático dos dados foi concluído com sucesso',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        priority: 'low',
        category: 'Sistema'
      }
    ];

    setNotifications(simulatedNotifications);
    loadSettings();
  }, []);

  // Carregar configurações
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  };

  // Salvar configurações
  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
    toast.success('Configurações salvas');
  };

  // Adicionar nova notificação
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    // Verificar se as notificações estão habilitadas
    if (!settings.enabled) return;

    // Verificar categoria
    if (!settings.categories[notification.type]) return;

    // Verificar prioridade
    if (!settings.priority[notification.priority]) return;

    // Verificar horário silencioso
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = parseInt(settings.quietHours.start.split(':')[0]) * 60 + parseInt(settings.quietHours.start.split(':')[1]);
      const endTime = parseInt(settings.quietHours.end.split(':')[0]) * 60 + parseInt(settings.quietHours.end.split(':')[1]);
      
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) return;
      } else {
        if (currentTime >= startTime || currentTime <= endTime) return;
      }
    }

    setNotifications(prev => [newNotification, ...prev]);

    // Som
    if (settings.sound) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {});
    }

    // Notificação desktop
    if (settings.desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        });
      }
    }

    // Toast
    toast(notification.title, {
      description: notification.message,
      duration: 5000
    });
  }, [settings]);

  // Marcar como lida
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast.success('Todas as notificações foram marcadas como lidas');
  };

  // Excluir notificação
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.success('Notificação excluída');
  };

  // Excluir selecionadas
  const deleteSelected = () => {
    setNotifications(prev => prev.filter(notification => !selectedNotifications.includes(notification.id)));
    setSelectedNotifications([]);
    toast.success(`${selectedNotifications.length} notificações excluídas`);
  };

  // Arquivar notificação
  const archiveNotification = (id: string) => {
    // Implementar lógica de arquivamento
    deleteNotification(id);
    toast.success('Notificação arquivada');
  };

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    if (filter.category !== 'all' && notification.category !== filter.category) return false;
    if (filter.priority !== 'all' && notification.priority !== filter.priority) return false;
    if (filter.read === 'read' && !notification.read) return false;
    if (filter.read === 'unread' && notification.read) return false;
    if (filter.search && !notification.title.toLowerCase().includes(filter.search.toLowerCase()) && 
        !notification.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  // Contar não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Ícone por tipo
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Cor por prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-200';
      case 'high': return 'bg-orange-100 border-orange-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      case 'low': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 px-1 min-w-[1.2rem] h-5 text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Modal de notificações */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} não lidas</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Marcar todas como lidas
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurações de Notificação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label>Notificações habilitadas</Label>
                        <Switch
                          checked={settings.enabled}
                          onCheckedChange={(enabled) =>
                            saveSettings({ ...settings, enabled })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Som</Label>
                        <Switch
                          checked={settings.sound}
                          onCheckedChange={(sound) =>
                            saveSettings({ ...settings, sound })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Notificações desktop</Label>
                        <Switch
                          checked={settings.desktop}
                          onCheckedChange={(desktop) =>
                            saveSettings({ ...settings, desktop })
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Categorias</Label>
                        {Object.entries(settings.categories).map(([category, enabled]) => (
                          <div key={category} className="flex items-center justify-between">
                            <Label className="capitalize">{category.replace('_', ' ')}</Label>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) =>
                                saveSettings({
                                  ...settings,
                                  categories: { ...settings.categories, [category]: checked }
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <Label>Horário Silencioso</Label>
                        <div className="flex items-center justify-between">
                          <Label>Habilitado</Label>
                          <Switch
                            checked={settings.quietHours.enabled}
                            onCheckedChange={(enabled) =>
                              saveSettings({
                                ...settings,
                                quietHours: { ...settings.quietHours, enabled }
                              })
                            }
                          />
                        </div>
                        {settings.quietHours.enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Início</Label>
                              <Input
                                type="time"
                                value={settings.quietHours.start}
                                onChange={(e) =>
                                  saveSettings({
                                    ...settings,
                                    quietHours: { ...settings.quietHours, start: e.target.value }
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>Fim</Label>
                              <Input
                                type="time"
                                value={settings.quietHours.end}
                                onChange={(e) =>
                                  saveSettings({
                                    ...settings,
                                    quietHours: { ...settings.quietHours, end: e.target.value }
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar notificações..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="w-full"
                />
              </div>
              <Select value={filter.category} onValueChange={(value) => setFilter({ ...filter, category: value })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Leads">Leads</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Integrações">Integrações</SelectItem>
                  <SelectItem value="Sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filter.priority} onValueChange={(value) => setFilter({ ...filter, priority: value })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filter.read} onValueChange={(value) => setFilter({ ...filter, read: value })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Não lidas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações em lote */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {selectedNotifications.length} selecionadas
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNotifications([])}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Lista de notificações */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma notificação encontrada</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 border-blue-200' : ''
                      } ${getPriorityColor(notification.priority)}`}
                      onClick={() => {
                        markAsRead(notification.id);
                        onNotificationClick?.(notification);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedNotifications.includes(notification.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedNotifications([...selectedNotifications, notification.id]);
                              } else {
                                setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex-shrink-0">
                            {getTypeIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                                <Badge
                                  variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {notification.timestamp.toLocaleString()}
                              </span>
                              
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex gap-1">
                                  {notification.actions.map((action) => (
                                    <Button
                                      key={action.id}
                                      variant={action.variant || 'outline'}
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.action();
                                      }}
                                      className="text-xs h-6"
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {notification.read ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationSystem;