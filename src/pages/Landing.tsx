import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import {
  Zap, Target, Users, BarChart3, MessageCircle, Smartphone,
  TrendingUp, Eye, Webhook, Gamepad2, Palette, Monitor,
  CheckCircle, Star, Sun, Moon, ArrowRight, Menu, X,
  Sparkles, Send, Shield
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const [typedText, setTypedText] = useState('');
  const fullText = 'Transforme visitantes em clientes';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const benefits = [
    { icon: <Zap className="w-10 h-10" />, title: "Editor Drag-and-Drop", description: "Crie quizzes sem código", color: "from-blue-500 to-cyan-500" },
    { icon: <Target className="w-10 h-10" />, title: "Lógica Condicional", description: "Personalize as respostas", color: "from-purple-500 to-pink-500" },
    { icon: <Users className="w-10 h-10" />, title: "Captura de Leads", description: "Colete contatos automaticamente", color: "from-green-500 to-emerald-500" },
    { icon: <BarChart3 className="w-10 h-10" />, title: "Analytics Real-Time", description: "Monitore conversões", color: "from-orange-500 to-red-500" },
    { icon: <MessageCircle className="w-10 h-10" />, title: "WhatsApp & CRM", description: "Integração direta", color: "from-pink-500 to-rose-500" },
    { icon: <Smartphone className="w-10 h-10" />, title: "100% Responsivo", description: "Em qualquer dispositivo", color: "from-cyan-500 to-blue-500" }
  ];

  const steps = [
    { number: "01", title: "Crie", description: "Personalize perguntas e design", icon: <Sparkles className="w-12 h-12" /> },
    { number: "02", title: "Lance", description: "Compartilhe via link ou QR", icon: <Send className="w-12 h-12" /> },
    { number: "03", title: "Converta", description: "Leads direto no WhatsApp", icon: <TrendingUp className="w-12 h-12" /> }
  ];

  const features = [
    { icon: <Eye />, title: "Funil e heatmap" },
    { icon: <Webhook />, title: "Webhooks" },
    { icon: <Gamepad2 />, title: "Gamificação" },
    { icon: <Palette />, title: "Temas personalizados" },
    { icon: <Monitor />, title: "Preview multi-device" },
    { icon: <Shield />, title: "Lógica avançada" }
  ];

  const testimonials = [
    { quote: "Aumentamos 3x nossa conversão com o QUIZZ Elevado.", author: "Maria Silva", role: "Diretora de Marketing", company: "TechSolutions" },
    { quote: "Leads qualificados chegam direto no WhatsApp.", author: "Carlos Oliveira", role: "Gerente de Vendas", company: "GrowthCo" },
    { quote: "A integração com CRM é perfeita!", author: "Ana Costa", role: "Head de Marketing", company: "InnovateLab" }
  ];

  const plans = [
    { name: "Starter", price: "97", description: "Ideal para começar", features: ["100 respostas/mês", "3 quizzes", "WhatsApp", "Analytics básicos", "Suporte email"] },
    { name: "Pro", price: "197", description: "Mais popular", features: ["1.000 respostas/mês", "10 quizzes", "CRM", "Analytics avançados", "Personalização", "Suporte prioritário", "Webhooks"], popular: true },
    { name: "Business", price: "297", description: "Sem limites", features: ["Respostas ilimitadas", "Quizzes ilimitados", "Integrações avançadas", "Analytics real-time", "White label", "Suporte 24/7", "Consultoria"] }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const AnimatedCard = ({ children, delay = 0 }: any) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    return (
      <motion.div ref={ref} initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-50" style={{ scaleX }} />

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div key={i} className="absolute w-2 h-2 bg-primary/20 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
        ))}
      </div>

      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="fixed top-0 w-full backdrop-blur-xl bg-background/70 border-b border-border/50 z-40">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            QUIZZ Elevado
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#beneficios" className="text-sm hover:text-primary transition-all relative group">Benefícios<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all" /></a>
            <a href="#como-funciona" className="text-sm hover:text-primary transition-all relative group">Como Funciona<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all" /></a>
            <a href="#recursos" className="text-sm hover:text-primary transition-all relative group">Recursos<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all" /></a>
            <a href="#precos" className="text-sm hover:text-primary transition-all relative group">Preços<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all" /></a>
            <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="icon" className="relative overflow-hidden">
              <motion.div initial={{ rotate: 0 }} whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/auth')} className="relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">Começar agora<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
              </Button>
            </motion.div>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
            <motion.div animate={{ rotate: isMenuOpen ? 180 : 0 }}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.div>
          </button>
        </nav>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-6 space-y-4">
              <a href="#beneficios" className="block hover:text-primary transition-colors">Benefícios</a>
              <a href="#como-funciona" className="block hover:text-primary transition-colors">Como Funciona</a>
              <a href="#recursos" className="block hover:text-primary transition-colors">Recursos</a>
              <a href="#precos" className="block hover:text-primary transition-colors">Preços</a>
              <Button onClick={() => navigate('/auth')} className="w-full">Começar agora</Button>
            </div>
          </motion.div>
        )}
      </motion.header>

      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Criador de Quizzes Inteligente</span>
              </motion.div>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{typedText}</span>
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="inline-block w-1 h-16 bg-primary ml-2" />
              <br /><span className="text-foreground">com quizzes que vendem</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Crie, publique e converta com quizzes interativos que conectam direto ao WhatsApp ou CRM.
              <span className="block mt-2 text-primary font-medium">Comece grátis em menos de 2 minutos.</span>
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" onClick={() => navigate('/auth')} className="relative px-8 py-6 text-lg font-medium">
                  Começar grátis<ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="px-8 py-6 text-lg backdrop-blur-sm bg-background/50">Ver demonstração</Button>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }} className="mt-20 relative">
              <div className="relative mx-auto max-w-4xl">
                <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-background/80 to-muted/40">
                  <div className="aspect-video p-8">
                    <div className="h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                      <div className="text-6xl">🎯</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -15, 0], x: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-4 -right-4 p-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg"><Zap className="w-8 h-8 text-white" /></motion.div>
                <motion.div animate={{ y: [0, 15, 0], x: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-4 -left-4 p-4 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg"><Target className="w-8 h-8 text-white" /></motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Por que escolher o<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> QUIZZ Elevado</span>?</h2>
              <p className="text-xl text-muted-foreground">Tudo que você precisa para criar quizzes que convertem</p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <Card className="p-8 h-full group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-border/50 backdrop-blur-sm bg-background/50">
                  <motion.div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${benefit.color} mb-6`} whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                    <div className="text-white">{benefit.icon}</div>
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Como funciona</h2>
              <p className="text-xl text-muted-foreground">3 passos simples para começar a converter</p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 -translate-y-1/2 -z-10" />
            {steps.map((step, index) => (
              <AnimatedCard key={index} delay={index * 0.2}>
                <div className="text-center relative">
                  <motion.div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white mb-6 relative z-10" whileHover={{ scale: 1.1, rotate: 10 }}>{step.icon}</motion.div>
                  <div className="text-sm font-mono text-muted-foreground mb-2">{step.number}</div>
                  <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Recursos Avançados</h2>
              <p className="text-xl text-muted-foreground">Ferramentas profissionais para maximizar resultados</p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <motion.div whileHover={{ y: -5 }} className="p-6 rounded-xl border border-border/50 backdrop-blur-sm bg-background/50 hover:shadow-xl transition-all cursor-pointer">
                  <div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-primary/10">{feature.icon}</div><span className="font-medium">{feature.title}</span></div>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">O que nossos clientes dizem</h2>
              <p className="text-xl text-muted-foreground">Resultados reais de empresas que confiam em nós</p>
            </motion.div>
          </div>
          <div className="max-w-4xl mx-auto">
            <motion.div key={currentTestimonial} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.5 }}>
              <Card className="p-12 backdrop-blur-sm bg-background/50 border-border/50">
                <div className="flex gap-2 mb-6">{[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-yellow-500 text-yellow-500" />)}</div>
                <p className="text-2xl mb-8 leading-relaxed">{testimonials[currentTestimonial].quote}</p>
                <div>
                  <p className="font-semibold text-lg">{testimonials[currentTestimonial].author}</p>
                  <p className="text-muted-foreground">{testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].company}</p>
                </div>
              </Card>
            </motion.div>
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => <button key={index} onClick={() => setCurrentTestimonial(index)} className={`w-3 h-3 rounded-full transition-all ${index === currentTestimonial ? 'bg-primary w-8' : 'bg-muted-foreground/30'}`} />)}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-20 text-center">
            <AnimatedCard delay={0}><div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">+10k</div><p className="text-muted-foreground">Usuários ativos</p></AnimatedCard>
            <AnimatedCard delay={0.1}><div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">4.9 <Star className="w-10 h-10 fill-yellow-500 text-yellow-500" /></div><p className="text-muted-foreground">Avaliação média</p></AnimatedCard>
            <AnimatedCard delay={0.2}><div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">+87%</div><p className="text-muted-foreground">Mais conversões</p></AnimatedCard>
          </div>
        </div>
      </section>

      <section id="precos" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Planos para todos os tamanhos</h2>
              <p className="text-xl text-muted-foreground">Escolha o melhor plano para o seu negócio</p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <motion.div whileHover={{ scale: plan.popular ? 1.05 : 1.02, y: -10 }} className={`h-full ${plan.popular ? 'relative' : ''}`}>
                  {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">Mais Popular</div>}
                  <Card className={`p-8 h-full flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-2xl bg-gradient-to-br from-background to-primary/5' : 'border-border/50 backdrop-blur-sm bg-background/50'}`}>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    <div className="mb-8"><span className="text-5xl font-bold">R${plan.price}</span><span className="text-muted-foreground">/mês</span></div>
                    <ul className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, i) => <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /><span>{feature}</span></li>)}
                    </ul>
                    <Button onClick={() => navigate('/auth')} className="w-full py-6" variant={plan.popular ? 'default' : 'outline'}>Começar grátis</Button>
                  </Card>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-10" />
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => <motion.div key={i} className="absolute w-2 h-2 bg-white/20 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} animate={{ y: [0, -50, 0], opacity: [0, 1, 0] }} transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }} />)}
        </div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Pronto para transformar<br /><span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">seus quizzes em vendas?</span></h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">Junte-se a milhares de empresas que já estão convertendo mais com o QUIZZ Elevado</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" onClick={() => navigate('/auth')} className="px-12 py-8 text-xl font-medium">Criar meu quiz agora<ArrowRight className="w-6 h-6 ml-2" /></Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-border/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">QUIZZ Elevado</div>
            <div className="flex gap-6">
              <a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors">Benefícios</a>
              <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">Como Funciona</a>
              <a href="#recursos" className="text-muted-foreground hover:text-primary transition-colors">Recursos</a>
              <a href="#precos" className="text-muted-foreground hover:text-primary transition-colors">Preços</a>
            </div>
            <p className="text-muted-foreground">© 2025 QUIZZ Elevado. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
