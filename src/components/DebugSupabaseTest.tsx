import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DebugSupabaseTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  const testSupabaseConnection = async () => {
    setStatus('testing');
    setMessage('Testing Supabase connection...');
    
    try {
      // Log environment variables
      console.log('Supabase config check:', {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]'
      });
      
      setDebugInfo({
        envUrl: import.meta.env.VITE_SUPABASE_URL,
        envAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]',
        userId: user?.id || 'Not authenticated'
      });

      // Test a simple query
      const { data, error } = await supabase
        .from('quizzes')
        .select('count()')
        .limit(1);

      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }

      setMessage(`Connection successful! Found ${data[0]?.count || 0} quizzes.`);
      setStatus('success');
    } catch (error: any) {
      console.error('Supabase test error:', error);
      setMessage(`Connection failed: ${error.message}`);
      setStatus('error');
    }
  };

  useEffect(() => {
    // Auto-run test when component mounts
    testSupabaseConnection();
  }, []);

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="font-bold mb-2">Supabase Debug Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {status === 'testing' && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === 'success' && (
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          )}
          {status === 'error' && (
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          )}
          <span className="text-sm">{message}</span>
        </div>
        
        {Object.keys(debugInfo).length > 0 && (
          <div className="text-xs bg-muted p-2 rounded">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        
        <button 
          onClick={testSupabaseConnection}
          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
          disabled={status === 'testing'}
        >
          Test Again
        </button>
      </div>
    </div>
  );
}