import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/components/SimpleAuthProvider';
import { UsageTracker } from '@/lib/usageTracker';
import { PlanUpgradeModal } from './PlanUpgradeModal';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true,
  className = '' 
}: FeatureGateProps) {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      setHasAccess(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const access = await UsageTracker.hasFeature(currentUser.id, feature);
        setHasAccess(access);
      } catch (error) {
        console.error('Erro ao verificar acesso à funcionalidade:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [currentUser?.id, feature]);

  if (hasAccess === null) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full" />
          <span className="text-sm text-muted-foreground">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback with upgrade prompt
  return (
    <Card className={`p-6 text-center ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Funcionalidade Premium</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Esta funcionalidade está disponível apenas para usuários com planos premium.
          </p>
        </div>

        <Badge variant="outline" className="text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Requer upgrade
        </Badge>

        {showUpgrade && (
          <Button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90"
          >
            <Zap className="w-4 h-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
      </div>

      {showUpgradeModal && (
        <PlanUpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </Card>
  );
}