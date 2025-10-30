import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Safety timeout for loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        console.warn('Auth page: Loading timeout reached');
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // Check for error messages in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      toast({
        title: "Erro de autenticação",
        description: errorDescription || error,
        variant: "destructive",
      });
    }
  }, [location, toast]);

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setDebugInfo('');
    
    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, fullName);
      } else {
        result = await signIn(email, password);
      }
      
      if (result.error) {
        console.error('Auth error:', result.error);
        setDebugInfo(`Error code: ${result.error.code || 'unknown'}, Message: ${result.error.message}`);
        
        toast({
          title: "Erro na autenticação",
          description: result.error.message || "Não foi possível completar a operação.",
          variant: "destructive",
        });
      } else {
        if (isSignUp) {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta."
          });
        } else {
          toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta!"
          });
          navigate('/app');
        }
      }
    } catch (error: any) {
      console.error('Auth exception:', error);
      setDebugInfo(`Exception: ${error.message || error}`);
      
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível completar a operação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setDebugInfo('');
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google login error:', error);
        setDebugInfo(`Google error code: ${error.code || 'unknown'}, Message: ${error.message}`);
        
        toast({
          title: "Erro no login com Google",
          description: error.message || "Não foi possível fazer login com Google.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Google login exception:', error);
      setDebugInfo(`Google exception: ${error.message || error}`);
      
      toast({
        title: "Erro no login com Google",
        description: "Não foi possível fazer login com Google. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('user_profiles').select('count');
      if (error) {
        setDebugInfo(`Supabase connection test failed: ${error.message}`);
      } else {
        setDebugInfo('Supabase connection test successful');
      }
    } catch (error: any) {
      setDebugInfo(`Supabase connection test error: ${error.message || error}`);
    }
  };

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-lg">Carregando...</div>
          <p className="text-sm text-muted-foreground">Verificando autentica\u00e7\u00e3o...</p>
        </div>
      </div>
    );
  }
  
  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">\u26a0\ufe0f Tempo esgotado</CardTitle>
            <CardDescription className="text-center">
              A verifica\u00e7\u00e3o de autentica\u00e7\u00e3o est\u00e1 demorando mais que o esperado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Isso pode acontecer devido a problemas de conex\u00e3o. Voc\u00ea pode:
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="default"
              >
                Recarregar P\u00e1gina
              </Button>
              <Button 
                onClick={() => {
                  setLoadingTimeout(false);
                  navigate('/auth');
                }} 
                className="w-full"
                variant="outline"
              >
                Tentar Fazer Login
              </Button>
            </div>
            {debugInfo && (
              <div className="text-xs p-3 bg-yellow-50 border border-yellow-200 rounded">
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">EQ</span>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Elevado Quizz
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Crie sua conta gratuita' : 'Entre em sua conta'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Google Login Button */}
          <Button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
            size="lg"
            disabled={loading || authLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou use email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Input
                  type="text"
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || authLoading}
            >
              {authLoading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary"
            >
              {isSignUp 
                ? 'Já tem uma conta? Faça login' 
                : 'Não tem conta? Cadastre-se'}
            </Button>
          </div>

          {/* Debug section */}
          {debugInfo && (
            <div className="text-xs p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Debug:</strong> {debugInfo}
            </div>
          )}

          <div className="text-center">
            <Button
              variant="link"
              onClick={testSupabaseConnection}
              className="text-xs text-muted-foreground"
            >
              Testar conexão com Supabase
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate('/app/auth-test')}
              className="text-xs text-muted-foreground"
            >
              Run Authentication Tests
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Use o Google para acesso rápido e seguro!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
