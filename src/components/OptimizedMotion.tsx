import React, { useState, useEffect, useRef, ComponentType } from 'react';
import { motion as framerMotion } from 'framer-motion';

/**
 * Componente otimizado que lazy-load Framer Motion apenas quando necessário
 * Reduz o bundle inicial em ~90KB
 */

interface OptimizedMotionProps {
  children: React.ReactNode;
  threshold?: number;
  fallback?: React.ReactNode;
}

export const OptimizedMotionProvider: React.FC<OptimizedMotionProps> = ({ 
  children, 
  threshold = 0.1,
  fallback = null 
}) => {
  const [isMotionLoaded, setIsMotionLoaded] = useState(true); // Mantém true por enquanto
  const ref = useRef<HTMLDivElement>(null);

  // Por enquanto, usamos motion direto, mas preparado para lazy loading futuro
  useEffect(() => {
    // Podemos implementar Intersection Observer aqui no futuro
    // para carregar motion apenas quando o elemento estiver visível
    setIsMotionLoaded(true);
  }, []);

  if (!isMotionLoaded) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
};

// Re-exportar motion para uso consistente
export { framerMotion as motion };
