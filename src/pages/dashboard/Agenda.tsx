import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, LayoutList, Columns3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendaFilters from "@/components/agenda/AgendaFilters";
import KanbanBoard from "@/components/agenda/KanbanBoard";
import { downloadCSV } from "@/lib/csv";

interface Appointment {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  created_by_user_id: string;
  creator_name?: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  scheduled: { label: "Agendado", variant: "default" },
  done: { label: "Concluído", variant: "secondary" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

const emptyForm = { title: "", date: "", startTime: "", endTime: "", status: "scheduled", notes: "" };

const Agenda = () => {
  const { companyId, user, role } = useAuth();
  const isOwner = role === "owner";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [memberFilter, setMemberFilter] = useState("all");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch company members for filter
  const { data: members = [] } = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data: mems } = await supabase.from("memberships").select("user_id").eq("company_id", companyId).eq("active", true);
      if (!mems || mems.length === 0) return [];
      const userIds = mems.map((m) => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      return (profiles || []).map((p) => ({ user_id: p.user_id, full_name: p.full_name || p.email }));
    },
    enabled: !!companyId && isOwner,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["agenda", companyId, dateStr],
    queryFn: async () => {
      if (!companyId) return [];
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("company_id", companyId)
        .gte("start_datetime", dayStart)
        .lte("start_datetime", dayEnd)
        .order("start_datetime", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map((a) => a.created_by_user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || p.email]));
      return data.map((a) => ({ ...a, creator_name: profileMap.get(a.created_by_user_id) || "—" })) as Appointment[];
    },
    enabled: !!companyId,
  });

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter.length > 0 && !statusFilter.includes(a.status)) return false;
      if (memberFilter !== "all" && a.created_by_user_id !== memberFilter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [appointments, statusFilter, memberFilter, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: dateStr });
    setDialogOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      date: format(new Date(a.start_datetime), "yyyy-MM-dd"),
      startTime: format(new Date(a.start_datetime), "HH:mm"),
      endTime: format(new Date(a.end_datetime), "HH:mm"),
      status: a.status,
      notes: a.notes || "",
    });
    setDialogOpen(true);
  };

  const checkConflict = async (): Promise<boolean> => {
    if (!companyId || !user) return false;
    const startDt = `${form.date}T${form.startTime}:00`;
    const endDt = `${form.date}T${form.endTime}:00`;
    const { data } = await supabase
      .from("appointments")
      .select("id")
      .eq("company_id", companyId)
      .eq("created_by_user_id", user.id)
      .neq("status", "canceled")
      .lt("start_datetime", endDt)
      .gt("end_datetime", startDt);
    const overlaps = (data || []).filter((r) => r.id !== editingId);
    return overlaps.length > 0;
  };

  const handleSave = async () => {
    if (!companyId || !user || !form.title || !form.date || !form.startTime || !form.endTime) return;
    setSaving(true);

    // Frontend conflict check
    const hasConflict = await checkConflict();
    if (hasConflict) {
      toast({ title: "Conflito de horário", description: "Já existe um agendamento nesse período.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const startDatetime = `${form.date}T${form.startTime}:00`;
    const endDatetime = `${form.date}T${form.endTime}:00`;

    if (editingId) {
      const { error } = await supabase
        .from("appointments")
        .update({ title: form.title, start_datetime: startDatetime, end_datetime: endDatetime, status: form.status, notes: form.notes || null })
        .eq("id", editingId);
      if (error) {
        const msg = error.message.includes("Conflito") ? error.message : error.message;
        toast({ title: "Erro", description: msg, variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Agendamento atualizado" });
    } else {
      const { error } = await supabase.from("appointments").insert({
        company_id: companyId,
        created_by_user_id: user.id,
        title: form.title,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        status: form.status,
        notes: form.notes || null,
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Agendamento criado" });
    }
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Agendamento removido" });
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Status alterado para ${statusMap[newStatus]?.label || newStatus}` });
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const handleExport = () => {
    downloadCSV(
      filtered.map((a) => ({
        titulo: a.title,
        inicio: format(new Date(a.start_datetime), "dd/MM/yyyy HH:mm"),
        fim: format(new Date(a.end_datetime), "dd/MM/yyyy HH:mm"),
        status: statusMap[a.status]?.label || a.status,
        notas: a.notes || "",
        criado_por: a.creator_name || "",
      })),
      `agenda_${dateStr}.csv`
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Agenda</h1>
          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={dateStr}
              onChange={(e) => setSelectedDate(new Date(e.target.value + "T12:00:00"))}
              className="w-auto h-8 text-sm"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "kanban")}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="text-xs gap-1"><LayoutList className="h-3.5 w-3.5" /> Lista</TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs gap-1"><Columns3 className="h-3.5 w-3.5" /> Quadro</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
        </div>
      </div>

      <AgendaFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        memberFilter={memberFilter}
        onMemberFilterChange={setMemberFilter}
        members={members}
        isOwner={isOwner}
        showExport={isOwner}
        onExport={handleExport}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          appointments={filtered}
          onStatusChange={handleStatusChange}
          onCardClick={openEdit}
          canMoveCard={(a) => isOwner || a.created_by_user_id === user?.id}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum agendamento para {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((a) => {
                  const s = statusMap[a.status] || statusMap.scheduled;
                  return (
                    <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className="text-sm font-mono text-primary font-medium w-28 shrink-0">
                        {format(new Date(a.start_datetime), "HH:mm")} – {format(new Date(a.end_datetime), "HH:mm")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">por {a.creator_name}{a.notes ? ` • ${a.notes}` : ""}</p>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        {isOwner && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover agendamento?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input placeholder="Ex: Reunião, Corte, Consulta…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início <span className="text-destructive">*</span></Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fim <span className="text-destructive">*</span></Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="done">Concluído</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Notas opcionais…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.date || !form.startTime || !form.endTime}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
