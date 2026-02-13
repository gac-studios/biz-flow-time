import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Check, Clock, MapPin, Phone } from "lucide-react";

const services = [
  { id: "1", name: "Corte masculino", duration: "30 min", price: "R$ 45,00" },
  { id: "2", name: "Barba", duration: "20 min", price: "R$ 30,00" },
  { id: "3", name: "Corte + Barba", duration: "45 min", price: "R$ 65,00" },
  { id: "4", name: "Hidratação", duration: "40 min", price: "R$ 50,00" },
];

const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

const PublicBooking = () => {
  const { slug } = useParams();
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">Agendamento confirmado!</h2>
            <p className="text-muted-foreground mb-4">Você receberá uma confirmação por e-mail.</p>
            <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1 text-left">
              <p><span className="text-muted-foreground">Serviço:</span> {services.find((s) => s.id === selectedService)?.name}</p>
              <p><span className="text-muted-foreground">Data:</span> 14/02/2026</p>
              <p><span className="text-muted-foreground">Horário:</span> {selectedTime}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Company header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Barbearia Exemplo</h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> São Paulo, SP</span>
            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> (11) 99999-0000</span>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 justify-center mb-8">
          {["Serviço", "Horário", "Dados"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-border hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 0 && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="font-heading text-lg font-semibold mb-4">Escolha o serviço</h2>
            {services.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-all ${selectedService === s.id ? "border-primary shadow-md" : "border-border/50 hover:border-primary/50"}`}
                onClick={() => setSelectedService(s.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> {s.duration}</p>
                  </div>
                  <span className="font-heading font-semibold text-primary">{s.price}</span>
                </CardContent>
              </Card>
            ))}
            <Button className="w-full mt-4" disabled={!selectedService} onClick={() => setStep(1)}>Continuar</Button>
          </div>
        )}

        {/* Step 2: Time */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-lg font-semibold mb-4">Escolha o horário — 14/02/2026</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {timeSlots.map((t) => (
                <Button
                  key={t}
                  variant={selectedTime === t ? "default" : "outline"}
                  className={selectedTime === t ? "gradient-primary border-0" : ""}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(0)}>Voltar</Button>
              <Button className="flex-1" disabled={!selectedTime} onClick={() => setStep(2)}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact info */}
        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader><CardTitle className="font-heading">Seus dados</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input placeholder="Seu nome completo" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 99999-9999" /></div>
              <div className="space-y-2"><Label>E-mail (opcional)</Label><Input type="email" placeholder="seu@email.com" /></div>
              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-muted-foreground">Serviço:</span> {services.find((s) => s.id === selectedService)?.name}</p>
                <p><span className="text-muted-foreground">Horário:</span> {selectedTime}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1" onClick={() => setConfirmed(true)}>Confirmar agendamento</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
