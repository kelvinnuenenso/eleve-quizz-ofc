import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const { isDemoMode, demoUser } = useDemoMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !session) && (!isDemoMode || !demoUser)) {
      navigate('/auth');
    }
  }, [user, session, loading, navigate, isDemoMode, demoUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Allow access if user is authenticated OR in demo mode
  if ((!user || !session) && (!isDemoMode || !demoUser)) {
    return null;
  }

  return <>{children}</>;
}