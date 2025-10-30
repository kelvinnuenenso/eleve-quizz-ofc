import { AnalyticsTest } from '@/components/quiz/AnalyticsTest';

export default function AnalyticsTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analytics & Pixel System Test</h1>
        <p className="text-muted-foreground mb-8">
          This page tests the integration of the analytics and pixel systems with real data.
        </p>
        
        <AnalyticsTest />
      </div>
    </div>
  );
}