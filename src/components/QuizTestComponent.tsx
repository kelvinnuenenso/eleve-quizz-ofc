import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { saveQuizToSupabase, publishQuizToSupabase } from '@/lib/quizOperations';
import { Quiz } from '@/types/quiz';

export function QuizTestComponent() {
  const { user } = useAuth();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const runTest = async () => {
    if (!user) {
      setTestStatus('error');
      setMessage('User not authenticated');
      return;
    }

    setTestStatus('testing');
    setMessage('Testing quiz operations...');

    try {
      // Create a test quiz
      const testQuiz: Quiz = {
        id: crypto.randomUUID(),
        publicId: `test-quiz-${Date.now()}`,
        name: 'Test Quiz',
        description: 'A test quiz for verification',
        status: 'draft',
        questions: [],
        outcomes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [
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
                  text: 'This is a test question',
                  style: 'subtitle'
                }
              }
            ]
          }
        ]
      };

      // Test saving
      setMessage('Saving quiz...');
      const saveResult = await saveQuizToSupabase(testQuiz, user.id);
      
      if (!saveResult) {
        throw new Error('Failed to save quiz');
      }

      setMessage('Publishing quiz...');
      const publishResult = await publishQuizToSupabase(testQuiz, user.id);
      
      if (!publishResult.success) {
        throw new Error(publishResult.error || 'Failed to publish quiz');
      }

      setTestStatus('success');
      setMessage(`Quiz published successfully with public ID: ${publishResult.publicId}`);
    } catch (error: any) {
      console.error('Test failed:', error);
      setTestStatus('error');
      setMessage(`Test failed: ${error.message}`);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Quiz Operations Test</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This test will create a sample quiz, save it to Supabase, and then publish it.
        </p>
        
        <div className="flex items-center justify-center my-4">
          {testStatus === 'testing' && (
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          )}
          
          {testStatus === 'success' && (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {testStatus === 'error' && (
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <p className={`text-center ${
          testStatus === 'success' ? 'text-green-600' : 
          testStatus === 'error' ? 'text-red-600' : 'text-foreground'
        }`}>
          {message}
        </p>
        
        <Button 
          onClick={runTest} 
          disabled={testStatus === 'testing' || !user}
          className="w-full"
        >
          {testStatus === 'testing' ? 'Testing...' : 'Run Test'}
        </Button>
      </div>
    </Card>
  );
}