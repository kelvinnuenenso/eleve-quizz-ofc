import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function ColumnTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testRedirectSettingsColumn = async () => {
    setStatus('testing');
    setMessage('Testing redirect_settings column...');
    
    try {
      // Test if we can access the redirect_settings column specifically
      // We'll do a simple select to see if the column exists
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, redirect_settings')
        .limit(1);
      
      if (error) {
        throw new Error(`Redirect settings column error: ${error.message}`);
      }
      
      setMessage(`Column test successful. Found ${data?.length || 0} records with redirect_settings column`);
      setStatus('success');
    } catch (error: any) {
      console.error('Redirect settings column test failed:', error);
      setMessage(`Column test failed: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="font-bold mb-2">Column Test</h3>
      
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
        
        <button 
          onClick={testRedirectSettingsColumn}
          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
          disabled={status === 'testing'}
        >
          Test Redirect Column
        </button>
      </div>
    </div>
  );
}