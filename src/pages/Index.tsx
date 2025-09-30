import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Star, Users, TrendingUp, Zap, Target, BarChart3, Smartphone, Globe, Shield, Clock, Edit3, GitBranch, UserCheck, Play, MousePointer, Layers, Palette, Eye, Webhook, Trophy, Sparkles, ArrowLeft, MessageCircle, Copy } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useNavigate } from 'react-router-dom';
import { initializeDemoData } from '@/lib/initializeDemoData';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
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
      navigate('/quiz/demo');
      toast.success('Demo iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar demo:', error);
      toast.error('Erro ao iniciar demo');
    }
  };

  const handleStartFree = () => {
    navigate('/auth');
  };

  const handleViewDemo = () => {
    navigate('/quiz/demo');
  };

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleStartFreeTrial = () => {
    navigate('/auth');
  };

  const benefits = [
    {
      icon: <MousePointer className="w-8 h-8 text-primary" />,
      title: "Editor Drag-and-Drop Intuitivo",
      description: "Crie quizzes profissionais sem código. Interface visual que qualquer um pode usar."
    },
    {
      icon: <GitBranch className="w-8 h-8 text-primary" />,
      title: "Lógica Condicional Inteligente",
      description: "Fluxos que se adaptam às respostas. Cada usuário tem uma experiência única."
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Captura de Leads Integrada",
      description: "Qualifique e capture leads automaticamente durante o quiz."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      title: "Analytics em Tempo Real",
      description: "Veja métricas de conversão, abandono e performance instantaneamente."
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-primary" />,
      title: "Conexão Direta WhatsApp/CRM",
      description: "Leads vão direto para seu WhatsApp ou CRM favorito."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-primary" />,
      title: "Responsividade Total",
      description: "Funciona perfeitamente em qualquer dispositivo ou tela."
    }
  ];

  const features = benefits;

  const advancedFeatures = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Funil e Heatmap por Pergunta",
      description: "Veja onde os usuários abandonam e otimize"
    },
    {
      icon: <Webhook className="w-6 h-6" />,
      title: "Webhooks com Logs e Retries",
      description: "Integração robusta com qualquer sistema"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Gamificação: XP e Conquistas",
      description: "Engaje usuários com elementos de jogo"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Presets de Temas e Customização",
      description: "Design profissional em poucos cliques"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Preview Multi-dispositivo",
      description: "Teste em desktop, tablet e mobile"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Lógica Condicional Avançada",
      description: "Fluxos complexos e personalizados"
    }
  ];

  const stats = [
    { number: "10k+", label: "Usuários Ativos" },
    { number: "4.9/5", label: "Avaliação Média" },
    { number: "+87%", label: "Mais Conversões" }
  ];

  const steps = [
    {
      number: "01",
      title: "Crie",
      description: "Adicione perguntas e personalize o design",
      icon: <Edit3 className="w-12 h-12 text-primary" />
    },
    {
      number: "02",
      title: "Lance",
      description: "Compartilhe via link, QR Code ou embed",
      icon: <Globe className="w-12 h-12 text-primary" />
    },
    {
      number: "03",
      title: "Converta",
      description: "Leads vão direto para WhatsApp/CRM",
      icon: <TrendingUp className="w-12 h-12 text-primary" />
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Marketing Manager",
      company: "TechCorp",
      content: "Com o QUIZZ Elevado aumentamos 3x os leads em 30 dias. A integração com WhatsApp é perfeita!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "CEO",
      company: "StartupXYZ",
      content: "Ferramenta incrível! Nossos quizzes agora convertem 87% mais que antes.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Growth Hacker",
      company: "ScaleUp",
      content: "Interface intuitiva e resultados impressionantes. Recomendo para qualquer negócio digital.",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 97",
      period: "/mês",
      description: "Perfeito para começar",
      features: [
        "Até 5 quizzes",
        "1.000 respostas/mês",
        "Integração WhatsApp",
        "Analytics básico",
        "Suporte por email"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "R$ 197",
      period: "/mês",
      description: "Mais popular",
      features: [
        "Quizzes ilimitados",
        "10.000 respostas/mês",
        "Todas as integrações",
        "Analytics avançado",
        "Lógica condicional",
        "Suporte prioritário"
      ],
      popular: true
    },
    {
      name: "Business",
      price: "R$ 297",
      period: "/mês",
      description: "Para empresas",
      features: [
        "Tudo do Pro",
        "Respostas ilimitadas",
        "White label",
        "API personalizada",
        "Suporte dedicado",
        "Onboarding personalizado"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Posso redirecionar direto para o WhatsApp?",
      answer: "Sim! Nosso sistema permite redirecionamento automático para WhatsApp com mensagem personalizada baseada nas respostas do quiz."
    },
    {
      question: "Como funciona o back-redirect?",
      answer: "Quando o usuário tenta sair da página, mostramos automaticamente uma oferta especial ou desconto para reter o lead."
    },
    {
      question: "Posso clonar quizzes existentes?",
      answer: "Absolutamente! Com um clique você pode duplicar qualquer quiz e personalizar conforme sua necessidade."
    },
    {
      question: "Consigo exportar leads para minha ferramenta?",
      answer: "Sim, oferecemos exportação em CSV, Excel e integrações nativas com principais CRMs e ferramentas de email marketing."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
        title={`${Math.round(scrollProgress)}% do seu sucesso já carregado 🚀`}
      />

      {/* Fixed Navbar */}
       <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
         isNavbarBlurred ? 'bg-background/80 backdrop-blur-md border-b' : 'bg-transparent'
       }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                QUIZZ Elevado
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#recursos" className="text-foreground/80 hover:text-primary transition-colors">Recursos</a>
              <a href="#como-funciona" className="text-foreground/80 hover:text-primary transition-colors">Como Funciona</a>
              <a href="#precos" className="text-foreground/80 hover:text-primary transition-colors">Preços</a>
              <Button onClick={handleStartFreeTrial} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Começar grátis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 pt-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-pulse">
                <Sparkles className="w-4 h-4" />
                Transforme visitantes em clientes
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent leading-tight">
                Transforme visitantes em clientes com quizzes que vendem
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Crie, publique e converta com quizzes interativos que conectam direto ao WhatsApp ou CRM.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={handleStartFreeTrial} className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg">
                  Começar grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleStartDemo} className="text-lg px-8 py-6 border-2 hover:bg-primary/5">
                  Ver demonstração
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl p-8 backdrop-blur-sm border border-primary/20 shadow-2xl animate-float">
                <div className="bg-background rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gradient-to-r from-primary/30 to-transparent rounded"></div>
                    <div className="h-4 bg-gradient-to-r from-secondary/30 to-transparent rounded w-3/4"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div className="h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="recursos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Recursos que fazem a diferença
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tudo que você precisa para criar quizzes que realmente convertem e geram resultados
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-background/50 backdrop-blur-sm">
                <div className="mb-6 p-3 bg-primary/10 rounded-2xl w-fit">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Como funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Em 3 passos simples, você terá quizzes profissionais capturando leads qualificados
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary text-white rounded-3xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                    {step.number}
                  </div>
                  <div className="mb-6 flex justify-center">{step.icon}</div>
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-6 w-12 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Recursos Avançados
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas profissionais para maximizar seus resultados
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/50 backdrop-blur-sm border-0">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">{feature.icon}</div>
                  <div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New Features Highlight */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Novidades Exclusivas
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Funcionalidades que Ninguém Mais Tem
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <ArrowLeft className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">Back Redirect Inteligente</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Quando o usuário tenta sair ou voltar, apresente automaticamente uma oferta especial configurada por você.
              </p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <MessageCircle className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-2xl font-bold mb-4">Acesso Direto ao WhatsApp</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Sem páginas intermediárias. Seu quiz abre direto no app e gera conversão instantânea.
              </p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <Copy className="w-12 h-12 text-purple-500 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Clonador de Quizzes</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Importe quizzes prontos e adapte ao seu negócio em minutos.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Resultados Comprovados
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja o que nossos clientes estão alcançando
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 bg-background/50 backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center font-bold mr-4">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role} • {testimonial.company}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Planos que Cabem no Seu Bolso
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`p-8 relative transition-all duration-300 hover:shadow-2xl ${
                plan.popular 
                  ? 'border-2 border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 to-secondary/5' 
                  : 'border-0 bg-background/50 backdrop-blur-sm hover:-translate-y-2'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      {plan.description}
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full py-6 text-lg font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg' 
                      : ''
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={handleStartFreeTrial}
                >
                  Começar grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent leading-tight">
              Pronto para transformar seus quizzes em vendas?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Junte-se a mais de 10.000 empresas que já aumentaram suas conversões com o QUIZZ Elevado
            </p>
            <Button 
              size="lg" 
              onClick={handleStartFreeTrial} 
              className="text-xl px-12 py-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-2xl hover:shadow-primary/25 transition-all duration-300"
            >
              Criar meu quiz agora
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              ✨ Sem cartão de crédito • Configuração em 2 minutos • Suporte em português
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;