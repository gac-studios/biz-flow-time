import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, LayoutList, Columns3, CalendarDays } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendaFilters from "@/components/agenda/AgendaFilters";
import KanbanBoard from "@/components/agenda/KanbanBoard";
import AppointmentCalendar, { type CalendarAppointment } from "@/components/agenda/AppointmentCalendar";
import AppointmentDialog from "@/components/agenda/AppointmentDialog";
import { downloadCSV } from "@/lib/csv";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  scheduled: { label: "Agendado", variant: "default" },
  done: { label: "Concluído", variant: "secondary" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

const Agenda = () => {
  const { companyId, user, role } = useAuth();
  const isOwner = role === "owner";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"calendar" | "kanban">("calendar");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [prefillStart, setPrefillStart] = useState<Date | null>(null);
  const [prefillEnd, setPrefillEnd] = useState<Date | null>(null);

  // Calendar range
  const [rangeStart, setRangeStart] = useState<Date>(new Date());
  const [rangeEnd, setRangeEnd] = useState<Date>(new Date());

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [memberFilter, setMemberFilter] = useState("all");

  // Fetch company members for filter
  const { data: members = [] } = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data: mems } = await supabase.from("memberships").select("user_id").eq("company_id", companyId).eq("active", true);
      if (!mems || mems.length === 0) return [];
      const userIds = mems.map((m) => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      return (profiles || []).map((p) => ({ user_id: p.user_id, full_name: p.full_name || p.user_id.slice(0, 8) }));
    },
    enabled: !!companyId && isOwner,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["agenda", companyId, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("company_id", companyId)
        .gte("start_datetime", rangeStart.toISOString())
        .lte("start_datetime", rangeEnd.toISOString())
        .order("start_datetime", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map((a) => a.created_by_user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || "—"]));
      return data.map((a) => ({ ...a, creator_name: profileMap.get(a.created_by_user_id) || "—" })) as CalendarAppointment[];
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

  const handleRangeChange = useCallback((start: Date, end: Date) => {
    setRangeStart(start);
    setRangeEnd(end);
  }, []);

  const handleDateSelect = useCallback((start: Date, end: Date) => {
    setSelectedAppointment(null);
    setPrefillStart(start);
    setPrefillEnd(end);
    setDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((appt: CalendarAppointment) => {
    setSelectedAppointment(appt);
    setPrefillStart(null);
    setPrefillEnd(null);
    setDialogOpen(true);
  }, []);

  const openCreate = () => {
    setSelectedAppointment(null);
    setPrefillStart(null);
    setPrefillEnd(null);
    setDialogOpen(true);
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
      `agenda_export.csv`
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "kanban")}>
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="text-xs gap-1"><CalendarDays className="h-3.5 w-3.5" /> Calendário</TabsTrigger>
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

      {isLoading && (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      )}

      {!isLoading && viewMode === "calendar" && (
        <AppointmentCalendar
          appointments={filtered}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          onRangeChange={handleRangeChange}
        />
      )}

      {!isLoading && viewMode === "kanban" && (
        <KanbanBoard
          appointments={filtered}
          onStatusChange={handleStatusChange}
          onCardClick={handleEventClick}
          canMoveCard={(a) => isOwner || a.created_by_user_id === user?.id}
        />
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        prefillStart={prefillStart}
        prefillEnd={prefillEnd}
        mode="owner"
        queryKeyPrefix="agenda"
      />
    </div>
  );
};

export default Agenda;
