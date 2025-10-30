import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface WebhookManagerProps {
  quizId: string;
}

export const WebhookManager = ({ quizId }: WebhookManagerProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Webhooks e Integrações</h3>
        <p className="text-muted-foreground">
          Conecte seu quiz com outras ferramentas e serviços
        </p>
      </div>

      {/* Coming Soon Message */}
      <Card className="p-12 text-center">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
        <p className="text-muted-foreground mb-4">
          Esta funcionalidade está em desenvolvimento e estará disponível em breve.
        </p>
        <Button variant="outline" disabled>
          Em Breve
        </Button>
      </Card>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receba notificações em tempo real sobre eventos do seu quiz.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conecte com CRM, email marketing e outras ferramentas populares.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Automações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatize fluxos de trabalho com base nas respostas do quiz.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
