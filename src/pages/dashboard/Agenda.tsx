import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const hours = Array.from({ length: 12 }, (_, i) => i + 8);
const days = ["Seg 10", "Ter 11", "Qua 12", "Qui 13", "Sex 14", "Sáb 15"];

const mockAppts = [
  { day: 0, hour: 9, client: "João Silva", service: "Corte" },
  { day: 0, hour: 11, client: "Maria Santos", service: "Barba" },
  { day: 1, hour: 14, client: "Pedro Costa", service: "Corte + Barba" },
  { day: 2, hour: 9, client: "Ana Lima", service: "Corte feminino" },
  { day: 3, hour: 10, client: "Lucas Oliveira", service: "Barba" },
  { day: 4, hour: 15, client: "Fernanda Souza", service: "Hidratação" },
  { day: 5, hour: 9, client: "Roberto Alves", service: "Corte" },
  { day: 5, hour: 11, client: "Clara Dias", service: "Barba" },
];

const Agenda = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2 mt-1">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">10 — 15 Fev 2026</span>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button><Plus className="mr-2 h-4 w-4" /> Novo agendamento</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Novo agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input placeholder="Nome do cliente" />
            </div>
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corte">Corte</SelectItem>
                  <SelectItem value="barba">Barba</SelectItem>
                  <SelectItem value="corte-barba">Corte + Barba</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="carlos">Carlos</SelectItem>
                  <SelectItem value="ana">Ana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input placeholder="Notas opcionais" />
            </div>
            <Button className="w-full">Criar agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            <div className="p-3 text-xs text-muted-foreground font-medium">Horário</div>
            {days.map((d) => (
              <div key={d} className="p-3 text-sm font-medium text-center border-l border-border/50">{d}</div>
            ))}
          </div>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-7 border-b border-border/30 min-h-[56px]">
              <div className="p-2 text-xs text-muted-foreground flex items-start pt-3">{hour.toString().padStart(2, "0")}:00</div>
              {days.map((_, dayIdx) => {
                const appt = mockAppts.find((a) => a.day === dayIdx && a.hour === hour);
                return (
                  <div key={dayIdx} className="p-1 border-l border-border/30">
                    {appt && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs cursor-pointer hover:bg-primary/15 transition-colors">
                        <p className="font-medium text-primary truncate">{appt.client}</p>
                        <p className="text-muted-foreground truncate">{appt.service}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

export default Agenda;
