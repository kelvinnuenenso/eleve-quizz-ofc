import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader = () => {
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  
  useEffect(() => {
    // Se demorar mais de 5 segundos, mostrar aviso
    const timer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
        {showSlowWarning && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md text-center">
            <p className="text-sm text-yellow-800">
              Carregamento está demorando mais que o esperado.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-yellow-600 underline hover:text-yellow-700"
            >
              Clique aqui para recarregar a página
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
