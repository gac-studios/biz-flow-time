import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  membership_id: string;
  user_id: string;
  role: string;
  active: boolean;
  full_name: string | null;
  email: string | null;
}

const Staff = () => {
  const { companyId, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({ email: "", full_name: "", role_function: "" });
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [tempPassword, setTempPassword] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["staff-members", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.rpc("get_company_members_secure");
      if (error) throw error;
      return ((data as any[]) || [])
        .filter((m: any) => m.role === "staff")
        .map((m: any) => ({
          membership_id: m.membership_id,
          user_id: m.user_id,
          role: m.role,
          active: m.active,
          full_name: m.full_name,
          email: m.email,
        })) as StaffMember[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setCreating(true);
      const { data, error } = await supabase.functions.invoke("create-staff", {
        body: {
          email: newStaff.email,
          full_name: newStaff.full_name,
          role_function: newStaff.role_function,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Colaborador criado!", description: `Senha temporária: ${data.temp_password}` });
      setTempPassword(data.temp_password);
      setNewStaff({ email: "", full_name: "", role_function: "" });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setCreating(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setCreating(false);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ membership_id, active }: { membership_id: string; active: boolean }) => {
      const { error } = await supabase
        .from("memberships")
        .update({ active })
        .eq("id", membership_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast({ title: "Status atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (membership_id: string) => {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", membership_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast({ title: "Colaborador removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleEdit = (member: StaffMember) => {
    setEditingMember(member);
    setEditName(member.full_name || "");
    setEditActive(member.active);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingMember) return;

    // Update profile name
    if (editName !== editingMember.full_name) {
      await supabase
        .from("profiles")
        .update({ full_name: editName })
        .eq("user_id", editingMember.user_id);
    }

    // Update active status
    if (editActive !== editingMember.active) {
      await supabase
        .from("memberships")
        .update({ active: editActive })
        .eq("id", editingMember.membership_id);
    }

    queryClient.invalidateQueries({ queryKey: ["staff-members"] });
    toast({ title: "Colaborador atualizado" });
    setEditOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">{members.length} cadastrados</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setTempPassword(""); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo colaborador</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Novo colaborador</DialogTitle>
            </DialogHeader>
            {tempPassword ? (
              <div className="space-y-4">
                <p className="text-sm">Colaborador criado com sucesso! Compartilhe a senha temporária:</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm select-all text-center">
                  {tempPassword}
                </div>
                <p className="text-xs text-muted-foreground">O colaborador deve alterar a senha no primeiro acesso.</p>
                <DialogClose asChild>
                  <Button className="w-full" variant="outline">Fechar</Button>
                </DialogClose>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Nome completo"
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail (login) <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input
                    placeholder="Ex: Barbeiro"
                    value={newStaff.role_function}
                    onChange={(e) => setNewStaff({ ...newStaff, role_function: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Uma senha temporária será gerada. Compartilhe com o colaborador para o primeiro acesso.
                </p>
                <Button
                  className="w-full"
                  onClick={() => createMutation.mutate()}
                  disabled={creating || !newStaff.email || !newStaff.full_name}
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Criar colaborador
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum colaborador cadastrado.</p>
              <p className="text-sm mt-1">Clique em "Novo colaborador" para adicionar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {members.map((m) => (
                  <TableRow key={m.membership_id}>
                    <TableCell className="font-medium">
                      {m.full_name || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {m.email || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={m.active ? "default" : "secondary"}>
                        {m.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o acesso de {m.full_name || "este colaborador"} à empresa. Essa ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(m.membership_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
