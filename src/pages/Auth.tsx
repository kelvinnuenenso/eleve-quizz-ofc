import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDemoMode } from '@/hooks/useDemoMode';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Auth() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const { isDemoMode, enterDemoMode, demoUser } = useDemoMode();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  


  useEffect(() => {
    if ((user && !loading) || (isDemoMode && demoUser)) {
      // Aguarda um pouco para garantir que a sessão foi totalmente estabelecida
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate, isDemoMode, demoUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      if (isSignUp) {
        // Use Supabase Auth directly
        const { error } = await signUp(email, password, fullName);
        
        if (!error) {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta."
          });
          setIsSignUp(false); // Switch to login form
        } else {
          console.error('Signup error:', error);
          toast({
            title: "Erro na criação da conta",
            description: error.message || "Não foi possível criar a conta.",
            variant: "destructive",
          });
        }
      } else {
        // Use Supabase Auth directly
        const { error } = await signIn(email, password);
        
        if (!error) {
          toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta!"
          });
          // Aguarda a sessão ser estabelecida antes de redirecionar
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        } else {
          console.error('Login error:', error);
          let errorMessage = "Credenciais inválidas.";
          
          if (error.message?.includes('Invalid login credentials')) {
            errorMessage = "Email ou senha incorretos.";
          } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = "Por favor, confirme seu email antes de fazer login.";
          } else if (error.message?.includes('Too many requests')) {
            errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast({
            title: "Erro no login",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível completar a operação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setAuthLoading(true);
    try {
      await enterDemoMode();
      // Navigate to dashboard after demo mode is activated
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (error) {
      toast({
        title: "Erro no modo DEMO",
        description: "Não foi possível ativar o modo DEMO. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Erro no login com Google",
          description: error.message || "Não foi possível fazer login com Google.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no login com Google",
        description: "Não foi possível fazer login com Google. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900 transition-colors duration-300">
        <div className="animate-pulse text-gray-900 dark:text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900 transition-colors duration-300 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl border-0 bg-white dark:bg-gray-800 transition-colors duration-300">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mx-auto transition-colors duration-300">
            <span className="text-white font-bold text-2xl">EQ</span>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
            Quiz Platform
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            {isSignUp ? 'Crie sua conta gratuita' : 'Entre em sua conta'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Google Login Button */}
          <Button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 transition-colors duration-300"
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
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">
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
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors duration-300"
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
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
            >
              {isSignUp 
                ? 'Já tem uma conta? Faça login' 
                : 'Não tem conta? Cadastre-se'}
            </Button>
          </div>

          <div className="text-center pt-4 border-t space-y-3">
            <Button
              onClick={handleDemoMode}
              variant="outline"
              className="w-full border-dashed border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              size="lg"
              disabled={loading || authLoading}
            >
              🎮 Entrar em Modo DEMO
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              💡 <strong>Dica:</strong> Use o Google para acesso rápido e seguro!
            </p>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              🎮 <strong>Modo DEMO:</strong> Explore as funcionalidades com dados de exemplo (somente leitura)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}