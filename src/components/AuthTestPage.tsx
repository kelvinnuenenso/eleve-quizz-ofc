import { useState } from 'react';
import { runAuthTests } from '@/lib/authTest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(['Starting authentication tests...']);
    
    try {
      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        const message = args.join(' ');
        setTestResults(prev => [...prev, message]);
        originalLog(...args);
      };
      
      console.error = (...args) => {
        const message = args.join(' ');
        setTestResults(prev => [...prev, `ERROR: ${message}`]);
        originalError(...args);
      };
      
      // Run the tests
      await runAuthTests();
      
      // Restore console functions
      console.log = originalLog;
      console.error = originalError;
    } catch (error) {
      setTestResults(prev => [...prev, `Test execution error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={isRunning}>
              {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="bg-muted p-4 rounded min-h-[200px] max-h-[500px] overflow-auto">
              {testResults.length > 0 ? (
                <pre className="text-sm whitespace-pre-wrap">
                  {testResults.join('\n')}
                </pre>
              ) : (
                <p className="text-muted-foreground">Click "Run Authentication Tests" to start</p>
              )}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Note:</strong> This test will check:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Environment variables configuration</li>
              <li>Supabase connection</li>
              <li>User profiles table access</li>
              <li>Authentication functions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}