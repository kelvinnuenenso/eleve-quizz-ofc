import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/hooks/useDemoMode";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/simple-tooltip";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";

import { supabaseSync } from "@/lib/supabaseSync";
import { webhookSystem } from "@/lib/webhookSystem";
import { realAnalytics } from "@/lib/analytics";
import { realPixelSystem } from "@/lib/pixelSystem";
import { initializeDemoData } from "@/lib/initializeDemoData";
import Index from "./pages/Index";
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from "./pages/Dashboard";
import QuizEditor from "./pages/QuizEditor";
import QuizRunner from "./pages/QuizRunner";
import ResultPage from "./pages/ResultPage";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/callback";
import Settings from "./pages/Settings";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";

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

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/quiz/editor/:id?" element={
          <ProtectedRoute>
            <QuizEditor />
          </ProtectedRoute>
        } />
        <Route path="/quiz/runner/:id" element={<QuizRunner />} />
        <Route path="/quiz/:publicId" element={<QuizRunner />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/templates" element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
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
            <BrowserRouter>
              <DemoModeProvider>
                <AppContent />
                <Toaster />
              </DemoModeProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
};

export default App;