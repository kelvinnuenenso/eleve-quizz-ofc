import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/hooks/useDemoMode";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/simple-tooltip";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";

import { supabaseSync } from "@/lib/supabaseSync";
import { initializeDemoData } from "@/lib/initializeDemoData";
import "../styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 App useEffect triggered - initializing demo data...');
      
      // Initialize demo data first and wait for completion
      try {
        await initializeDemoData();
        console.log('✅ initializeDemoData completed successfully');
      } catch (error) {
        console.error('❌ Error in initializeDemoData:', error);
      }
      
      // Initialize Supabase auto-sync after demo data is ready
      try {
        supabaseSync.startAutoSync();
        console.log('✅ Supabase auto-sync started');
      } catch (error) {
        console.error('❌ Error starting Supabase auto-sync:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <EnhancedErrorBoundary 
      componentName="App"
      maxRetries={2}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <DemoModeProvider>
                <Component {...pageProps} />
                <Toaster />
              </DemoModeProvider>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
}

export default MyApp;