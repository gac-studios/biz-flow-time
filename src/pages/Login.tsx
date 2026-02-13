import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type LoginMode = "admin" | "staff";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<LoginMode>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("active", true)
        .limit(1)
        .single();

      const userRole = membership?.role;

      if (mode === "admin" && userRole === "staff") {
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Esta conta é de colaborador. Entre na aba Colaborador.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (mode === "staff" && userRole === "owner") {
        toast({
          title: "Conta de administrador",
          description: "Você é administrador. Redirecionando ao painel.",
        });
        navigate("/dashboard");
      } else if (userRole === "staff") {
        navigate("/staff");
      } else if (userRole === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
    setLoading(false);
  };

  const helperText =
    mode === "admin"
      ? "Acesso completo ao painel da empresa."
      : "Acesso apenas para marcar horários e ver os seus agendamentos.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 font-heading text-xl font-bold text-primary mb-2">
            <Calendar className="h-6 w-6" /> AgendaPro
          </Link>
          <CardTitle className="font-heading text-2xl">Entrar na sua conta</CardTitle>
          <CardDescription>Selecione seu tipo de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff">Colaborador</TabsTrigger>
              <TabsTrigger value="admin">Administrador</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-center text-muted-foreground -mt-2">{helperText}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => toast({ title: "Em breve", description: "Funcionalidade de recuperação de senha será implementada." })}
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
