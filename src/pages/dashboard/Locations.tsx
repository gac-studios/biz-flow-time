import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mockLocations = [
  { id: 1, name: "Unidade Centro", address: "Rua Augusta, 1500 — São Paulo, SP" },
];

const Locations = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Locais / Unidades</h1>
        <p className="text-muted-foreground">{mockLocations.length}/1 cadastrados (Plano Básico)</p>
      </div>
      <Dialog>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo local</Button></DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Novo local</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Ex: Unidade Centro" /></div>
            <div className="space-y-2"><Label>Endereço</Label><Input placeholder="Rua, número — Cidade, UF" /></div>
            <Button className="w-full">Salvar local</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Local</TableHead>
              <TableHead>Endereço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLocations.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {l.name}</TableCell>
                <TableCell className="text-muted-foreground">{l.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default Locations;
