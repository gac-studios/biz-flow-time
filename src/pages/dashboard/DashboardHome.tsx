import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Users, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const kpis = [
  { label: "Hoje", value: "8", icon: Calendar, change: "+2" },
  { label: "Semana", value: "34", icon: TrendingUp, change: "+12%" },
  { label: "Mês", value: "127", icon: Users, change: "+8%" },
  { label: "Cancelamentos", value: "4%", icon: XCircle, change: "-1%" },
];

const chartData = [
  { day: "Seg", agendamentos: 12 },
  { day: "Ter", agendamentos: 19 },
  { day: "Qua", agendamentos: 15 },
  { day: "Qui", agendamentos: 22 },
  { day: "Sex", agendamentos: 28 },
  { day: "Sáb", agendamentos: 35 },
  { day: "Dom", agendamentos: 5 },
];

const nextAppts = [
  { time: "09:00", client: "João Silva", service: "Corte + Barba", staff: "Carlos" },
  { time: "09:45", client: "Maria Santos", service: "Corte feminino", staff: "Ana" },
  { time: "10:30", client: "Pedro Costa", service: "Barba", staff: "Carlos" },
  { time: "11:00", client: "Lucas Oliveira", service: "Corte", staff: "Carlos" },
  { time: "14:00", client: "Fernanda Lima", service: "Hidratação", staff: "Ana" },
];

const DashboardHome = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Visão geral do seu negócio</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <Card key={k.label}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl lg:text-3xl font-heading font-bold">{k.value}</p>
            <span className="text-xs text-success">{k.change}</span>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle className="font-heading text-lg">Agendamentos da semana</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 90%)" />
              <XAxis dataKey="day" stroke="hsl(215 15% 45%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 45%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(215 20% 90%)", borderRadius: "8px" }} />
              <Bar dataKey="agendamentos" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="font-heading text-lg">Próximos atendimentos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {nextAppts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-sm font-mono font-medium text-primary w-12">{a.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.client}</p>
                <p className="text-xs text-muted-foreground">{a.service} • {a.staff}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

export default DashboardHome;
