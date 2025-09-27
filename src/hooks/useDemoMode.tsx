import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { localDB } from '@/lib/localStorage';
import { initializeDemoData } from '@/lib/initializeDemoData';
import { toast } from 'sonner';

interface DemoModeContextType {
  isDemoMode: boolean;
  enterDemoMode: () => Promise<void>;
  exitDemoMode: () => void;
  demoUser: {
    id: string;
    name: string;
    email: string;
    plan: string;
  } | null;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<{
    id: string;
    name: string;
    email: string;
    plan: string;
  } | null>(null);

  useEffect(() => {
    // Check if demo mode is active on app start
    const demoModeActive = localStorage.getItem('demo_mode_active') === 'true';
    if (demoModeActive) {
      const savedDemoUser = localStorage.getItem('demo_user');
      if (savedDemoUser) {
        setDemoUser(JSON.parse(savedDemoUser));
        setIsDemoMode(true);
      }
    }
  }, []);

  const enterDemoMode = async () => {
    try {
      // Initialize demo data
      await initializeDemoData();
      
      // Create demo user
      const demoDemoUser = {
        id: 'demo-user-123',
        name: 'Usuário Demo',
        email: 'demo@exemplo.com',
        plan: 'starter'
      };
      
      // Save demo user profile
      const demoProfile = {
        id: demoDemoUser.id,
        name: demoDemoUser.name,
        email: demoDemoUser.email,
        createdAt: new Date().toISOString(),
        plan: 'free',
        settings: {
          theme: 'light',
          notifications: true,
          autoSave: true
        }
      };
      
      localDB.saveUserProfile(demoProfile);
      
      // Set demo mode flags
      localStorage.setItem('demo_mode_active', 'true');
      localStorage.setItem('demo_user', JSON.stringify(demoDemoUser));
      
      setDemoUser(demoDemoUser);
      setIsDemoMode(true);
      
      toast.success('Modo DEMO ativado! Explore as funcionalidades com dados de exemplo.');
    } catch (error) {
      console.error('Error entering demo mode:', error);
      toast.error('Erro ao ativar modo DEMO');
    }
  };

  const exitDemoMode = () => {
    // Clear demo mode flags
    localStorage.removeItem('demo_mode_active');
    localStorage.removeItem('demo_user');
    
    // Clear demo data
    localDB.clearUserProfile();
    
    setDemoUser(null);
    setIsDemoMode(false);
    
    toast.info('Modo DEMO desativado');
  };

  return (
    <DemoModeContext.Provider value={{
      isDemoMode,
      enterDemoMode,
      exitDemoMode,
      demoUser,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}