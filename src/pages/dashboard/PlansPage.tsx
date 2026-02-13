import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const usage = [
  { label: "Clientes", current: 6, limit: 20 },
  { label: "Colaboradores", current: 2, limit: 2 },
  { label: "Locais", current: 1, limit: 1 },
];

const plans = [
  { name: "Básico", price: "49", current: true, features: ["20 clientes", "1 local", "2 colaboradores", "Link público", "Relatórios simples"] },
  { name: "Intermediário", price: "99", current: false, features: ["40 clientes", "2 locais", "5 colaboradores", "Serviços com preço", "Notificações e-mail", "Relatórios avançados"] },
  { name: "Avançado", price: "199", current: false, features: ["200 clientes", "5 locais", "20 colaboradores", "Regras avançadas", "Lista de espera", "Exportação CSV"] },
];

const PlansPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="font-heading text-2xl font-bold">Planos e Cobrança</h1>
      <p className="text-muted-foreground">Seu plano atual: <span className="font-semibold text-foreground">Básico</span> — Trial (5 dias restantes)</p>
    </div>

    <Card>
      <CardContent className="p-6">
        <h3 className="font-heading font-semibold mb-4">Consumo atual</h3>
        <div className="space-y-4">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{u.label}</span>
                <span className="text-muted-foreground">{u.current}/{u.limit}</span>
              </div>
              <Progress value={(u.current / u.limit) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((p) => (
        <Card key={p.name} className={`transition-all ${p.current ? "border-primary shadow-md" : "border-border/50 hover:shadow-lg hover:-translate-y-1"}`}>
          <CardContent className="p-6">
            {p.current && <span className="text-xs font-bold text-primary mb-2 block">PLANO ATUAL</span>}
            <h3 className="font-heading text-xl font-bold">{p.name}</h3>
            <div className="my-3">
              <span className="text-3xl font-heading font-bold">R${p.price}</span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>
            <ul className="space-y-2 mb-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-success mt-0.5 shrink-0" />{f}</li>
              ))}
            </ul>
            {p.current ? (
              <Button variant="outline" className="w-full" disabled>Plano atual</Button>
            ) : (
              <Button className="w-full gradient-primary border-0">Fazer upgrade <ArrowUpRight className="ml-1 h-4 w-4" /></Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default PlansPage;
