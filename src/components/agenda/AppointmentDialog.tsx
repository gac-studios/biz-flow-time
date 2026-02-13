import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarAppointment } from "./AppointmentCalendar";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  scheduled: { label: "Agendado", variant: "default" },
  done: { label: "Concluído", variant: "secondary" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: CalendarAppointment | null;
  prefillStart?: Date | null;
  prefillEnd?: Date | null;
  /** owner can edit all + delete; staff can edit notes/status only */
  mode: "owner" | "staff";
  queryKeyPrefix: string;
}

const emptyForm = { title: "", date: "", startTime: "", endTime: "", status: "scheduled", notes: "" };

const AppointmentDialog = ({
  open,
  onOpenChange,
  appointment,
  prefillStart,
  prefillEnd,
  mode,
  queryKeyPrefix,
}: AppointmentDialogProps) => {
  const { companyId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEditing = !!appointment;
  const isOwner = mode === "owner";

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title,
        date: format(new Date(appointment.start_datetime), "yyyy-MM-dd"),
        startTime: format(new Date(appointment.start_datetime), "HH:mm"),
        endTime: format(new Date(appointment.end_datetime), "HH:mm"),
        status: appointment.status,
        notes: appointment.notes || "",
      });
    } else if (prefillStart) {
      const end = prefillEnd || new Date(prefillStart.getTime() + 30 * 60000);
      setForm({
        ...emptyForm,
        date: format(prefillStart, "yyyy-MM-dd"),
        startTime: format(prefillStart, "HH:mm"),
        endTime: format(end, "HH:mm"),
      });
    } else {
      setForm(emptyForm);
    }
  }, [appointment, prefillStart, prefillEnd]);

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
    const overlaps = (data || []).filter((r) => r.id !== appointment?.id);
    return overlaps.length > 0;
  };

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
        ? { title: form.title, start_datetime: startDatetime, end_datetime: endDatetime, status: form.status, notes: form.notes || null }
        : { status: form.status, notes: form.notes || null };

      const { error } = await supabase.from("appointments").update(updatePayload).eq("id", appointment.id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
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
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
  };

  const handleDelete = async () => {
    if (!appointment) return;
    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Agendamento removido" });
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
  };

  const canEditField = (field: string) => {
    if (!isEditing) return true;
    if (isOwner) return true;
    return field === "status" || field === "notes";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditing ? "Detalhes do agendamento" : "Novo agendamento"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isEditing && appointment?.creator_name && (
            <p className="text-sm text-muted-foreground">Criado por: {appointment.creator_name}</p>
          )}
          <div className="space-y-2">
            <Label>Título <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Ex: Reunião, Corte, Consulta…"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={!canEditField("title")}
            />
          </div>
          <div className="space-y-2">
            <Label>Data <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={!canEditField("date")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início <span className="text-destructive">*</span></Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                disabled={!canEditField("startTime")}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim <span className="text-destructive">*</span></Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                disabled={!canEditField("endTime")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
              disabled={!canEditField("status")}
            >
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
            <Textarea
              placeholder="Notas opcionais…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={!canEditField("notes")}
            />
          </div>
        </div>
        <DialogFooter className="flex items-center gap-2">
          {isEditing && isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-auto">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.title || !form.date || !form.startTime || !form.endTime}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
