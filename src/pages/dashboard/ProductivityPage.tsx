import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { downloadCSV } from "@/lib/csv";

const ProductivityPage = () => {
  const { companyId } = useAuth();
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  const { data, isLoading } = useQuery({
    queryKey: ["productivity", companyId, startDate, endDate],
    queryFn: async () => {
      if (!companyId) return [];
      const { data: appts, error } = await supabase
        .from("appointments")
        .select("created_by_user_id, status")
        .eq("company_id", companyId)
        .gte("start_datetime", `${startDate}T00:00:00`)
        .lte("start_datetime", `${endDate}T23:59:59`);
      if (error) throw error;

      const userIds = [...new Set((appts || []).map((a) => a.created_by_user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || p.user_id.slice(0, 8)]));

      const stats = new Map<string, { name: string; total: number; done: number; canceled: number }>();
      for (const a of appts || []) {
        if (!stats.has(a.created_by_user_id)) {
          stats.set(a.created_by_user_id, {
            name: profileMap.get(a.created_by_user_id) || a.created_by_user_id.slice(0, 8),
            total: 0,
            done: 0,
            canceled: 0,
          });
        }
        const s = stats.get(a.created_by_user_id)!;
        s.total++;
        if (a.status === "done") s.done++;
        if (a.status === "canceled") s.canceled++;
      }
      return Array.from(stats.values()).sort((a, b) => b.total - a.total);
    },
    enabled: !!companyId,
  });

  const rows = data || [];

  const handleExport = () => {
    downloadCSV(
      rows.map((r) => ({
        colaborador: r.name,
        total: r.total,
        concluidos: r.done,
        cancelados: r.canceled,
      })),
      `produtividade_${startDate}_${endDate}.csv`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Produtividade</h1>
          <p className="text-muted-foreground">Desempenho por colaborador</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-1.5" /> Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Início</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fim</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto h-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum dado para o período selecionado.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base font-heading">Agendamentos por colaborador</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="done" name="Concluídos" fill="hsl(152 69% 40%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="canceled" name="Cancelados" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Concluídos</TableHead>
                    <TableHead className="text-right">Cancelados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className="text-right text-success">{r.done}</TableCell>
                      <TableCell className="text-right text-destructive">{r.canceled}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductivityPage;
