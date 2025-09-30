import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { localDB, type UserProfile } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  ArrowLeft,
  Crown,
  Database,
  Shield,
  Bell,
  Palette,
  Save
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userProfile = localDB.getUserProfile();
    setProfile(userProfile);
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      localDB.saveUserProfile(profile);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = localDB.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elevado-quizz-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Dados exportados!",
        description: "O backup foi baixado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = localDB.importData(data);
        
        if (success) {
          toast({
            title: "Dados importados!",
            description: "O backup foi restaurado com sucesso."
          });
          window.location.reload();
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "O arquivo não é válido ou está corrompido.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta ação irá remover permanentemente todos os seus quizzes, respostas, leads e configurações. Esta ação não pode ser desfeita. Tem certeza?')) {
      return;
    }

    if (!window.confirm('Esta é sua última chance! Todos os dados serão perdidos para sempre. Confirma?')) {
      return;
    }

    try {
      localDB.clearAllData();
      toast({
        title: "Dados removidos",
        description: "Todos os dados foram removidos do dispositivo."
      });
      signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao limpar dados",
        variant: "destructive"
      });
    }
  };

  const storageInfo = localDB.getStorageUsage();
  const allQuizzes = localDB.getAllQuizzes();
  const allLeads = localDB.getAllLeads();

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-card dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app')}
                className="dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground dark:text-white transition-colors">Configurações</h1>
                <p className="text-muted-foreground dark:text-gray-400 mt-1 transition-colors">
                  Gerencie sua conta e preferências
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2 dark:bg-gray-700 dark:text-gray-300 transition-colors">
              <Crown className="w-4 h-4" />
              Plano {profile.plan === 'free' ? 'Gratuito' : profile.plan.toUpperCase()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl dark:bg-gray-800 dark:border-gray-700 transition-colors">
            <TabsTrigger value="profile" className="gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-colors">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-colors">
              <SettingsIcon className="w-4 h-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-colors">
              <Database className="w-4 h-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-colors">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-colors">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center transition-colors">
                    <User className="w-8 h-8 text-primary dark:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold dark:text-white transition-colors">{profile.name}</h3>
                    <p className="text-muted-foreground dark:text-gray-400 transition-colors">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="dark:text-gray-300 transition-colors">Nome completo</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="dark:text-gray-300 transition-colors">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={loading} className="dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </Card>

            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center dark:bg-gray-800 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-primary dark:text-blue-400 transition-colors">{allQuizzes.length}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">Quizzes criados</div>
              </Card>
              <Card className="p-4 text-center dark:bg-gray-800 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors">{allLeads.length}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">Leads capturados</div>
              </Card>
              <Card className="p-4 text-center dark:bg-gray-800 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors">
                  {Math.round(storageInfo.percentage)}%
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">Armazenamento usado</div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
              <h3 className="text-lg font-semibold mb-4 dark:text-white transition-colors">Preferências Gerais</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="dark:text-gray-300 transition-colors">Salvamento automático</Label>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                      Salva automaticamente as alterações enquanto você edita
                    </p>
                  </div>
                  <Switch
                    checked={profile.settings.autoSave}
                    onCheckedChange={(checked) =>
                      setProfile({
                        ...profile,
                        settings: { ...profile.settings, autoSave: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="dark:text-gray-300 transition-colors">Tema escuro</Label>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                      Ativar modo escuro na interface
                    </p>
                  </div>
                  <Switch
                    checked={profile.settings.theme === 'dark'}
                    onCheckedChange={(checked) =>
                      setProfile({
                        ...profile,
                        settings: { 
                          ...profile.settings, 
                          theme: checked ? 'dark' : 'light' 
                        }
                      })
                    }
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
              <h3 className="text-lg font-semibold mb-4 dark:text-white transition-colors">Gerenciamento de Dados</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2 dark:text-gray-300 transition-colors">Uso do armazenamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm dark:text-gray-400 transition-colors">
                      <span>Usado: {Math.round(storageInfo.used / 1024)} KB</span>
                      <span>Total: {Math.round(storageInfo.total / 1024 / 1024)} MB</span>
                    </div>
                    <Progress value={storageInfo.percentage} className="h-2 dark:bg-gray-700 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium dark:text-gray-300 transition-colors">Exportar dados</h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                        Baixe um backup completo dos seus dados
                      </p>
                    </div>
                    <Button onClick={handleExportData} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium dark:text-gray-300 transition-colors">Importar dados</h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                        Restaure um backup anterior
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        id="import-file"
                      />
                      <Button variant="outline" asChild className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                        <label htmlFor="import-file" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Importar
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-destructive/20 dark:bg-gray-800 dark:border-red-900/50 transition-colors">
              <h3 className="text-lg font-semibold mb-4 text-destructive dark:text-red-400 transition-colors">Zona de Perigo</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium dark:text-gray-300 transition-colors">Limpar todos os dados</h4>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3 transition-colors">
                    Remove permanentemente todos os quizzes, respostas, leads e configurações.
                    Esta ação não pode ser desfeita.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleClearAllData}
                    className="dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar todos os dados
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
              <h3 className="text-lg font-semibold mb-4 dark:text-white transition-colors">Notificações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="dark:text-gray-200 transition-colors">Notificações por email</Label>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={profile.settings.notifications}
                    onCheckedChange={(checked) =>
                      setProfile({
                        ...profile,
                        settings: { ...profile.settings, notifications: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="dark:text-gray-200 transition-colors">Notificações de leads</Label>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                      Seja notificado quando capturar novos leads
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="dark:text-gray-200 transition-colors">Relatórios semanais</Label>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 transition-colors">
                      Receba resumos semanais de performance
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
              <h3 className="text-lg font-semibold mb-4 dark:text-white transition-colors">Segurança</h3>
              <div className="space-y-4">
                <div>
                  <Label className="dark:text-gray-200 transition-colors">Alterar senha</Label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3 transition-colors">
                    Mantenha sua conta segura com uma senha forte
                  </p>
                  <Button variant="outline" disabled className="dark:border-gray-600 dark:text-gray-400 transition-colors">
                    Alterar senha (em breve)
                  </Button>
                </div>

                <div>
                  <Label className="dark:text-gray-200 transition-colors">Autenticação de dois fatores</Label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3 transition-colors">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                  <Button variant="outline" disabled className="dark:border-gray-600 dark:text-gray-400 transition-colors">
                    Configurar 2FA (em breve)
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;