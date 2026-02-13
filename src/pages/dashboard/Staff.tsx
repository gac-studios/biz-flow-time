import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockStaff = [
  { id: 1, name: "Carlos Mendes", role: "Barbeiro", email: "carlos@email.com", memberRole: "staff", active: true },
  { id: 2, name: "Ana Souza", role: "Esteticista", email: "ana@email.com", memberRole: "staff", active: true },
];

const Staff = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Colaboradores</h1>
        <p className="text-muted-foreground">{mockStaff.length}/2 cadastrados (Plano Básico)</p>
      </div>
      <Dialog>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo colaborador</Button></DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Novo colaborador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome completo" /></div>
            <div className="space-y-2"><Label>E-mail (login)</Label><Input type="email" placeholder="email@exemplo.com" /></div>
            <div className="space-y-2"><Label>Função</Label><Input placeholder="Ex: Barbeiro" /></div>
            <div className="space-y-2">
              <Label>Papel no sistema</Label>
              <Select defaultValue="staff">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">O colaborador receberá um convite por e-mail para definir sua senha.</p>
            <Button className="w-full">Convidar colaborador</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="hidden sm:table-cell">E-mail</TableHead>
              <TableHead className="text-center">Papel</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockStaff.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.role}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{s.email}</TableCell>
                <TableCell className="text-center"><Badge variant="outline">{s.memberRole}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativo" : "Inativo"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default Staff;
