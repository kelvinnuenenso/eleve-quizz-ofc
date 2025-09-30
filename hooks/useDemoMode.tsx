import React, { createContext, useContext, ReactNode, useState } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  startDemoMode: () => void;
  stopDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const startDemoMode = () => {
    setIsDemoMode(true);
    console.log('Demo mode started');
  };

  const stopDemoMode = () => {
    setIsDemoMode(false);
    console.log('Demo mode stopped');
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, startDemoMode, stopDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};