import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppointmentCalendar, { type CalendarAppointment } from "@/components/agenda/AppointmentCalendar";
import AppointmentDialog from "@/components/agenda/AppointmentDialog";

const StaffAppointments = () => {
  const { user, companyId } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [prefillStart, setPrefillStart] = useState<Date | null>(null);
  const [prefillEnd, setPrefillEnd] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date>(new Date());
  const [rangeEnd, setRangeEnd] = useState<Date>(new Date());

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["staff-appointments", user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(name)")
        .eq("company_id", companyId)
        .eq("created_by_user_id", user.id)
        .gte("start_datetime", rangeStart.toISOString())
        .lte("start_datetime", rangeEnd.toISOString())
        .order("start_datetime", { ascending: true });
      if (error) throw error;
      return (data || []).map((a) => ({
        ...a,
        creator_name: undefined,
        clients: a.clients // ensure this is passed through
      })) as unknown as CalendarAppointment[];
    },
    enabled: !!user && !!companyId,
  });

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

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Minha Agenda</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          onDateSelect={() => { }}
          onEventClick={handleEventClick}
          onRangeChange={handleRangeChange}
        />
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        prefillStart={prefillStart}
        prefillEnd={prefillEnd}
        mode="staff"
        queryKeyPrefix="staff-appointments"
        readOnly={true}
      />
    </div>
  );
};

export default StaffAppointments;
