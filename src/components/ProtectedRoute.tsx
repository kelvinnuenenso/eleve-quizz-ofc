import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  
  // Debug log
  console.log('ProtectedRoute:', { 
    loading, 
    hasUser: !!user, 
    hasSession: !!session,
    userId: user?.id 
  });

  useEffect(() => {
    if (!loading && (!user || !session)) {
      console.log('⚠️ ProtectedRoute: Redirecionando para /auth');
      navigate('/auth');
    } else if (!loading && user && session) {
      console.log('✅ ProtectedRoute: Usuário autenticado, permitindo acesso');
    }
  }, [user, session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user || !session) {
    return null;
  }

  return <>{children}</>;
}