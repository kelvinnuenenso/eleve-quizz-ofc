import React, { createContext, useContext, ReactNode } from 'react';

interface TooltipContextType {
  // Contexto simples para tooltips
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface SimpleTooltipProviderProps {
  children: ReactNode;
}

export function SimpleTooltipProvider({ children }: SimpleTooltipProviderProps) {
  const value = {};

  return (
    <TooltipContext.Provider value={value}>
      {children}
    </TooltipContext.Provider>
  );
}

// Componentes simples de tooltip que não dependem de Radix UI
export const Tooltip = ({ children }: { children: ReactNode }) => <>{children}</>;
export const TooltipTrigger = ({ children }: { children: ReactNode }) => <>{children}</>;
export const TooltipContent = ({ children }: { children: ReactNode }) => <>{children}</>;

// Exportar o provider simples como TooltipProvider
export { SimpleTooltipProvider as TooltipProvider };