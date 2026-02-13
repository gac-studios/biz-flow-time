import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  scheduled: { label: "Agendado", variant: "default" },
  done: { label: "Concluído", variant: "secondary" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

const StaffAppointments = () => {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["staff-appointments", user?.id],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("company_id", companyId)
        .eq("created_by_user_id", user.id)
        .order("start_datetime", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!companyId,
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Marcado como ${statusMap[status]?.label || status}` });
    queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold">Meus Agendamentos</h1>
        <p className="text-muted-foreground">{appointments.length} agendamento(s)</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {appointments.map((a) => {
                const s = statusMap[a.status] || statusMap.scheduled;
                return (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{a.title || "Sem título"}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(a.start_datetime), "dd/MM/yyyy", { locale: ptBR })} • {format(new Date(a.start_datetime), "HH:mm")} – {format(new Date(a.end_datetime), "HH:mm")}
                      </p>
                      {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      {a.status === "scheduled" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "done")}>Concluir</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "canceled")}>Cancelar</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAppointments;
