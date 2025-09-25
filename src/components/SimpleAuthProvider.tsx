import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DemoUserManager } from '@/lib/demoUser';

interface User {
  id: string;
  email: string;
  name?: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const SimpleAuthContext = createContext<AuthContextType | undefined>(undefined);

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export function SimpleAuthProvider({ children }: SimpleAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há usuário demo ativo
    const demoUser = DemoUserManager.getCurrentUser();
    if (demoUser) {
      setUser({
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        isDemo: true
      });
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulação de autenticação real
    if (email && password) {
      // Limpar usuário demo se existir
      DemoUserManager.clearUser();
      
      setUser({
        id: `real-${Date.now()}`,
        email,
        name: email.split('@')[0],
        isDemo: false
      });
    }
  };

  const signOut = () => {
    setUser(null);
    // Não limpar dados demo automaticamente - usuário pode querer voltar ao demo
  };

  const isDemoMode = user?.isDemo === true;

  const value = {
    user,
    isAuthenticated: !!user,
    isDemoMode,
    signIn,
    signOut
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider');
  }
  return context;
}