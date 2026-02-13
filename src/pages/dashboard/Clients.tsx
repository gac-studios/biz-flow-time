import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const mockClients = [
  { id: 1, name: "João Silva", phone: "(11) 99999-1111", email: "joao@email.com", appointments: 12 },
  { id: 2, name: "Maria Santos", phone: "(11) 99999-2222", email: "maria@email.com", appointments: 8 },
  { id: 3, name: "Pedro Costa", phone: "(11) 99999-3333", email: "pedro@email.com", appointments: 5 },
  { id: 4, name: "Ana Lima", phone: "(11) 99999-4444", email: "ana@email.com", appointments: 15 },
  { id: 5, name: "Lucas Oliveira", phone: "(11) 99999-5555", email: "lucas@email.com", appointments: 3 },
  { id: 6, name: "Fernanda Souza", phone: "(11) 99999-6666", email: "fernanda@email.com", appointments: 7 },
];

const Clients = () => {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">{mockClients.length}/20 cadastrados (Plano Básico)</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo cliente</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Novo cliente</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome completo" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 99999-9999" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" /></div>
              <div className="space-y-2"><Label>Observações</Label><Input placeholder="Notas opcionais" /></div>
              <Button className="w-full">Salvar cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="text-center">Agendamentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{c.appointments}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
