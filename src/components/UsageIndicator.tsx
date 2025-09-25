import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Database, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UsageTracker, UsageStats, UsageWarning } from '@/lib/usageTracker';
import { errorHandler } from '@/lib/errorHandling';

interface UsageIndicatorProps {
  type?: 'compact' | 'dashboard' | 'detailed';
  showWarnings?: boolean;
}

export function UsageIndicator({ type = 'compact', showWarnings = true }: UsageIndicatorProps) {
  const { currentUser } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [warnings, setWarnings] = useState<UsageWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;

    const loadUsageData = async () => {
      try {
        setLoading(true);
        const [usageData, warningsData] = await Promise.all([
          UsageTracker.getUserUsage(currentUser.id),
          UsageTracker.getUsageWarnings(currentUser.id)
        ]);
        
        setUsage(usageData);
        setWarnings(warningsData);
      } catch (error) {
        errorHandler.handleError(error, {
          context: 'UsageIndicator.loadUsageData',
          userId: currentUser.id
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsageData();
  }, [currentUser?.id]);

  if (loading || !usage) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <span className="text-xs text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const recommendation = UsageTracker.getPlanRecommendation(usage);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (type === 'compact') {
    const highestUsage = Math.max(
      usage.quizzes.percentage,
      usage.storage.percentage,
      usage.responses.percentage
    );

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            highestUsage >= 90 ? 'bg-red-500' : 
            highestUsage >= 75 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`} />
          <span className="text-xs text-muted-foreground">
            {Math.round(highestUsage)}% usado
          </span>
        </div>
        
        {warnings.length > 0 && showWarnings && (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (type === 'dashboard') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quizzes Usage */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Quizzes</span>
            </div>
            <Badge variant="outline">
              {usage.quizzes.current}/{usage.quizzes.limit === -1 ? '∞' : usage.quizzes.limit}
            </Badge>
          </div>
          {usage.quizzes.limit !== -1 && (
            <>
              <Progress 
                value={usage.quizzes.percentage} 
                className="h-2 mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(usage.quizzes.percentage)}% do limite utilizado
              </p>
            </>
          )}
        </Card>

        {/* Storage Usage */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-green-500" />
              <span className="font-medium">Armazenamento</span>
            </div>
            <Badge variant="outline">
              {formatBytes(usage.storage.current)}
            </Badge>
          </div>
          {usage.storage.limit !== -1 && (
            <>
              <Progress 
                value={usage.storage.percentage} 
                className="h-2 mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(usage.storage.percentage)}% de {formatBytes(usage.storage.limit)}
              </p>
            </>
          )}
        </Card>

        {/* Responses Usage */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Respostas</span>
            </div>
            <Badge variant="outline">
              {formatNumber(usage.responses.current)}/mês
            </Badge>
          </div>
          {usage.responses.limit !== -1 && (
            <>
              <Progress 
                value={usage.responses.percentage} 
                className="h-2 mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(usage.responses.percentage)}% de {formatNumber(usage.responses.limit)}
              </p>
            </>
          )}
        </Card>
      </div>
    );
  }

  // Detailed view
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Uso do Plano</h3>
          {recommendation && (
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              {recommendation}
            </Badge>
          )}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && showWarnings && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <Alert key={index} variant={warning.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Usage Details */}
        <div className="space-y-4">
          {/* Quizzes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Quizzes</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(usage.quizzes.percentage)}`}>
                {usage.quizzes.current}/{usage.quizzes.limit === -1 ? '∞' : usage.quizzes.limit}
              </span>
            </div>
            {usage.quizzes.limit !== -1 && (
              <Progress value={usage.quizzes.percentage} className="h-2" />
            )}
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-500" />
                <span className="font-medium">Armazenamento</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(usage.storage.percentage)}`}>
                {formatBytes(usage.storage.current)}
                {usage.storage.limit !== -1 && ` / ${formatBytes(usage.storage.limit)}`}
              </span>
            </div>
            {usage.storage.limit !== -1 && (
              <Progress value={usage.storage.percentage} className="h-2" />
            )}
          </div>

          {/* Responses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Respostas (este mês)</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(usage.responses.percentage)}`}>
                {formatNumber(usage.responses.current)}
                {usage.responses.limit !== -1 && ` / ${formatNumber(usage.responses.limit)}`}
              </span>
            </div>
            {usage.responses.limit !== -1 && (
              <Progress value={usage.responses.percentage} className="h-2" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}