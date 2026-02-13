import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const SettingsPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="font-heading text-2xl font-bold">Configurações</h1>
      <p className="text-muted-foreground">Ajuste as configurações da sua empresa</p>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Dados da empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Nome da empresa</Label><Input defaultValue="Barbearia Exemplo" /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input defaultValue="(11) 99999-0000" /></div>
          <div className="space-y-2"><Label>Slug (link público)</Label><Input defaultValue="barbearia-exemplo" /></div>
          <div className="space-y-2">
            <Label>Intervalo padrão (minutos)</Label>
            <Select defaultValue="30">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Salvar alterações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Horário de funcionamento</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {weekdays.map((day) => (
            <div key={day} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium w-24">{day}</span>
              <div className="flex items-center gap-2 flex-1">
                <Input type="time" defaultValue={day === "Domingo" ? "" : "09:00"} className="w-24" disabled={day === "Domingo"} />
                <span className="text-muted-foreground text-sm">às</span>
                <Input type="time" defaultValue={day === "Domingo" ? "" : "18:00"} className="w-24" disabled={day === "Domingo"} />
              </div>
              <Switch defaultChecked={day !== "Domingo"} />
            </div>
          ))}
          <Button className="mt-4">Salvar horários</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Permissões</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Staff pode ver agenda completa?</p>
              <p className="text-xs text-muted-foreground">Se desativado, staff vê apenas própria agenda</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default SettingsPage;
