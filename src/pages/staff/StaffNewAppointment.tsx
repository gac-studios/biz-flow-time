import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const StaffNewAppointment = () => {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyId || !form.date || !form.startTime || !form.endTime) return;

    setLoading(true);
    const startDatetime = `${form.date}T${form.startTime}:00`;
    const endDatetime = `${form.date}T${form.endTime}:00`;

    const { error } = await supabase.from("appointments").insert({
      company_id: companyId,
      created_by_user_id: user.id,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      notes: form.notes || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar agendamento", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Agendamento criado!" });
    navigate("/staff");
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h1 className="font-heading text-2xl font-bold mb-6">Marcar Horário</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Data <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fim <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Notas opcionais..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Criar agendamento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffNewAppointment;
