import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { saveQuizToSupabase, publishQuizToSupabase, loadQuizFromSupabase } from '@/lib/quizOperations';
import { Quiz } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function QuizTestPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [testQuizId, setTestQuizId] = useState('');

  const runSaveTest = async () => {
    if (!user) {
      setStatus('error');
      setMessage('User not authenticated');
      return;
    }

    setStatus('testing');
    setMessage('Creating and saving test quiz...');

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

      // Save the quiz
      setMessage('Saving quiz to Supabase...');
      const saveResult = await saveQuizToSupabase(testQuiz, user.id);
      
      if (!saveResult) {
        throw new Error('Failed to save quiz');
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

  const runPublishTest = async () => {
    if (!user || !testQuizId) {
      setStatus('error');
      setMessage('No test quiz available');
      return;
    }

    setStatus('testing');
    setMessage('Loading and publishing test quiz...');

    try {
      // Load the quiz
      setMessage('Loading quiz from Supabase...');
      const loadedQuiz = await loadQuizFromSupabase(testQuizId, user.id);
      
      if (!loadedQuiz) {
        throw new Error('Failed to load quiz');
      }

      // Publish the quiz
      setMessage('Publishing quiz...');
      const publishResult = await publishQuizToSupabase(loadedQuiz, user.id);
      
      if (!publishResult.success) {
        throw new Error(publishResult.error || 'Failed to publish quiz');
      }

      setStatus('success');
      setMessage(`Quiz published successfully with public ID: ${publishResult.publicId}`);
    } catch (error: any) {
      console.error('Test failed:', error);
      setStatus('error');
      setMessage(`Test failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quiz Operations Test</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Quiz Operations</h2>
          
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
            
            <div className="flex gap-2">
              <Button 
                onClick={runSaveTest}
                disabled={status === 'testing' || !user}
              >
                Test Save
              </Button>
              
              <Button 
                onClick={runPublishTest}
                disabled={status === 'testing' || !user || !testQuizId}
              >
                Test Publish
              </Button>
            </div>
            
            {testQuizId && (
              <div className="text-sm text-muted-foreground">
                Test Quiz ID: {testQuizId}
              </div>
            )}
          </div>
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