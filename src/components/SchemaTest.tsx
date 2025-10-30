import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function SchemaTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testSchema = async () => {
    setStatus('testing');
    setMessage('Testing schema access...');
    
    try {
      // Test accessing the quizzes table
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('count()', { count: 'exact' });
      
      if (quizzesError) {
        throw new Error(`Quizzes table error: ${quizzesError.message}`);
      }
      
      setMessage(`Quizzes table accessible. Count: ${quizzesData ? quizzesData.length : 0}`);
      
      // Test accessing the quiz_steps table using raw SQL
      const { data: stepsData, error: stepsError } = await supabase
        .from('quiz_steps' as any)
        .select('count()', { count: 'exact' });
      
      if (stepsError) {
        throw new Error(`Quiz steps table error: ${stepsError.message}`);
      }
      
      setMessage(prev => `${prev}. Steps table accessible. Count: ${stepsData ? stepsData.length : 0}`);
      
      setStatus('success');
    } catch (error: any) {
      console.error('Schema test failed:', error);
      setMessage(`Test failed: ${error.message}`);
      setStatus('error');
    }
  };

  const testRedirectSettingsColumn = async () => {
    setStatus('testing');
    setMessage('Testing redirect_settings column...');
    
    try {
      // Test if we can access the redirect_settings column specifically
      // We'll do a simple upsert with an empty object to test column access
      const testId = `test-${Date.now()}`;
      
      const { error } = await supabase
        .from('quizzes')
        .upsert({
          id: testId,
          name: 'Column Test',
          redirect_settings: '{}'
        } as any, {
          onConflict: 'id'
        });
      
      // Clean up the test record
      await supabase
        .from('quizzes')
        .delete()
        .eq('id', testId);
      
      if (error) {
        throw new Error(`Redirect settings column error: ${error.message}`);
      }
      
      setMessage('Redirect_settings column is accessible');
      setStatus('success');
    } catch (error: any) {
      console.error('Redirect settings column test failed:', error);
      setMessage(`Column test failed: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="font-bold mb-2">Schema Test</h3>
      
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
        
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={testSchema}
            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
            disabled={status === 'testing'}
          >
            Test Schema
          </button>
          
          <button 
            onClick={testRedirectSettingsColumn}
            className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded"
            disabled={status === 'testing'}
          >
            Test Redirect Column
          </button>
        </div>
      </div>
    </div>
  );
}