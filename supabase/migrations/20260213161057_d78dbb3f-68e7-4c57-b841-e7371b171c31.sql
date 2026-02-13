
-- =============================================
-- A) AUDIT LOGS TABLE + RLS + TRIGGERS
-- =============================================

-- 1. Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'appointments',
  entity_id uuid NOT NULL,
  before jsonb NULL,
  after jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies - owner sees all company logs, staff sees own logs only
CREATE POLICY "Owners can view company audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Staff can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (actor_user_id = auth.uid() AND has_company_role(auth.uid(), company_id, 'staff'::app_role));

-- No INSERT/UPDATE/DELETE policies for users - only triggers insert

-- 4. Trigger function for audit logging on appointments
CREATE OR REPLACE FUNCTION public.log_appointment_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid;
  _action text;
BEGIN
  -- Get current user from JWT
  _actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    _action := 'APPT_CREATED';
    INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id, after)
    VALUES (NEW.company_id, COALESCE(_actor, NEW.created_by_user_id), _action, 'appointments', NEW.id, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND
       OLD.title = NEW.title AND OLD.start_datetime = NEW.start_datetime AND OLD.end_datetime = NEW.end_datetime AND OLD.notes IS NOT DISTINCT FROM NEW.notes THEN
      _action := 'APPT_STATUS_CHANGED';
    ELSE
      _action := 'APPT_UPDATED';
    END IF;
    INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id, before, after)
    VALUES (NEW.company_id, COALESCE(_actor, NEW.created_by_user_id), _action, 'appointments', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    _action := 'APPT_DELETED';
    INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id, before)
    VALUES (OLD.company_id, COALESCE(_actor, OLD.created_by_user_id), _action, 'appointments', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- 5. Attach trigger to appointments
CREATE TRIGGER trg_audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.log_appointment_audit();

-- =============================================
-- D) CONFLICT BLOCKING - OVERLAP PREVENTION TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE company_id = NEW.company_id
      AND created_by_user_id = NEW.created_by_user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status != 'canceled'
      AND NEW.start_datetime < end_datetime
      AND NEW.end_datetime > start_datetime
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: já existe um agendamento nesse período.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_overlap
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_appointment_overlap();

-- Index for overlap checks
CREATE INDEX idx_appointments_overlap
  ON public.appointments (company_id, created_by_user_id, start_datetime, end_datetime)
  WHERE status != 'canceled';
