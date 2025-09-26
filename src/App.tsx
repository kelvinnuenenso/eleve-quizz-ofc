import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/simple-tooltip";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";

import { supabaseSync } from "@/lib/supabaseSync";
import { webhookSystem } from "@/lib/webhookSystem";
import { realAnalytics } from "@/lib/analytics";
import { realPixelSystem } from "@/lib/pixelSystem";

// Initialize Supabase auto-sync
supabaseSync.startAutoSync();
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

const App = () => (
  <EnhancedErrorBoundary 
    componentName="App"
    maxRetries={2}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <EnhancedErrorBoundary componentName="Router">
              <AppContent />
              <Sonner />
            </EnhancedErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </EnhancedErrorBoundary>
);

export default App;