import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { quizService } from '@/lib/quizService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SchemaTest } from '@/components/SchemaTest';
import { ColumnTest } from '@/components/ColumnTest';

export default function SchemaTestPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [testQuizId, setTestQuizId] = useState('');

  const runFullTest = async () => {
    if (!user) {
      setStatus('error');
      setMessage('User not authenticated');
      return;
    }

    setStatus('testing');
    setMessage('Running full schema test...');

    try {
      // Test 1: Create a test quiz
      setMessage('Creating test quiz...');
      const testQuiz = quizService.createNewQuiz('Schema Test Quiz');
      
      // Add redirect settings to test the specific issue
      testQuiz.redirectSettings = {
        enabled: true,
        url: 'https://example.com',
        overrideResults: false,
        redirect_type: 'url',
        whatsapp: {
          phone: '+1234567890',
          message: 'Test message'
        }
      };
      
      // Add a simple step
      testQuiz.steps = [
        {
          id: crypto.randomUUID(),
          type: 'question',
          name: 'Test Step',
          title: 'Test Question',
          components: [
            {
              id: crypto.randomUUID(),
              type: 'text',
              content: {
                text: 'This is a test question for schema testing',
                style: 'subtitle'
              }
            }
          ]
        }
      ];

      // Test 2: Save the quiz
      setMessage('Saving quiz to Supabase...');
      const { success, error } = await quizService.saveQuiz(testQuiz, user.id);
      
      if (!success) {
        throw new Error(`Failed to save quiz: ${error}`);
      }

      setTestQuizId(testQuiz.id);
      setMessage('Quiz saved successfully. Now loading it back...');

      // Test 3: Load the quiz
      const { quiz: loadedQuiz, error: loadError } = await quizService.loadQuiz(testQuiz.id, user.id);
      
      if (!loadedQuiz) {
        throw new Error(`Failed to load quiz: ${loadError}`);
      }

      setMessage('Quiz loaded successfully. Verifying data integrity...');

      // Test 4: Verify data
      if (loadedQuiz.name !== 'Schema Test Quiz') {
        throw new Error('Quiz name mismatch');
      }
      
      if (!loadedQuiz.steps || loadedQuiz.steps.length !== 1) {
        throw new Error('Quiz steps mismatch');
      }
      
      if (loadedQuiz.steps[0].components.length !== 1) {
        throw new Error('Quiz components mismatch');
      }
      
      // Verify redirect settings were saved correctly
      if (!loadedQuiz.redirectSettings || !loadedQuiz.redirectSettings.enabled) {
        throw new Error('Redirect settings not saved correctly');
      }

      setMessage('Data integrity verified. Testing publish...');

      // Test 5: Publish the quiz
      const { success: publishSuccess, publicId, error: publishError } = await quizService.publishQuiz(loadedQuiz, user.id);
      
      if (!publishSuccess) {
        throw new Error(`Failed to publish quiz: ${publishError}`);
      }

      setStatus('success');
      setMessage(`All tests passed! Quiz published with public ID: ${publicId}`);
    } catch (error: any) {
      console.error('Test failed:', error);
      setStatus('error');
      setMessage(`Test failed: ${error.message}`);
    }
  };

  const testRedirectSettings = async () => {
    if (!user) {
      setStatus('error');
      setMessage('User not authenticated');
      return;
    }

    setStatus('testing');
    setMessage('Testing redirect settings specifically...');

    try {
      // Create a test quiz with redirect settings
      const testQuiz = quizService.createNewQuiz('Redirect Settings Test');
      testQuiz.redirectSettings = {
        enabled: true,
        url: 'https://test-redirect.com',
        overrideResults: true,
        redirect_type: 'url',
        whatsapp: {}
      };

      // Try to save the quiz
      const { success, error } = await quizService.saveQuiz(testQuiz, user.id);
      
      if (!success) {
        throw new Error(`Failed to save quiz with redirect settings: ${error}`);
      }

      // Try to load it back
      const { quiz: loadedQuiz, error: loadError } = await quizService.loadQuiz(testQuiz.id, user.id);
      
      if (!loadedQuiz) {
        throw new Error(`Failed to load quiz with redirect settings: ${loadError}`);
      }

      // Verify redirect settings
      if (!loadedQuiz.redirectSettings || !loadedQuiz.redirectSettings.enabled) {
        throw new Error('Redirect settings were not saved/loaded correctly');
      }

      setStatus('success');
      setMessage('Redirect settings test passed!');
    } catch (error: any) {
      console.error('Redirect settings test failed:', error);
      setStatus('error');
      setMessage(`Redirect settings test failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Schema Test Page</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Full Schema Test</h2>
          
          <div className="space-y-4">
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
              <span>{message}</span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={runFullTest}
                disabled={status === 'testing' || !user}
              >
                Run Full Test
              </Button>
              
              <Button 
                onClick={testRedirectSettings}
                variant="secondary"
                disabled={status === 'testing' || !user}
              >
                Test Redirect Settings
              </Button>
            </div>
            
            {testQuizId && (
              <div className="text-sm text-muted-foreground">
                Test Quiz ID: {testQuizId}
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Schema Access Test</h2>
          <SchemaTest />
        </Card>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Column Test</h2>
          <ColumnTest />
        </Card>
        
        {!user && (
          <Card className="p-6 bg-yellow-100 border-yellow-300">
            <div className="text-yellow-800">
              <h3 className="font-semibold mb-2">Authentication Required</h3>
              <p>Please sign in to run the tests.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}