import { useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";

export interface CalendarAppointment {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  created_by_user_id: string;
  creator_name?: string;
  amount_cents?: number | null;
  currency?: string;
  client_id?: string | null;
  category?: string | null;
  clients?: { name: string } | null;
}

interface AppointmentCalendarProps {
  appointments: CalendarAppointment[];
  isLoading?: boolean;
  onDateSelect: (start: Date, end: Date) => void;
  onEventClick: (appointment: CalendarAppointment) => void;
  onRangeChange: (start: Date, end: Date) => void;
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  scheduled: { bg: "hsl(217 91% 60% / 0.15)", border: "hsl(217 91% 60%)", text: "hsl(217 91% 60%)" },
  confirmed: { bg: "hsl(250 91% 60% / 0.15)", border: "hsl(250 91% 60%)", text: "hsl(250 91% 60%)" },
  in_progress: { bg: "hsl(45 91% 60% / 0.15)", border: "hsl(45 91% 60%)", text: "hsl(45 91% 40%)" },
  done: { bg: "hsl(152 69% 40% / 0.15)", border: "hsl(152 69% 40%)", text: "hsl(152 69% 40%)" },
  canceled: { bg: "hsl(0 84% 60% / 0.15)", border: "hsl(0 84% 60%)", text: "hsl(0 84% 60%)" },
  no_show: { bg: "hsl(0 84% 60% / 0.25)", border: "hsl(0 84% 60%)", text: "hsl(0 84% 60%)" },
};

const AppointmentCalendar = ({
  appointments,
  isLoading,
  onDateSelect,
  onEventClick,
  onRangeChange,
}: AppointmentCalendarProps) => {
  const calRef = useRef<FullCalendar>(null);

  const events: EventInput[] = appointments.map((a) => {
    const colors = statusColors[a.status] || statusColors.scheduled;
    return {
      id: a.id,
      title: a.title || "Sem título",
      start: a.start_datetime,
      end: a.end_datetime,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { appointment: a },
    };
  });

  const renderEventContent = (eventInfo: any) => {
    const appt = eventInfo.event.extendedProps.appointment as CalendarAppointment;
    return (
      <div className="leading-tight px-0.5 overflow-hidden">
        <div className="text-[0.7rem] font-medium truncate">
          {eventInfo.timeText} {appt.title}
        </div>
        {appt.clients?.name && (
          <div className="text-[0.65rem] font-bold opacity-90 truncate">
            {appt.clients.name}
          </div>
        )}
        {appt.creator_name && (
          <div className="text-[0.6rem] opacity-70 truncate">
            {appt.creator_name}
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = useCallback(
    (info: DateSelectArg) => {
      onDateSelect(info.start, info.end);
      const api = calRef.current?.getApi();
      api?.unselect();
    },
    [onDateSelect]
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const appt = info.event.extendedProps.appointment as CalendarAppointment;
      onEventClick(appt);
    },
    [onEventClick]
  );

  const handleDatesSet = useCallback(
    (info: DatesSetArg) => {
      onRangeChange(info.start, info.end);
    },
    [onRangeChange]
  );

  return (
    <div className={`agenda-calendar ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        buttonText={{
          today: "Hoje",
        }}
        locale="pt-br"
        firstDay={0}
        selectable
        selectMirror
        editable={false}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        height="auto"
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventContent={renderEventContent}
        nowIndicator
        dayMaxEvents={3}
        eventDisplay="block"
      />
    </div>
  );
};

export default AppointmentCalendar;
