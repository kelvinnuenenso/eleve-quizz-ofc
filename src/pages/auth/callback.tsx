import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Página de callback para autenticação OAuth (Google, etc.)
 * Esta página processa o retorno da autenticação OAuth e redireciona o usuário
 * para o dashboard após o login bem-sucedido.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processa o callback de autenticação OAuth
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro no callback de autenticação:', error);
          toast({
            title: "Erro na autenticação",
            description: "Não foi possível completar o login. Tente novamente.",
            variant: "destructive",
          });
          navigate('/auth', { replace: true });
          return;
        }

        if (data.session) {
          // Login bem-sucedido, redireciona para o dashboard
          toast({
            title: "Login realizado!",
            description: "Bem-vindo! Redirecionando para o dashboard..."
          });
          
          // Aguarda um pouco para garantir que a sessão foi estabelecida
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
          // Nenhuma sessão encontrada, redireciona para login
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('Erro inesperado no callback:', error);
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro durante a autenticação.",
          variant: "destructive",
        });
        navigate('/auth', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">Processando autenticação...</h2>
        <p className="text-gray-500 dark:text-gray-400 transition-colors">Aguarde enquanto completamos seu login.</p>
      </div>
    </div>
  );
}