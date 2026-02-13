export const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Agendado", variant: "default" },
  confirmed: { label: "Confirmado", variant: "outline" },
  in_progress: { label: "Em andamento", variant: "outline" },
  done: { label: "Concluído", variant: "secondary" },
  canceled: { label: "Cancelado", variant: "destructive" },
  no_show: { label: "Não compareceu", variant: "destructive" },
};

export const paymentStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "secondary" },
  waived: { label: "Isento", variant: "default" },
};

export const allStatuses = Object.entries(statusMap).map(([value, { label }]) => ({ value, label }));

export const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
