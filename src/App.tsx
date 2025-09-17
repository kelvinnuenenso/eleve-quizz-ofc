import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { useEffect } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { PWAPrompt } from "@/components/PWAPrompt";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { supabaseSync } from "@/lib/supabaseSync";
import { webhookSystem } from "@/lib/webhookSystem";
import { realAnalytics } from "@/lib/analytics";
import { realPixelSystem } from "@/lib/pixelSystem";
import Index from "./pages/Index";
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from "./pages/Dashboard";
import QuizEditor from "./pages/QuizEditor";
import QuizRunner from "./pages/QuizRunner";
import ResultPage from "./pages/ResultPage";
import Auth from "./pages/Auth";
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
  useErrorRecovery();

  // Auto-initialize all analytics systems on app start
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // Start auto-sync with Supabase
        supabaseSync.startAutoSync();
        
        // Initialize webhook system
        webhookSystem.initialize();
        
        // Initialize pixel system with UTM tracking
        const utmParams = realPixelSystem.extractUTMParameters();
        if (Object.keys(utmParams).length > 0) {
          realPixelSystem.persistUTMParameters(utmParams);
        }
        
        console.log('🚀 Analytics systems fully activated');
      } catch (error) {
        console.error('Error initializing analytics systems:', error);
      }
    };
    
    initializeSystems();
  }, []);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/edit/:quizId" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
        <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/app/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/q/:publicId" element={<QuizRunner />} />
        <Route path="/r/:resultId" element={<EnhancedErrorBoundary><ResultPage /></EnhancedErrorBoundary>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <PWAPrompt />
      <PerformanceMonitor />
    </>
  );
};

const App = () => (
  <EnhancedErrorBoundary 
    componentName="App"
    maxRetries={2}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <EnhancedErrorBoundary componentName="Router">
              <AppContent />
            </EnhancedErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </EnhancedErrorBoundary>
);

export default App;