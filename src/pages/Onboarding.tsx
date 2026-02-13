import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const segments = ["Barbearia", "Estética", "Clínica", "Consultório", "Transporte", "Academia", "Outro"];
const timezones = ["America/Sao_Paulo", "America/Manaus", "America/Bahia", "America/Fortaleza", "America/Recife"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    companyName: "", segment: "", phone: "", city: "", state: "", timezone: "America/Sao_Paulo", slug: "",
  });

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data: result, error } = await supabase.rpc("create_company_with_owner", {
      _name: data.companyName,
      _slug: data.slug || null,
      _phone: data.phone || null,
      _segment: data.segment || null,
      _city: data.city || null,
      _state: data.state || null,
      _timezone: data.timezone,
    });

    if (error) {
      toast({ title: "Erro ao criar empresa", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Empresa criada!", description: "Bem-vindo ao AgendaPro." });
    // Small delay to let auth context refresh membership
    setTimeout(() => navigate("/dashboard"), 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 font-heading text-xl font-bold text-primary mb-2">
            <Calendar className="h-6 w-6" /> AgendaPro
          </div>
          <CardTitle className="font-heading text-2xl">Configure sua empresa</CardTitle>
          <CardDescription>Passo {step + 1} de 3</CardDescription>
          <div className="flex gap-2 justify-center mt-4">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-2 w-16 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Nome da empresa</Label>
                <Input placeholder="Ex: Barbearia Premium" value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select value={data.segment} onValueChange={(v) => setData({ ...data, segment: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o segmento" /></SelectTrigger>
                  <SelectContent>{segments.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-9999" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input placeholder="São Paulo" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input placeholder="SP" maxLength={2} value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fuso horário</Label>
                <Select value={data.timezone} onValueChange={(v) => setData({ ...data, timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Slug (link público)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">agendapro.com/c/</span>
                  <Input placeholder="minha-empresa" value={data.slug} onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })} />
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <h4 className="font-heading font-semibold text-sm">Resumo</h4>
                <p className="text-sm"><span className="text-muted-foreground">Empresa:</span> {data.companyName || "—"}</p>
                <p className="text-sm"><span className="text-muted-foreground">Segmento:</span> {data.segment || "—"}</p>
                <p className="text-sm"><span className="text-muted-foreground">Local:</span> {data.city || "—"}{data.state ? `, ${data.state}` : ""}</p>
                <p className="text-sm"><span className="text-muted-foreground">Link:</span> /c/{data.slug || "—"}</p>
              </div>
            </div>
          )}
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)}>Próximo <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={handleCreate} disabled={loading || !data.companyName}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar empresa <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
