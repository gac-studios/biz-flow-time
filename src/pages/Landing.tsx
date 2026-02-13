import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Users, Clock, Building2, Shield, BarChart3, ChevronRight, Check, Star, Zap } from "lucide-react";

const features = [
  { icon: Calendar, title: "Agenda Inteligente", desc: "Visão dia, semana e mês com detecção de conflitos automática." },
  { icon: Users, title: "Gestão de Clientes", desc: "Cadastre, acompanhe histórico e gerencie seus clientes facilmente." },
  { icon: Clock, title: "Horários Flexíveis", desc: "Configure disponibilidade, pausas e bloqueios personalizados." },
  { icon: Building2, title: "Multi-unidade", desc: "Gerencie múltiplos locais e colaboradores em um só lugar." },
  { icon: Shield, title: "Segurança Total", desc: "Dados isolados por empresa com criptografia e controle de acesso." },
  { icon: BarChart3, title: "Relatórios", desc: "Métricas de agendamentos, cancelamentos e desempenho por colaborador." },
];

const plans = [
  {
    name: "Básico",
    price: "49",
    desc: "Para profissionais autônomos",
    features: ["20 clientes", "1 local", "2 colaboradores", "Link público de agendamento", "Relatórios simples"],
    popular: false,
  },
  {
    name: "Intermediário",
    price: "99",
    desc: "Para pequenas empresas",
    features: ["40 clientes", "2 locais", "5 colaboradores", "Serviços com preço e duração", "Notificações por e-mail", "Relatórios por colaborador"],
    popular: true,
  },
  {
    name: "Avançado",
    price: "199",
    desc: "Para empresas em crescimento",
    features: ["200 clientes", "5 locais", "20 colaboradores", "Regras avançadas", "Lista de espera", "Exportação CSV", "Permissões detalhadas"],
    popular: false,
  },
];

const faqs = [
  { q: "Posso testar antes de assinar?", a: "Sim! Oferecemos 7 dias de trial gratuito em todos os planos, sem necessidade de cartão de crédito." },
  { q: "Funciona para qualquer tipo de negócio?", a: "Sim! O AgendaPro é multi-segmento: barbearias, clínicas, estéticas, transporte, consultórios e muito mais." },
  { q: "Meus dados estão seguros?", a: "Absolutamente. Usamos criptografia, isolamento por empresa (multi-tenant) e controle de acesso rigoroso." },
  { q: "Posso ter mais de uma unidade?", a: "Sim! A partir do plano Intermediário você pode gerenciar múltiplos locais." },
  { q: "Como funciona o agendamento público?", a: "Cada empresa recebe um link exclusivo (ex: agendapro.com/c/sua-empresa) que seus clientes podem acessar para agendar online." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            AgendaPro
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" asChild aria-label="Entrar na sua conta">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild aria-label="Cadastrar minha empresa">
              <Link to="/signup">Cadastrar minha empresa <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="gradient-hero py-20 md:py-32 lg:py-40 relative">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
              <Zap className="h-4 w-4" />
              7 dias grátis em qualquer plano
            </div>
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 max-w-4xl mx-auto leading-tight">
              Agendamentos para qualquer negócio —{" "}
              <span className="text-accent">simples e rápido</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10">
              Barbearias, clínicas, estéticas, transporte e muito mais. Configure sua agenda em minutos e comece a receber agendamentos online.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa para gerenciar agendamentos</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Ferramentas poderosas e intuitivas para organizar seu negócio.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground text-lg">Em 3 passos simples você está pronto.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Crie sua conta", desc: "Cadastre-se e configure sua empresa em poucos minutos." },
              { step: "2", title: "Configure sua agenda", desc: "Adicione serviços, colaboradores e horários de atendimento." },
              { step: "3", title: "Receba agendamentos", desc: "Compartilhe seu link e seus clientes agendam online." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground mx-auto mb-4">{s.step}</div>
                <h3 className="font-heading text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Planos para cada fase do seu negócio</h2>
            <p className="text-muted-foreground text-lg">Comece grátis por 7 dias. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular ? "border-primary shadow-lg md:scale-105" : "border-border/50 hover:-translate-y-1"}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">Popular</div>
                )}
                <CardContent className="p-6 lg:p-8">
                  <h3 className="font-heading text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-heading font-bold">R${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <Button className={`w-full mb-6 ${plan.popular ? "gradient-primary border-0" : ""}`} variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/signup">Começar trial</Link>
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">O que nossos clientes dizem</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Carlos Silva", role: "Barbearia Premium", text: "O AgendaPro transformou a gestão da minha barbearia. Meus clientes adoram agendar online!" },
              { name: "Ana Santos", role: "Clínica Estética Bella", text: "Fácil de usar e super completo. Reduzi 80% das faltas com as confirmações automáticas." },
              { name: "Pedro Costa", role: "TransVip Transfers", text: "Gerenciar agendamentos de transporte nunca foi tão simples. Recomendo demais!" },
            ].map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 fill-accent text-accent" />))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-6 data-[state=open]:bg-secondary/30">
                <AccordionTrigger className="text-left font-medium hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-hero rounded-3xl p-10 md:p-16 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Pronto para organizar seus agendamentos?</h2>
            <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">Crie sua conta agora e comece com 7 dias grátis.</p>
            <Button size="lg" variant="accent" asChild>
              <Link to="/signup">Criar minha conta grátis <ChevronRight className="ml-1 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-heading font-bold text-primary">
              <Calendar className="h-5 w-5" /> AgendaPro
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 AgendaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
