import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionColors: Record<string, "default" | "secondary" | "destructive"> = {
  APPT_CREATED: "default",
  APPT_UPDATED: "secondary",
  APPT_STATUS_CHANGED: "secondary",
  APPT_DELETED: "destructive",
};

const AuditPage = () => {
  const { companyId } = useAuth();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((l) => l.actor_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || p.email]));

      return data.map((l) => ({
        ...l,
        actor_name: profileMap.get(l.actor_user_id) || l.actor_user_id.slice(0, 8),
      }));
    },
    enabled: !!companyId,
  });

  const filtered = logs.filter((l) => {
    if (actionFilter !== "all" && !l.action.startsWith(actionFilter)) return false;
    if (search && !l.actor_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold">Auditoria</h1>
        <p className="text-muted-foreground">Registro de ações realizadas nos agendamentos</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar por colaborador..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo de ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="APPT_CREATED">Criação</SelectItem>
            <SelectItem value="APPT_UPDATED">Edição</SelectItem>
            <SelectItem value="APPT_STATUS">Mudança de status</SelectItem>
            <SelectItem value="APPT_DELETED">Exclusão</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="hidden md:table-cell">Entidade</TableHead>
                  <TableHead className="hidden lg:table-cell">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => {
                  const detail = log.action === "APPT_STATUS_CHANGED"
                    ? `${(log.before as any)?.status} → ${(log.after as any)?.status}`
                    : log.action === "APPT_CREATED"
                    ? (log.after as any)?.title || ""
                    : log.action === "APPT_DELETED"
                    ? (log.before as any)?.title || ""
                    : (log.after as any)?.title || "";
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{log.actor_name}</TableCell>
                      <TableCell>
                        <Badge variant={actionColors[log.action] || "secondary"}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {log.entity_type} #{log.entity_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                        {detail}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPage;
