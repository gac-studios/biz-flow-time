import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface MemberOption {
  user_id: string;
  full_name: string;
}

interface AgendaFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (v: string[]) => void;
  memberFilter: string;
  onMemberFilterChange: (v: string) => void;
  members: MemberOption[];
  isOwner: boolean;
  showExport?: boolean;
  onExport?: () => void;
}

const statuses = [
  { value: "scheduled", label: "Agendado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluído" },
  { value: "canceled", label: "Cancelado" },
  { value: "no_show", label: "Não compareceu" },
];

const AgendaFilters = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  memberFilter,
  onMemberFilterChange,
  members,
  isOwner,
  showExport,
  onExport,
}: AgendaFiltersProps) => {
  const toggleStatus = (s: string) => {
    if (statusFilter.includes(s)) {
      onStatusFilterChange(statusFilter.filter((x) => x !== s));
    } else {
      onStatusFilterChange([...statusFilter, s]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Buscar por título..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-48 h-9 text-sm"
      />
      <div className="flex items-center gap-1.5">
        {statuses.map((s) => (
          <Badge
            key={s.value}
            variant={statusFilter.includes(s.value) ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => toggleStatus(s.value)}
          >
            {s.label}
          </Badge>
        ))}
        {statusFilter.length > 0 && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onStatusFilterChange([])}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isOwner && members.length > 0 && (
        <Select value={memberFilter} onValueChange={onMemberFilterChange}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Todos colaboradores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.full_name || m.user_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showExport && onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="ml-auto">
          <Download className="h-4 w-4 mr-1.5" /> Exportar CSV
        </Button>
      )}
    </div>
  );
};

export default AgendaFilters;
