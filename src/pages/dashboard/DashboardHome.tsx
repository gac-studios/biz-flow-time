import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, CheckCircle2, XCircle, UserX, DollarSign, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/statuses";

type RangePreset = "today" | "week" | "month" | "last_month";

const rangeLabels: Record<RangePreset, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  last_month: "Mês passado",
};

const getRange = (preset: RangePreset): [Date, Date] => {
  const now = new Date();
  switch (preset) {
    case "today": return [startOfDay(now), endOfDay(now)];
    case "week": return [startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })];
    case "month": return [startOfMonth(now), endOfMonth(now)];
    case "last_month": { const lm = subMonths(now, 1); return [startOfMonth(lm), endOfMonth(lm)]; }
  }
};

const DashboardHome = () => {
  const { companyId } = useAuth();
  const [preset, setPreset] = useState<RangePreset>("month");

  const [rangeStart, rangeEnd] = useMemo(() => getRange(preset), [preset]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["dashboard-kpis", companyId, preset],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, status, price_cents, paid_cents, payment_status, created_by_user_id, start_datetime")
        .eq("company_id", companyId)
        .gte("start_datetime", rangeStart.toISOString())
        .lte("start_datetime", rangeEnd.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch member names for top collaborators
  const memberIds = useMemo(() => [...new Set(appointments.map((a) => a.created_by_user_id))], [appointments]);
  const { data: profiles = [] } = useQuery({
    queryKey: ["dashboard-profiles", memberIds.join(",")],
    queryFn: async () => {
      if (memberIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", memberIds);
      return data || [];
    },
    enabled: memberIds.length > 0,
  });
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.user_id, p.full_name || "—"])), [profiles]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const done = appointments.filter((a) => a.status === "done").length;
    const canceled = appointments.filter((a) => a.status === "canceled").length;
    const noShow = appointments.filter((a) => a.status === "no_show").length;
    const cancelRate = total > 0 ? ((canceled / total) * 100).toFixed(1) : "0";
    const expectedRevenue = appointments.reduce((s, a) => s + (a.price_cents || 0), 0);
    const receivedRevenue = appointments.filter((a) => a.payment_status === "paid").reduce((s, a) => s + (a.paid_cents || a.price_cents || 0), 0);
    const avgTicket = done > 0 ? appointments.filter((a) => a.status === "done").reduce((s, a) => s + (a.price_cents || 0), 0) / done : 0;
    return { total, done, canceled, noShow, cancelRate, expectedRevenue, receivedRevenue, avgTicket };
  }, [appointments]);

  // Top collaborators by completed count
  const topCollaborators = useMemo(() => {
    const map = new Map<string, { done: number; revenue: number }>();
    appointments.forEach((a) => {
      if (!map.has(a.created_by_user_id)) map.set(a.created_by_user_id, { done: 0, revenue: 0 });
      const entry = map.get(a.created_by_user_id)!;
      if (a.status === "done") { entry.done++; entry.revenue += (a.paid_cents || a.price_cents || 0); }
    });
    return [...map.entries()]
      .map(([uid, s]) => ({ name: profileMap.get(uid) || "—", ...s }))
      .sort((a, b) => b.done - a.done)
      .slice(0, 5);
  }, [appointments, profileMap]);

  // Hourly histogram
  const hourlyData = useMemo(() => {
    const hours: Record<number, number> = {};
    appointments.forEach((a) => {
      const h = new Date(a.start_datetime).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, "0")}h`, count: hours[i] || 0 }))
      .filter((h) => h.count > 0);
  }, [appointments]);

  const kpis = [
    { label: "Total", value: stats.total, icon: Calendar, color: "" },
    { label: "Concluídos", value: stats.done, icon: CheckCircle2, color: "text-[hsl(var(--success))]" },
    { label: "Cancelados", value: `${stats.canceled} (${stats.cancelRate}%)`, icon: XCircle, color: "text-destructive" },
    { label: "Não compareceu", value: stats.noShow, icon: UserX, color: "text-destructive" },
    { label: "Faturamento previsto", value: formatCurrency(stats.expectedRevenue), icon: DollarSign, color: "" },
    { label: "Faturamento recebido", value: formatCurrency(stats.receivedRevenue), icon: TrendingUp, color: "text-[hsl(var(--success))]" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(rangeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                    <k.icon className={`h-4 w-4 ${k.color || "text-muted-foreground"}`} />
                  </div>
                  <p className={`text-xl font-heading font-bold ${k.color}`}>{k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats.avgTicket > 0 && (
            <p className="text-sm text-muted-foreground">Ticket médio (concluídos): {formatCurrency(stats.avgTicket)}</p>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hourly histogram */}
            {hourlyData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="font-heading text-lg">Horários mais movimentados</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Bar dataKey="count" name="Agendamentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top collaborators */}
            {topCollaborators.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><Users className="h-4 w-4" /> Top colaboradores</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {topCollaborators.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs w-6 h-6 flex items-center justify-center rounded-full">{i + 1}</Badge>
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{c.done} concluídos</p>
                        {c.revenue > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(c.revenue)}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
