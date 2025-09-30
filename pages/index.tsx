import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Star, Users, TrendingUp, Zap, Target, BarChart3, Smartphone, Globe, Shield, Clock, Edit3, GitBranch, UserCheck, Play, MousePointer, Layers, Palette, Eye, Webhook, Trophy, Sparkles, ArrowLeft, MessageCircle, Copy } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/router';
import { initializeDemoData } from '@/lib/initializeDemoData';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';

const Index = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNavbarBlurred, setIsNavbarBlurred] = useState(false);
  const { startDemoMode } = useDemoMode();

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
      setIsNavbarBlurred(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartDemo = async () => {
    try {
      await initializeDemoData();
      await startDemoMode();
      router.push('/quiz/demo');
      toast.success('Demo iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar demo:', error);
      toast.error('Erro ao iniciar demo');
    }
  };

  const handleStartFree = () => {
    router.push('/auth');
  };

  const handleViewDemo = () => {
    router.push('/quiz/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/60 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isNavbarBlurred 
          ? 'bg-background/80 backdrop-blur-md border-b border-border/50' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              QuizLift
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={handleStartFree}
              className="hidden sm:inline-flex"
            >
              Entrar
            </Button>
            <Button 
              onClick={handleStartDemo}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Play className="w-4 h-4 mr-2" />
              Demo Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Plataforma Completa de Quizzes
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
              Crie Quizzes
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                Extraordinários
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transforme conhecimento em experiências interativas com nossa plataforma intuitiva de criação de quizzes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={handleStartDemo}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Experimentar Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleStartFree}
                className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
              >
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para criar, gerenciar e analisar quizzes profissionais.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Edit3,
                title: "Editor Visual",
                description: "Interface intuitiva de arrastar e soltar para criar quizzes rapidamente."
              },
              {
                icon: BarChart3,
                title: "Analytics Avançado",
                description: "Relatórios detalhados sobre performance e engajamento dos usuários."
              },
              {
                icon: Smartphone,
                title: "Mobile First",
                description: "Experiência otimizada para todos os dispositivos e tamanhos de tela."
              },
              {
                icon: Users,
                title: "Colaboração",
                description: "Trabalhe em equipe com permissões e controles de acesso."
              },
              {
                icon: Shield,
                title: "Segurança",
                description: "Dados protegidos com criptografia e backup automático."
              },
              {
                icon: Zap,
                title: "Performance",
                description: "Carregamento rápido e experiência fluida para seus usuários."
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-4xl mx-auto border-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pronto para Começar?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Junte-se a milhares de educadores e empresas que já transformaram seu conteúdo em experiências interativas.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={handleStartDemo}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6 rounded-xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Testar Agora
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleStartFree}
                  className="text-lg px-8 py-6 rounded-xl border-2"
                >
                  Criar Conta Grátis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              QuizLift
            </span>
          </div>
          <p className="text-muted-foreground">
            © 2024 QuizLift. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;