import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEST_MODE } from '@/lib/flags';
import { seedDemo } from '@/lib/seed';
import { DemoModeIndicator } from '@/components/DemoModeIndicator';
import { DemoUserManager } from '@/lib/demoUser';
import { Zap, Target, BarChart3, Smartphone, MessageCircle, CheckCircle, Star, Users, TrendingUp, Play } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(DemoUserManager.getCurrentUser());

  useEffect(() => {
    if (TEST_MODE) {
      seedDemo();
    }
  }, []);

  const handleStartFree = () => {
    if (TEST_MODE) {
      // In demo mode, go directly to dashboard if user exists, otherwise to auth
      if (currentUser) {
        navigate('/app');
      } else {
        navigate('/auth');
      }
    } else {
      navigate('/auth');
    }
  };
  const handleViewDemo = () => {
    navigate('/q/demo');
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Quiz Platform</span>
          </div>
          
          <div className="flex items-center gap-3">
            {TEST_MODE && <DemoModeIndicator showDetails onUserChange={setCurrentUser} />}
            
            {currentUser && TEST_MODE && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app')}
              >
                Ir para Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
            🚀 Novo: Editor Visual Inteligente
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Crie quizzes que{' '}
            <span className="text-primary">convertem</span>{' '}
            em minutos
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Quiz Platform é o construtor de quizzes e formulários multi-etapas para 
            <strong> funis de vendas</strong>, <strong>coleta de leads</strong> e 
            <strong> diagnósticos profissionais</strong>.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>+10k usuários</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span>4.9/5 avaliação</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>87% mais conversões</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg rounded-2xl shadow-lg" onClick={handleStartFree}>
              Começar grátis →
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary/5 px-8 py-4 text-lg rounded-2xl" onClick={handleViewDemo}>
              <Play className="w-5 h-5 mr-2" />
              Ver demonstração
            </Button>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sem necessidade de código</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Integração WhatsApp nativa</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Analytics em tempo real</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Recursos que fazem a diferença</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para criar quizzes profissionais que realmente convertem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-shadow bg-card border-0 shadow-sm">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Editor Visual</h3>
              <p className="text-muted-foreground">
                Construa quizzes profissionais com nosso editor drag-and-drop intuitivo
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card border-0 shadow-sm">
              <Target className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lógica Inteligente</h3>
              <p className="text-muted-foreground">
                Crie fluxos condicionais que se adaptam às respostas dos usuários
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card border-0 shadow-sm">
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics Avançado</h3>
              <p className="text-muted-foreground">
                Monitore performance, conversões e engajamento em tempo real
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card border-0 shadow-sm">
              <Smartphone className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Totalmente Responsivo</h3>
              <p className="text-muted-foreground">
                Seus quizzes ficam perfeitos em qualquer dispositivo
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card border-0 shadow-sm">
              <MessageCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">WhatsApp Integrado</h3>
              <p className="text-muted-foreground">
                Redirecione leads automaticamente para conversas no WhatsApp
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card border-0 shadow-sm">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Captura de Leads</h3>
              <p className="text-muted-foreground">
                Colete dados de contato de forma natural e não invasiva
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar suas conversões?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já descobriram o poder dos quizzes interativos
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg rounded-2xl shadow-lg" onClick={handleStartFree}>
            Começar agora - É grátis →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">EQ</span>
              </div>
              <span className="font-semibold text-primary">Quiz Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Quiz Platform. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;