import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);

    useEffect(() => {
        // Check if we have a valid session (which happens after clicking the email link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                toast({
                    title: "Link inválido ou expirado",
                    description: "Por favor, solicite uma nova redefinição de senha.",
                    variant: "destructive",
                });
                navigate("/login");
            } else {
                setSessionChecked(true);
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Senhas não conferem", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" });
            setLoading(false);
        } else {
            toast({ title: "Senha atualizada com sucesso!", description: "Você já pode acessar sua conta." });
            navigate("/login");
        }
    };

    if (!sessionChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
            <Card className="w-full max-w-md animate-fade-in">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="font-heading text-2xl">Redefinir Senha</CardTitle>
                    <CardDescription>Digite sua nova senha abaixo</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Redefinir Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;
