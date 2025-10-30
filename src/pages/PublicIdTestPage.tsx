import { useState, useEffect } from 'react';
import { testPublicIdUniqueness } from '@/lib/supabaseTest';

export default function PublicIdTestPage() {
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');

  const runTest = async () => {
    setTestStatus('running');
    setTestResult('Running test...');
    
    try {
      const result = await testPublicIdUniqueness();
      if (result.success) {
        setTestStatus('success');
        setTestResult('Test completed successfully! Check console for details.');
      } else {
        setTestStatus('error');
        setTestResult(`Test failed: ${result.error}`);
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestResult(`Test error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Public ID Uniqueness Test</h1>
          <p className="text-muted-foreground mb-6">
            Testing the fix for "Duplicate key value violates unique constraint" error
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Test Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                testStatus === 'idle' ? 'bg-gray-200 text-gray-800' :
                testStatus === 'running' ? 'bg-yellow-200 text-yellow-800' :
                testStatus === 'success' ? 'bg-green-200 text-green-800' :
                'bg-red-200 text-red-800'
              }`}>
                {testStatus.charAt(0).toUpperCase() + testStatus.slice(1)}
              </span>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{testResult}</p>
            </div>
            
            <button
              onClick={runTest}
              disabled={testStatus === 'running'}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {testStatus === 'running' ? 'Testing...' : 'Run Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}