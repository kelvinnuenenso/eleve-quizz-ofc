import React, { ReactNode } from 'react';

interface TooltipProviderProps {
  children: ReactNode;
}

export const TooltipProvider = ({ children }: TooltipProviderProps) => {
  return <div>{children}</div>;
};

interface TooltipProps {
  children: ReactNode;
}

export const Tooltip = ({ children }: TooltipProps) => {
  return <div>{children}</div>;
};

interface TooltipTriggerProps {
  children: ReactNode;
}

export const TooltipTrigger = ({ children }: TooltipTriggerProps) => {
  return <div>{children}</div>;
};

interface TooltipContentProps {
  children: ReactNode;
}

export const TooltipContent = ({ children }: TooltipContentProps) => {
  return (
    <div className="bg-black text-white px-2 py-1 rounded text-sm">
      {children}
    </div>
  );
};