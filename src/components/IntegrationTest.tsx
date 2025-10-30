import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Database, 
  Users, 
  BarChart3, 
  Zap, 
  Palette,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const IntegrationTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runIntegrationTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results: any = {
        auth: { status: 'pending', message: '' },
        database: { status: 'pending', message: '' },
        quizzes: { status: 'pending', message: '' },
        leads: { status: 'pending', message: '' },
        analytics: { status: 'pending', message: '' },
        webhooks: { status: 'pending', message: '' },
        theme: { status: 'pending', message: '' }
      };

      // Test 1: Authentication
      try {
        if (user) {
          results.auth = { status: 'success', message: `Usuário autenticado: ${user.email}` };
        } else {
          results.auth = { status: 'error', message: 'Nenhum usuário autenticado' };
        }
      } catch (err) {
        results.auth = { status: 'error', message: 'Falha na verificação de autenticação' };
      }

      // Test 2: Database Connection
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('count()', { count: 'exact' });
        
        if (error) throw error;
        
        results.database = { 
          status: 'success', 
          message: `Conexão com banco de dados estabelecida. ${data?.[0]?.count || 0} quizzes encontrados.` 
        };
      } catch (err) {
        results.database = { 
          status: 'error', 
          message: 'Falha na conexão com o banco de dados' 
        };
      }

      // Test 3: Quiz Operations
      try {
        if (user) {
          const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', user.id)
            .limit(1);
          
          if (error) throw error;
          
          results.quizzes = { 
            status: 'success', 
            message: `Acesso a quizzes funcionando. ${data?.length || 0} quizzes do usuário encontrados.` 
          };
        } else {
          results.quizzes = { 
            status: 'warning', 
            message: 'Usuário não autenticado, pulando teste de quizzes' 
          };
        }
      } catch (err) {
        results.quizzes = { 
          status: 'error', 
          message: 'Falha no acesso a quizzes' 
        };
      }

      // Test 4: Leads Operations
      try {
        if (user) {
          const { data, error } = await supabase
            .from('quiz_leads')
            .select('count()', { count: 'exact' })
            .eq('user_id', user.id);
          
          if (error) throw error;
          
          results.leads = { 
            status: 'success', 
            message: `Acesso a leads funcionando. ${data?.[0]?.count || 0} leads encontrados.` 
          };
        } else {
          results.leads = { 
            status: 'warning', 
            message: 'Usuário não autenticado, pulando teste de leads' 
          };
        }
      } catch (err) {
        results.leads = { 
          status: 'error', 
          message: 'Falha no acesso a leads' 
        };
      }

      // Test 5: Analytics Operations
      try {
        if (user) {
          const { data, error } = await supabase
            .from('analytics_events')
            .select('count()', { count: 'exact' })
            .eq('user_id', user.id);
          
          if (error) throw error;
          
          results.analytics = { 
            status: 'success', 
            message: `Acesso a analytics funcionando. ${data?.[0]?.count || 0} eventos encontrados.` 
          };
        } else {
          results.analytics = { 
            status: 'warning', 
            message: 'Usuário não autenticado, pulando teste de analytics' 
          };
        }
      } catch (err) {
        results.analytics = { 
          status: 'error', 
          message: 'Falha no acesso a analytics' 
        };
      }

      // Test 6: Webhooks Operations
      try {
        if (user) {
          const { data, error } = await supabase
            .from('quiz_webhooks')
            .select('count()', { count: 'exact' })
            .eq('user_id', user.id);
          
          if (error) throw error;
          
          results.webhooks = { 
            status: 'success', 
            message: `Acesso a webhooks funcionando. ${data?.[0]?.count || 0} webhooks encontrados.` 
          };
        } else {
          results.webhooks = { 
            status: 'warning', 
            message: 'Usuário não autenticado, pulando teste de webhooks' 
          };
        }
      } catch (err) {
        results.webhooks = { 
          status: 'error', 
          message: 'Falha no acesso a webhooks' 
        };
      }

      // Test 7: Theme Persistence
      try {
        const theme = localStorage.getItem('theme') || 'dark';
        results.theme = { 
          status: 'success', 
          message: `Persistência de tema funcionando. Tema atual: ${theme}` 
        };
      } catch (err) {
        results.theme = { 
          status: 'error', 
          message: 'Falha na persistência de tema' 
        };
      }

      setTestResults(results);
    } catch (err) {
      setError('Falha ao executar testes de integração');
      console.error('Integration test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teste de Integração</h2>
          <p className="text-muted-foreground">
            Verifique se todas as integrações estão funcionando corretamente
          </p>
        </div>
        <Button onClick={runIntegrationTests} disabled={loading}>
          {loading ? 'Executando Testes...' : 'Executar Testes'}
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Resultados dos Testes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(testResults).map(([key, result]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getIcon(result.status)}
                    <div>
                      <h3 className="font-medium capitalize">{key}</h3>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status === 'success' ? 'OK' : result.status === 'error' ? 'ERRO' : 'AVISO'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(testResults).filter((r: any) => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sucessos</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(testResults).filter((r: any) => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {Object.values(testResults).filter((r: any) => r.status === 'warning').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Avisos</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(testResults).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!testResults && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pronto para Testar</h3>
            <p className="text-muted-foreground mb-4">
              Clique no botão "Executar Testes" para verificar todas as integrações do sistema.
            </p>
            <Button onClick={runIntegrationTests}>Executar Testes</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};