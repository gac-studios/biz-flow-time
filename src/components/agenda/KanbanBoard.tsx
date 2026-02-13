import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface Appointment {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  created_by_user_id: string;
  creator_name?: string;
}

interface KanbanBoardProps {
  appointments: Appointment[];
  onStatusChange: (id: string, newStatus: string) => void;
  onCardClick: (a: Appointment) => void;
  canMoveCard: (a: Appointment) => boolean;
}

const columns = [
  { id: "scheduled", label: "Agendado", color: "bg-primary/10 border-primary/30" },
  { id: "confirmed", label: "Confirmado", color: "bg-accent/50 border-accent" },
  { id: "in_progress", label: "Em andamento", color: "bg-warning/10 border-warning/30" },
  { id: "done", label: "Concluído", color: "bg-muted border-muted-foreground/20" },
  { id: "canceled", label: "Cancelado", color: "bg-destructive/10 border-destructive/30" },
  { id: "no_show", label: "Não compareceu", color: "bg-destructive/5 border-destructive/20" },
];

const KanbanBoard = ({ appointments, onStatusChange, onCardClick, canMoveCard }: KanbanBoardProps) => {
  const grouped = columns.map((col) => ({
    ...col,
    items: appointments.filter((a) => a.status === col.id),
  }));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const cardId = result.draggableId;
    const card = appointments.find((a) => a.id === cardId);
    if (!card || card.status === newStatus) return;
    if (!canMoveCard(card)) return;
    onStatusChange(cardId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {grouped.map((col) => (
          <div key={col.id} className={`rounded-xl border p-3 ${col.color} min-h-[160px]`}>
            <h3 className="font-heading text-xs font-semibold mb-3 flex items-center gap-2">
              {col.label}
              <Badge variant="secondary" className="text-xs">{col.items.length}</Badge>
            </h3>
            <Droppable droppableId={col.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[50px]">
                  {col.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!canMoveCard(item)}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                          className={`p-2.5 cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
                          onClick={() => onCardClick(item)}
                        >
                          <p className="font-medium text-xs truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(item.start_datetime), "HH:mm")} – {format(new Date(item.end_datetime), "HH:mm")}
                          </p>
                          {item.creator_name && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">por {item.creator_name}</p>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
