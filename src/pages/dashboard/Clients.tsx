import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Loader2, Pencil, Trash2, ArrowLeft, CalendarCheck, XCircle, UserX, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { statusMap, formatCurrency } from "@/lib/statuses";

interface Client {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

const Clients = () => {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) });
    }
    const next = addMonths(now, 1);
    opts.push({ value: format(next, "yyyy-MM"), label: format(next, "MMMM yyyy", { locale: ptBR }) });
    return opts;
  }, []);

  const rangeStart = useMemo(() => startOfMonth(new Date(selectedMonth + "-01")).toISOString(), [selectedMonth]);
  const rangeEnd = useMemo(() => endOfMonth(new Date(selectedMonth + "-01")).toISOString(), [selectedMonth]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("clients").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return (data || []) as Client[];
    },
    enabled: !!companyId,
  });

  const { data: monthlyStats = {} } = useQuery({
    queryKey: ["clients-monthly", companyId, selectedMonth],
    queryFn: async () => {
      if (!companyId) return {};
      const { data, error } = await supabase
        .from("appointments")
        .select("client_id, status, price_cents, paid_cents, payment_status")
        .eq("company_id", companyId)
        .not("client_id", "is", null)
        .gte("start_datetime", rangeStart)
        .lte("start_datetime", rangeEnd);
      if (error) throw error;
      const stats: Record<string, { total: number; done: number; canceled: number; noShow: number; spent: number }> = {};
      (data || []).forEach((a) => {
        if (!a.client_id) return;
        if (!stats[a.client_id]) stats[a.client_id] = { total: 0, done: 0, canceled: 0, noShow: 0, spent: 0 };
        stats[a.client_id].total++;
        if (a.status === "done") { stats[a.client_id].done++; stats[a.client_id].spent += (a.paid_cents || a.price_cents || 0); }
        if (a.status === "canceled") stats[a.client_id].canceled++;
        if (a.status === "no_show") stats[a.client_id].noShow++;
      });
      return stats;
    },
    enabled: !!companyId,
  });

  // Client detail: appointment history
  const { data: clientHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["client-history", detailClient?.id, companyId],
    queryFn: async () => {
      if (!detailClient || !companyId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, title, start_datetime, end_datetime, status, price_cents, paid_cents, payment_status, notes, created_by_user_id, category")
        .eq("company_id", companyId)
        .eq("client_id", detailClient.id)
        .order("start_datetime", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const uids = [...new Set(data.map((a) => a.created_by_user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", uids);
      const pMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || "—"]));
      return data.map((a) => ({ ...a, creator_name: pMap.get(a.created_by_user_id) || "—" }));
    },
    enabled: !!detailClient && !!companyId,
  });

  const historySummary = useMemo(() => {
    const total = clientHistory.length;
    const done = clientHistory.filter((a) => a.status === "done").length;
    const canceled = clientHistory.filter((a) => a.status === "canceled").length;
    const noShow = clientHistory.filter((a) => a.status === "no_show").length;
    const spent = clientHistory.filter((a) => a.status === "done").reduce((s, a) => s + (a.paid_cents || a.price_cents || 0), 0);
    return { total, done, canceled, noShow, spent };
  }, [clientHistory]);

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  const openCreate = () => { setEditingClient(null); setForm({ name: "", phone: "", notes: "" }); setDialogOpen(true); };
  const openEdit = (client: Client) => { setEditingClient(client); setForm({ name: client.name, phone: client.phone || "", notes: client.notes || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!companyId || !form.name.trim()) return;
    setSaving(true);
    if (editingClient) {
      const { error } = await supabase.from("clients").update({ name: form.name.trim(), phone: form.phone || null, notes: form.notes || null }).eq("id", editingClient.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Cliente atualizado" });
    } else {
      const { error } = await supabase.from("clients").insert({ company_id: companyId, name: form.name.trim(), phone: form.phone || null, notes: form.notes || null });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Cliente criado" });
    }
    setSaving(false); setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cliente removido" });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  // Client detail view
  if (detailClient) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDetailClient(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{detailClient.name}</h1>
            <p className="text-muted-foreground text-sm">{detailClient.phone || "Sem telefone"} {detailClient.notes ? `• ${detailClient.notes}` : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total de visitas", value: historySummary.total, icon: Users },
            { label: "Concluídos", value: historySummary.done, icon: CalendarCheck, color: "text-[hsl(var(--success))]" },
            { label: "Cancelados", value: historySummary.canceled, icon: XCircle, color: "text-destructive" },
            { label: "Não compareceu", value: historySummary.noShow, icon: UserX, color: "text-destructive" },
            { label: "Total gasto", value: formatCurrency(historySummary.spent), icon: DollarSign },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <p className={`text-xl font-bold ${(k as any).color || ""}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Histórico de agendamentos</CardTitle></CardHeader>
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : clientHistory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum agendamento vinculado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientHistory.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{format(new Date(a.start_datetime), "dd/MM/yy HH:mm")}</TableCell>
                      <TableCell className="text-sm font-medium">{a.title}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[a.status]?.variant || "secondary"} className="text-xs">
                          {statusMap[a.status]?.label || a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.creator_name}</TableCell>
                      <TableCell className="text-right text-sm">{a.price_cents ? formatCurrency(a.price_cents) : "—"}</TableCell>
                      <TableCell className="text-right text-sm">{a.paid_cents ? formatCurrency(a.paid_cents) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">{clients.length} cadastrados</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo cliente</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar clientes..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="capitalize">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="text-center">Agendamentos</TableHead>
                  <TableHead className="text-center">Concluídos</TableHead>
                  <TableHead className="text-center">Cancelados</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Não compareceu</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const s = monthlyStats[c.id] || { total: 0, done: 0, canceled: 0, noShow: 0, spent: 0 };
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailClient(c)}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{s.total}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{s.done}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="destructive" className="bg-destructive/15 text-destructive">{s.canceled}</Badge></TableCell>
                      <TableCell className="text-center hidden lg:table-cell"><Badge variant="destructive" className="bg-destructive/15 text-destructive">{s.noShow}</Badge></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
                                <AlertDialogDescription>Os agendamentos vinculados perderão a referência ao cliente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingClient ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input placeholder="Notas opcionais" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingClient ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
