
-- Add title column to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

-- Add validation trigger for end_datetime > start_datetime
CREATE OR REPLACE FUNCTION public.validate_appointment_times()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.end_datetime <= NEW.start_datetime THEN
    RAISE EXCEPTION 'end_datetime must be after start_datetime';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_appointment_times
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_times();

-- Add check constraint on status
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('scheduled', 'done', 'canceled'));

-- Drop existing RLS policies and recreate them properly
DROP POLICY IF EXISTS "Members can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners can delete any appointment" ON public.appointments;
DROP POLICY IF EXISTS "Owners can update any appointment" ON public.appointments;
DROP POLICY IF EXISTS "Owners see all company appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff see own appointments" ON public.appointments;

-- Owner: full access for their company
CREATE POLICY "Owners see all company appointments"
ON public.appointments FOR SELECT
USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Owners can insert appointments"
ON public.appointments FOR INSERT
WITH CHECK (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Owners can update any appointment"
ON public.appointments FOR UPDATE
USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Owners can delete any appointment"
ON public.appointments FOR DELETE
USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

-- Staff: limited access
CREATE POLICY "Staff see own appointments"
ON public.appointments FOR SELECT
USING (created_by_user_id = auth.uid() AND has_company_role(auth.uid(), company_id, 'staff'::app_role));

CREATE POLICY "Staff can insert own appointments"
ON public.appointments FOR INSERT
WITH CHECK (created_by_user_id = auth.uid() AND has_company_role(auth.uid(), company_id, 'staff'::app_role));

CREATE POLICY "Staff can update own appointments"
ON public.appointments FOR UPDATE
USING (created_by_user_id = auth.uid() AND has_company_role(auth.uid(), company_id, 'staff'::app_role));
