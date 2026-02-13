import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarCheck, CalendarX, DollarSign, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const StaffReport = () => {
  const { user, companyId } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) });
    }
    // add next month
    const next = addMonths(now, 1);
    opts.push({ value: format(next, "yyyy-MM"), label: format(next, "MMMM yyyy", { locale: ptBR }) });
    return opts;
  }, []);

  const rangeStart = useMemo(() => startOfMonth(new Date(selectedMonth + "-01")).toISOString(), [selectedMonth]);
  const rangeEnd = useMemo(() => endOfMonth(new Date(selectedMonth + "-01")).toISOString(), [selectedMonth]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["staff-report", user?.id, selectedMonth],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, status, amount_cents, category")
        .eq("company_id", companyId)
        .eq("created_by_user_id", user.id)
        .gte("start_datetime", rangeStart)
        .lte("start_datetime", rangeEnd);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!companyId,
  });

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const done = appointments.filter((a) => a.status === "done").length;
    const canceled = appointments.filter((a) => a.status === "canceled").length;
    const revenue = appointments
      .filter((a) => a.status !== "canceled")
      .reduce((sum, a) => sum + (a.amount_cents || 0), 0);
    const avgTicket = done > 0
      ? appointments.filter((a) => a.status === "done").reduce((s, a) => s + (a.amount_cents || 0), 0) / done
      : 0;
    return { total, scheduled, done, canceled, revenue, avgTicket };
  }, [appointments]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Relatório</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="capitalize">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total no mês</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default" className="text-xs">{stats.scheduled} agendados</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CalendarCheck className="h-4 w-4" /> Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[hsl(var(--success))]">{stats.done}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CalendarX className="h-4 w-4" /> Cancelados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{stats.canceled}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
              {stats.avgTicket > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Ticket médio: {formatCurrency(stats.avgTicket)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StaffReport;
