import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Loader2, Pencil, Trash2 } from "lucide-react";
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

  // Monthly appointment counts per client
  const { data: monthlyStats = {} } = useQuery({
    queryKey: ["clients-monthly", companyId, selectedMonth],
    queryFn: async () => {
      if (!companyId) return {};
      const { data, error } = await supabase
        .from("appointments")
        .select("client_id, status")
        .eq("company_id", companyId)
        .not("client_id", "is", null)
        .gte("start_datetime", rangeStart)
        .lte("start_datetime", rangeEnd);
      if (error) throw error;
      const stats: Record<string, { total: number; done: number; canceled: number }> = {};
      (data || []).forEach((a) => {
        if (!a.client_id) return;
        if (!stats[a.client_id]) stats[a.client_id] = { total: 0, done: 0, canceled: 0 };
        stats[a.client_id].total++;
        if (a.status === "done") stats[a.client_id].done++;
        if (a.status === "canceled") stats[a.client_id].canceled++;
      });
      return stats;
    },
    enabled: !!companyId,
  });

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  const openCreate = () => {
    setEditingClient(null);
    setForm({ name: "", phone: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({ name: client.name, phone: client.phone || "", notes: client.notes || "" });
    setDialogOpen(true);
  };

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
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cliente removido" });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

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
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const s = monthlyStats[c.id] || { total: 0, done: 0, canceled: 0 };
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{s.total}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary" className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]">{s.done}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="destructive" className="bg-destructive/15 text-destructive">{s.canceled}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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

      {/* Create/Edit dialog */}
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
