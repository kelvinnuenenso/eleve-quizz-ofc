import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizTestComponent } from '@/components/QuizTestComponent';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    setMessage('Testing connection...');
    
    try {
      // Test a simple query to check connection
      const { data, error } = await supabase
        .from('quizzes')
        .select('count()')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        setConnectionStatus('error');
        setMessage(`Connection failed: ${error.message}`);
        return;
      }
      
      console.log('Supabase connection successful:', data);
      setConnectionStatus('success');
      setMessage(`Connection successful! Found ${data[0]?.count || 0} quizzes.`);
    } catch (error: any) {
      console.error('Supabase connection failed:', error);
      setConnectionStatus('error');
      setMessage(`Connection failed: ${error.message}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground mb-6">
            Testing connection to your Supabase database
          </p>
          
          <div className="bg-card rounded-lg p-6 shadow-lg mb-8">
            <div className="flex flex-col items-center space-y-4">
              {connectionStatus === 'testing' && (
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
              
              {connectionStatus === 'success' && (
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              
              <p className={`text-lg font-medium ${
                connectionStatus === 'success' ? 'text-green-600' : 
                connectionStatus === 'error' ? 'text-red-600' : 'text-foreground'
              }`}>
                {message}
              </p>
              
              <button
                onClick={testConnection}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Test Again
              </button>
            </div>
          </div>
        </div>
        
        {/* Add the quiz test component */}
        <QuizTestComponent />
      </div>
    </div>
  );
}