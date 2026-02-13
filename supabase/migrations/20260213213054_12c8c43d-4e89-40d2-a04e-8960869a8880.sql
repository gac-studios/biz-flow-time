
-- 1) Add new status timestamp columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS started_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz NULL;

-- 2) Financial tracking columns
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS price_cents integer NULL,
  ADD COLUMN IF NOT EXISTS paid_cents integer NULL,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS payment_method text NULL;

-- 3) Migrate existing amount_cents to price_cents where price_cents is null
UPDATE public.appointments SET price_cents = amount_cents WHERE price_cents IS NULL AND amount_cents IS NOT NULL;

-- 4) Migrate existing statuses (all current values are valid, just ensure no_show/confirmed/in_progress default)
-- No migration needed since existing rows have valid statuses (scheduled/done/canceled)

-- 5) Create trigger to auto-set status timestamps
CREATE OR REPLACE FUNCTION public.set_appointment_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN NEW.confirmed_at = COALESCE(NEW.confirmed_at, now());
      WHEN 'in_progress' THEN NEW.started_at = COALESCE(NEW.started_at, now());
      WHEN 'done' THEN NEW.completed_at = COALESCE(NEW.completed_at, now());
      WHEN 'canceled' THEN NEW.canceled_at = COALESCE(NEW.canceled_at, now());
      WHEN 'no_show' THEN NEW.no_show_at = COALESCE(NEW.no_show_at, now());
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointment_status_timestamps
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_appointment_status_timestamps();
