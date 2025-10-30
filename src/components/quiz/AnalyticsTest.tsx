import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { realAnalytics } from '@/lib/analytics';
import { realPixelSystem } from '@/lib/pixelSystem';

export function AnalyticsTest() {
  const { toast } = useToast();

  // Initialize test systems
  useEffect(() => {
    // Initialize analytics with a test user ID
    realAnalytics.setUserId('test-user-id');
    
    // Initialize pixel system with test settings
    realPixelSystem.initialize({
      facebook: {
        enabled: true,
        pixelId: '1234567890',
        standardEvents: {
          enabled: true,
          events: ['ViewContent', 'StartQuiz', 'CompleteRegistration', 'Lead']
        }
      }
    });
  }, []);

  const testAnalytics = async () => {
    try {
      // Test analytics session initialization
      const sessionId = realAnalytics.initializeSession({
        id: 'test-quiz-id',
        name: 'Test Quiz',
        questions: [{ id: 'q1', type: 'single', title: 'Test Question' }]
      } as any, {
        utm_source: 'test',
        utm_medium: 'test'
      });
      
      console.log('Analytics session initialized:', sessionId);
      
      // Test tracking events
      await realAnalytics.trackQuestionView(0, { id: 'q1', type: 'single', title: 'Test Question' });
      await realAnalytics.trackQuestionAnswer(0, { id: 'q1', type: 'single', title: 'Test Question' }, 'test-answer', 1000);
      await realAnalytics.trackCompletion({
        id: 'test-result-id',
        quizId: 'test-quiz-id',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score: 100,
        outcomeKey: 'test-outcome',
        answers: [{ questionId: 'q1', value: 'test-answer' }]
      } as any);
      
      toast({
        title: 'Analytics Test',
        description: 'Analytics events tracked successfully! Check console for details.'
      });
    } catch (error) {
      console.error('Analytics test error:', error);
      toast({
        title: 'Analytics Test Error',
        description: 'Failed to track analytics events.',
        variant: 'destructive'
      });
    }
  };

  const testPixels = () => {
    try {
      // Test pixel tracking
      realPixelSystem.trackQuizView({
        id: 'test-quiz-id',
        name: 'Test Quiz'
      } as any);
      
      realPixelSystem.trackQuizStart({
        id: 'test-quiz-id',
        name: 'Test Quiz'
      } as any);
      
      realPixelSystem.trackQuizCompletion({
        id: 'test-quiz-id',
        name: 'Test Quiz'
      } as any, {
        id: 'test-result-id'
      });
      
      toast({
        title: 'Pixel Test',
        description: 'Pixel events tracked successfully! Check console for details.'
      });
    } catch (error) {
      console.error('Pixel test error:', error);
      toast({
        title: 'Pixel Test Error',
        description: 'Failed to track pixel events.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics & Pixel System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          This component tests the analytics and pixel systems to ensure they're working correctly.
        </p>
        
        <div className="flex gap-3">
          <Button onClick={testAnalytics}>
            Test Analytics
          </Button>
          <Button onClick={testPixels}>
            Test Pixels
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <p><strong>Instructions:</strong></p>
          <p>1. Open browser console to see detailed logs</p>
          <p>2. Click "Test Analytics" to verify analytics events</p>
          <p>3. Click "Test Pixels" to verify pixel events</p>
          <p>4. Check that data is being saved to Supabase</p>
        </div>
      </CardContent>
    </Card>
  );
}