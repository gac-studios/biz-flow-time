import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { allStatuses, paymentStatusMap, statusMap } from "@/lib/statuses";
import type { CalendarAppointment } from "./AppointmentCalendar";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: CalendarAppointment | null;
  prefillStart?: Date | null;
  prefillEnd?: Date | null;
  mode: "owner" | "staff";
  queryKeyPrefix: string;
  readOnly?: boolean;
  onSuccess?: () => void;
}

const emptyForm = {
  title: "", date: "", startTime: "", endTime: "", status: "scheduled",
  notes: "", priceCents: "", paidCents: "", paymentStatus: "pending",
  paymentMethod: "", category: "", clientId: "",
};

const AppointmentDialog = ({ open, onOpenChange, appointment, prefillStart, prefillEnd, mode, queryKeyPrefix, readOnly = false, onSuccess }: AppointmentDialogProps) => {
  const { companyId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Client Combobox + Quick Create
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", notes: "" });
  const [creatingClient, setCreatingClient] = useState(false);

  const isEditing = !!appointment;
  const isOwner = mode === "owner";

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("clients").select("id, name, phone").eq("company_id", companyId).order("name");
      return data || [];
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (appointment) {
      const a = appointment as any;
      setForm({
        title: a.title,
        date: format(new Date(a.start_datetime), "yyyy-MM-dd"),
        startTime: format(new Date(a.start_datetime), "HH:mm"),
        endTime: format(new Date(a.end_datetime), "HH:mm"),
        status: Object.keys(statusMap).includes(a.status) ? a.status : "scheduled",
        notes: a.notes || "",
        priceCents: a.price_cents ? String(a.price_cents / 100) : (a.amount_cents ? String(a.amount_cents / 100) : ""),
        paidCents: a.paid_cents ? String(a.paid_cents / 100) : "",
        paymentStatus: a.payment_status || "pending",
        paymentMethod: a.payment_method || "",
        category: a.category || "",
        clientId: a.client_id || "",
      });
    } else if (prefillStart) {
      const end = prefillEnd || new Date(prefillStart.getTime() + 30 * 60000);
      setForm({ ...emptyForm, date: format(prefillStart, "yyyy-MM-dd"), startTime: format(prefillStart, "HH:mm"), endTime: format(end, "HH:mm") });
    } else {
      setForm(emptyForm);
    }
  }, [appointment, prefillStart, prefillEnd]);

  const checkConflict = async (): Promise<boolean> => {
    if (!companyId || !user) return false;
    const startDt = `${form.date}T${form.startTime}:00`;
    const endDt = `${form.date}T${form.endTime}:00`;
    const { data } = await supabase
      .from("appointments").select("id")
      .eq("company_id", companyId).eq("created_by_user_id", user.id)
      .neq("status", "canceled").lt("start_datetime", endDt).gt("end_datetime", startDt);
    const overlaps = (data || []).filter((r) => r.id !== appointment?.id);
    return overlaps.length > 0;
  };

  const parseCents = (v: string) => v ? Math.round(parseFloat(v.replace(",", ".")) * 100) : null;

  const handleSave = async () => {
    if (!companyId || !user || !form.title || !form.date || !form.startTime || !form.endTime) return;
    setSaving(true);

    const hasConflict = await checkConflict();
    if (hasConflict) {
      toast({ title: "Conflito de horário", description: "Já existe um agendamento nesse período.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const startDatetime = `${form.date}T${form.startTime}:00`;
    const endDatetime = `${form.date}T${form.endTime}:00`;

    if (isEditing && appointment) {
      const updatePayload = isOwner
        ? {
          title: form.title, start_datetime: startDatetime, end_datetime: endDatetime,
          status: form.status, notes: form.notes || null,
          price_cents: parseCents(form.priceCents), paid_cents: parseCents(form.paidCents),
          payment_status: form.paymentStatus, payment_method: form.paymentMethod || null,
          category: form.category || null, client_id: form.clientId || null,
        }
        : {
          status: form.status, notes: form.notes || null,
          price_cents: parseCents(form.priceCents), category: form.category || null,
        };

      const { error } = await supabase.from("appointments").update(updatePayload).eq("id", appointment.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Agendamento atualizado" });
    } else {
      const { error } = await supabase.from("appointments").insert({
        company_id: companyId, created_by_user_id: user.id,
        title: form.title, start_datetime: startDatetime, end_datetime: endDatetime,
        status: form.status, notes: form.notes || null,
        price_cents: parseCents(form.priceCents), paid_cents: parseCents(form.paidCents),
        payment_status: form.paymentStatus, payment_method: form.paymentMethod || null,
        category: form.category || null, client_id: form.clientId || null,
      });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Agendamento criado" });
    }
    setSaving(false);
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
    onSuccess?.();
  };

  const handleDelete = async () => {
    if (!appointment) return;
    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Agendamento removido" });
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
  };

  const handleCreateClient = async () => {
    if (!companyId || !newClient.name) return;
    setCreatingClient(true);

    // Check if client with same name exist (optional, but good)
    // Actually simplicity first:
    const { data, error } = await supabase.from("clients").insert({
      company_id: companyId,
      name: newClient.name,
      phone: newClient.phone || null,
      notes: newClient.notes || null,
    }).select().single();

    if (error) {
      toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" });
      setCreatingClient(false);
      return;
    }

    toast({ title: "Cliente criado!" });
    setForm({ ...form, clientId: data.id });
    setNewClient({ name: "", phone: "", notes: "" });
    setCreateClientOpen(false);
    setCreatingClient(false);
    queryClient.invalidateQueries({ queryKey: ["clients-select"] });
  };

  const canEditField = (field: string) => {
    if (readOnly) return false;
    if (!isEditing) return true;
    if (isOwner) return true;
    return ["status", "notes", "priceCents", "category", "clientId"].includes(field);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {readOnly ? "Detalhes do agendamento" : (isEditing ? "Detalhes do agendamento" : "Novo agendamento")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isEditing && appointment?.creator_name && (
              <p className="text-sm text-muted-foreground">Criado por: {appointment.creator_name}</p>
            )}
            <div className="space-y-2">
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input placeholder="Ex: Reunião, Corte, Consulta…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={!canEditField("title")} />
            </div>
            <div className="space-y-2">
              <Label>Data <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} disabled={!canEditField("date")} />
            </div>

            <div className="space-y-2">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={clientComboboxOpen} className="w-full justify-between" disabled={!canEditField("clientId")}>
                    {form.clientId
                      ? clients.find((c) => c.id === form.clientId)?.name
                      : "Selecione um cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente (nome ou telefone)..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Nenhum cliente encontrado.
                        </div>
                        <Button variant="outline" size="sm" className="w-[90%] mx-auto mb-2 block" onClick={() => { setCreateClientOpen(true); setClientComboboxOpen(false); }}>+ Novo Cliente</Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name + " " + (client.phone || "")}
                            onSelect={() => {
                              setForm({ ...form, clientId: client.id });
                              setClientComboboxOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.clientId === client.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              {client.phone && <span className="text-xs text-muted-foreground">{client.phone}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <div className="p-1 border-t mt-1">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { setCreateClientOpen(true); setClientComboboxOpen(false); }}>
                          <Plus className="mr-2 h-3 w-3" /> Novo Cliente
                        </Button>
                      </div>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início <span className="text-destructive">*</span></Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} disabled={!canEditField("startTime")} />
              </div>
              <div className="space-y-2">
                <Label>Fim <span className="text-destructive">*</span></Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} disabled={!canEditField("endTime")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} disabled={!canEditField("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Financial fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input placeholder="0,00" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: e.target.value })} disabled={!canEditField("priceCents")} />
              </div>
              {isOwner && (
                <div className="space-y-2">
                  <Label>Recebido (R$)</Label>
                  <Input placeholder="0,00" value={form.paidCents} onChange={(e) => setForm({ ...form, paidCents: e.target.value })} disabled={!canEditField("paidCents")} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pagamento</Label>
                <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })} disabled={!isOwner && isEditing}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentStatusMap).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input placeholder="Ex: Corte, Consulta…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={!canEditField("category")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Notas opcionais…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={!canEditField("notes")} />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            {isEditing && isOwner && !readOnly && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-auto"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Fechar" : "Cancelar"}</Button>
            {!readOnly && (
              <Button onClick={handleSave} disabled={saving || !form.title || !form.date || !form.startTime || !form.endTime || !form.clientId}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createClientOpen} onOpenChange={setCreateClientOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>Preencha os dados do novo cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} />
            </div>
            <Button onClick={handleCreateClient} className="w-full" disabled={creatingClient || !newClient.name}>
              {creatingClient && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentDialog;
