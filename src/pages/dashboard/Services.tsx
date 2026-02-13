import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Scissors } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const mockServices = [
  { id: 1, name: "Corte masculino", duration: 30, price: 4500, active: true },
  { id: 2, name: "Barba", duration: 20, price: 3000, active: true },
  { id: 3, name: "Corte + Barba", duration: 45, price: 6500, active: true },
  { id: 4, name: "Hidratação", duration: 40, price: 5000, active: true },
  { id: 5, name: "Sobrancelha", duration: 15, price: 2000, active: false },
];

const Services = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Serviços</h1>
        <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
      </div>
      <Dialog>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo serviço</Button></DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Novo serviço</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Ex: Corte masculino" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duração (min)</Label><Input type="number" placeholder="30" /></div>
              <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" placeholder="45,00" /></div>
            </div>
            <Button className="w-full">Salvar serviço</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockServices.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-muted-foreground" /> {s.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.duration} min</TableCell>
                <TableCell className="text-muted-foreground">R$ {(s.price / 100).toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default Services;
