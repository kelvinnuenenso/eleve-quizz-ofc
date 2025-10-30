import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { Zap, Target, BarChart3, Smartphone, MessageCircle, CheckCircle, Star, Users, TrendingUp, Play, Sun, Moon, ChevronRight, ChevronLeft, Download, QrCode, Code, MousePointer, Eye, Clock, Filter, Copy, ArrowRight, ArrowLeft, Brain, Webhook, Gamepad2, Palette, Monitor, Smartphone as SmartphoneIcon, Tablet, Zap as ZapIcon, Trophy, Upload, Calendar, Facebook, Link, Code2, Plus, Trash2, Settings, Search, Crown, Heart, Award, ExternalLink, Info, Gauge, Wifi, Database, AlertTriangle, RefreshCw, Home, Bug, TestTube, User, Lock, Sparkles, Loader2, X, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Handle scroll progress
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(scrollPercent);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartFree = () => {
    navigate('/auth');
  };

  // Demo functionality removed

  // Toggle dark/light mode
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Features data
  const benefits = [
    {
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      title: "Editor drag-and-drop intuitivo",
      description: "Crie quizzes profissionais sem escrever uma linha de código"
    },
    {
      icon: <Target className="w-8 h-8 text-blue-500" />,
      title: "Lógica condicional inteligente",
      description: "Personalize a experiência com base nas respostas dos usuários"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Captura de leads integrada",
      description: "Colete contatos automaticamente durante o quiz"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      title: "Analytics em tempo real",
      description: "Monitore desempenho e conversões em tempo real"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      title: "Conexão com WhatsApp/CRMs",
      description: "Envie leads diretamente para seus canais de venda"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-blue-500" />,
      title: "Responsividade total",
      description: "Perfeito em qualquer dispositivo: desktop, tablet ou mobile"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Crie",
      description: "Personalize perguntas e design com nosso editor visual",
      icon: <Plus className="w-8 h-8 text-blue-500" />
    },
    {
      number: "02",
      title: "Lance",
      description: "Compartilhe via link, QR code ou embed",
      icon: <Upload className="w-8 h-8 text-blue-500" />
    },
    {
      number: "03",
      title: "Converta",
      description: "Leads vão diretamente para seu WhatsApp ou CRM",
      icon: <TrendingUp className="w-8 h-8 text-blue-500" />
    }
  ];

  const advancedFeatures = [
    { icon: <Eye className="w-6 h-6 text-violet-500" />, title: "Funil e heatmap por pergunta" },
    { icon: <Webhook className="w-6 h-6 text-violet-500" />, title: "Webhooks com logs/retries" },
    { icon: <Gamepad2 className="w-6 h-6 text-violet-500" />, title: "Gamificação (XP, conquistas)" },
    { icon: <Palette className="w-6 h-6 text-violet-500" />, title: "Presets de temas e customização" },
    { icon: <Monitor className="w-6 h-6 text-violet-500" />, title: "Preview multi-dispositivo" },
    { icon: <Target className="w-6 h-6 text-violet-500" />, title: "Lógica condicional avançada" }
  ];

  const testimonials = [
    { stat: "+10k", label: "usuários ativos" },
    { stat: "4.9/5", label: "avaliação média" },
    { stat: "+87%", label: "mais conversões" }
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$97",
      period: "/mês",
      features: [
        "Até 100 respostas/mês",
        "3 quizzes ativos",
        "Integração WhatsApp",
        "Analytics básicos"
      ],
      highlighted: false
    },
    {
      name: "Pro",
      price: "R$197",
      period: "/mês",
      features: [
        "Até 1000 respostas/mês",
        "10 quizzes ativos",
        "Integração com CRMs",
        "Analytics avançados",
        "Personalização completa",
        "Suporte prioritário"
      ],
      highlighted: true
    },
    {
      name: "Business",
      price: "R$297",
      period: "/mês",
      features: [
        "Respostas ilimitadas",
        "Quizzes ilimitados",
        "Integrações avançadas",
        "Analytics em tempo real",
        "Personalização total",
        "Suporte 24/7",
        "Consultoria mensal"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        ></div>
        <div 
          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-background text-foreground px-2 py-1 rounded-full text-xs font-medium shadow-lg hidden md:block"
          style={{ left: `${scrollProgress}%` }}
          title="% do seu sucesso já carregado 🚀"
        >
          {Math.round(scrollProgress)}%
        </div>
      </div>

      {/* Navbar */}
      <header className="fixed top-1 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50 transition-all duration-300">
        <div className="px-4 py-4 flex items-center justify-between max-w-[90vw] mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">QUIZZ Elevado</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#benefits" className="text-foreground/80 hover:text-foreground transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">Preços</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-foreground/60" />
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={toggleTheme}
                aria-label="Alternar tema"
              />
              <Moon className="w-4 h-4 text-foreground/60" />
            </div>
            

            
            <Button 
              onClick={handleStartFree}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
            >
              Começar grátis →
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-violet-900/5 to-background z-0"></div>
        
        {/* Particles */}
        <div className="absolute inset-0 z-0">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-blue-500/10"
              style={{
                width: `${Math.random() * 10 + 2}px`,
                height: `${Math.random() * 10 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `pulse ${Math.random() * 4 + 2}s infinite`
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-[90vw] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 px-4 py-1 rounded-full text-sm font-medium animate-fade-in">
                🚀 Novo: Editor Visual Inteligente
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Transforme visitantes em clientes com <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">quizzes que vendem</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                Crie, publique e converta com quizzes interativos que conectam direto ao WhatsApp ou CRM.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Button 
                  size="lg" 
                  onClick={handleStartFree}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Começar grátis →
                </Button>

              </div>

              {/* Mockup Animation */}
              <div className="hidden lg:block relative">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
                <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl max-w-md mx-auto animate-fade-in-up">
                  <div className="space-y-4">
                    <div className="h-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="pt-4 space-y-3">
                      <div className="h-10 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg"></div>
                      <div className="h-10 bg-muted rounded-lg"></div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="lg:hidden flex justify-center">
              <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl max-w-md w-full animate-fade-in-up">
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="pt-4 space-y-3">
                    <div className="h-10 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg"></div>
                    <div className="h-10 bg-muted rounded-lg"></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-muted/30">
        <div className="max-w-[90vw] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefícios que transformam resultados</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tudo que você precisa para criar quizzes profissionais que realmente convertem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="p-6 bg-card border-0 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-[90vw] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Em apenas 3 passos simples, crie quizzes que convertem
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-violet-500"></div>
                )}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {step.number}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white dark:bg-background p-1 rounded-full shadow-md">
                      {step.icon}
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-[90vw] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos avançados</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Funcionalidades poderosas para maximizar suas conversões
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {advancedFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-blue-500/30 transition-colors duration-300">
                <div className="mt-1">{feature.icon}</div>
                <span className="font-medium">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* New Features Highlight */}
          <div className="mt-16 max-w-6xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/20">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Nova funcionalidade destaque</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <ArrowLeft className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Back Redirect Inteligente</h4>
                        <p className="text-muted-foreground text-sm">Mostra oferta ao voltar para aumentar conversões</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Acesso direto ao WhatsApp</h4>
                        <p className="text-muted-foreground text-sm">Sem páginas intermediárias, conexão direta</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Download className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Clonador de Quizziz</h4>
                        <p className="text-muted-foreground text-sm">Importe quizzes prontos com um clique</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/30">
                      <div className="text-center p-4">
                        <ZapIcon className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                        <span className="font-semibold text-sm">Nova Funcionalidade</span>
                      </div>
                    </div>
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-[90vw] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prova social</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Confie em quem já transformou seus resultados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 text-center bg-gradient-to-br from-card to-muted/30 border-0 shadow-sm">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-2">
                  {testimonial.stat}
                </div>
                <p className="text-muted-foreground">{testimonial.label}</p>
              </Card>
            ))}
          </div>

          {/* Testimonial Quotes */}
          <div className="mt-16 max-w-6xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/20">
              <div className="text-center max-w-3xl mx-auto">
                <div className="flex justify-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-current" />
                    ))}
                  </div>
                </div>
                <blockquote className="text-xl italic mb-6">
                  "O QUIZZ Elevado transformou nossa captação de leads. Aumentamos em 3x nossa taxa de conversão e reduzimos o custo por lead em 60%."
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Maria Silva</div>
                    <div className="text-sm text-muted-foreground">Diretora de Marketing, TechSolutions</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="max-w-[90vw] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que cabem no seu bolso</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Escolha o plano perfeito para suas necessidades
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`p-8 relative ${plan.highlighted ? 'ring-2 ring-blue-500/50 bg-gradient-to-b from-card to-muted/20 scale-105 z-10' : 'bg-card'}`}
              >
                {plan.highlighted && (
                  <Badge className="absolute top-4 right-4 bg-blue-500 text-white">
                    Mais Popular
                  </Badge>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={handleStartFree}
                  className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white' : ''}`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  Começar grátis
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-[90vw] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para transformar seus quizzes em vendas?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Junte-se a milhares de profissionais que já descobriram o poder dos quizzes interativos
          </p>
          <Button 
            size="lg" 
            onClick={handleStartFree}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Criar meu quiz agora →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="max-w-[90vw] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">QUIZZ Elevado</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 QUIZZ Elevado. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;