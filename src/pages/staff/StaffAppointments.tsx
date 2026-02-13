import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StaffAppointments = () => {
  const { user, companyId } = useAuth();

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

  const statusMap: Record<string, string> = {
    scheduled: "Agendado",
    completed: "Concluído",
    cancelled: "Cancelado",
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {format(new Date(a.start_datetime), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(a.start_datetime), "HH:mm")} – {format(new Date(a.end_datetime), "HH:mm")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={a.status === "scheduled" ? "default" : "secondary"}>
                        {statusMap[a.status] || a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {a.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAppointments;
