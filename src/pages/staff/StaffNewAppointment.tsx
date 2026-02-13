import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppointmentDialog from "@/components/agenda/AppointmentDialog";

const StaffNewAppointment = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillStart, setPrefillStart] = useState<Date | null>(null);

  const handleOpen = () => {
    // Round to next 30 min slot
    const now = new Date();
    const minutes = now.getMinutes();
    const rounded = new Date(now);
    rounded.setMinutes(minutes > 30 ? 60 : 30, 0, 0);
    setPrefillStart(rounded);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-6">
      <h1 className="font-heading text-2xl font-bold">Marcar Horário</h1>

      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground text-center">
            Clique abaixo para criar um novo agendamento.
          </p>
          <Button onClick={handleOpen} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo agendamento
          </Button>
        </CardContent>
      </Card>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={null}
        prefillStart={prefillStart}
        mode="staff"
        queryKeyPrefix="staff-appointments"
        readOnly={false}
        onSuccess={() => navigate("/staff")}
      />
    </div>
  );
};

export default StaffNewAppointment;
