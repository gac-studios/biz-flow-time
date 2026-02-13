import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockLogs = [
  { date: "13/02/2026 09:15", actor: "Carlos Mendes", action: "APPOINTMENT_CREATED", entity: "Agendamento #127", detail: "Cliente: João Silva — Corte" },
  { date: "13/02/2026 09:10", actor: "Admin (Você)", action: "CLIENT_CREATED", entity: "Cliente #6", detail: "Fernanda Souza cadastrada" },
  { date: "12/02/2026 17:45", actor: "Ana Souza", action: "APPOINTMENT_UPDATED", entity: "Agendamento #125", detail: "Status: confirmado → concluído" },
  { date: "12/02/2026 14:20", actor: "Admin (Você)", action: "SERVICE_UPDATED", entity: "Serviço #3", detail: "Preço: R$60 → R$65" },
  { date: "12/02/2026 10:00", actor: "Carlos Mendes", action: "APPOINTMENT_CANCELED", entity: "Agendamento #122", detail: "Motivo: Cliente não compareceu" },
  { date: "11/02/2026 16:30", actor: "Admin (Você)", action: "STAFF_CREATED", entity: "Colaborador #2", detail: "Ana Souza convidada como staff" },
];

const actionColors: Record<string, string> = {
  APPOINTMENT_CREATED: "default",
  APPOINTMENT_UPDATED: "secondary",
  APPOINTMENT_CANCELED: "destructive",
  CLIENT_CREATED: "default",
  SERVICE_UPDATED: "secondary",
  STAFF_CREATED: "default",
};

const AuditPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="font-heading text-2xl font-bold">Auditoria / Histórico</h1>
      <p className="text-muted-foreground">Registro de todas as ações realizadas no sistema</p>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
      <Input placeholder="Buscar por colaborador..." className="max-w-xs" />
      <Select>
        <SelectTrigger className="w-48"><SelectValue placeholder="Tipo de ação" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="appointment">Agendamentos</SelectItem>
          <SelectItem value="client">Clientes</SelectItem>
          <SelectItem value="service">Serviços</SelectItem>
          <SelectItem value="staff">Colaboradores</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead className="hidden md:table-cell">Item</TableHead>
              <TableHead className="hidden lg:table-cell">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLogs.map((log, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{log.date}</TableCell>
                <TableCell className="font-medium text-sm">{log.actor}</TableCell>
                <TableCell>
                  <Badge variant={actionColors[log.action] as "default" | "secondary" | "destructive"}>
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.entity}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{log.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default AuditPage;
