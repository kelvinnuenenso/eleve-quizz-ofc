import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { quizService } from '@/lib/quizService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function QuizSaveTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [testQuizId, setTestQuizId] = useState('');

  const runTest = async () => {
    if (!user) {
      setStatus('error');
      setMessage('User not authenticated');
      return;
    }

    setStatus('testing');
    setMessage('Creating and saving test quiz...');

    try {
      // Create a test quiz
      const testQuiz = quizService.createNewQuiz('Test Quiz');
      
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
                text: 'This is a test question',
                style: 'subtitle'
              }
            }
          ]
        }
      ];

      // Save the quiz
      setMessage('Saving quiz to Supabase...');
      const { success, error } = await quizService.saveQuiz(testQuiz, user.id);
      
      if (!success) {
        throw new Error(error || 'Failed to save quiz');
      }

      setTestQuizId(testQuiz.id);
      setStatus('success');
      setMessage(`Quiz saved successfully with ID: ${testQuiz.id}`);
    } catch (error: any) {
      console.error('Test failed:', error);
      setStatus('error');
      setMessage(`Test failed: ${error.message}`);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-2">Quiz Save Test</h3>
      
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
        
        <Button 
          onClick={runTest}
          disabled={status === 'testing' || !user}
          size="sm"
        >
          Test Save
        </Button>
        
        {testQuizId && (
          <div className="text-xs text-muted-foreground">
            Test Quiz ID: {testQuizId}
          </div>
        )}
      </div>
    </Card>
  );
}