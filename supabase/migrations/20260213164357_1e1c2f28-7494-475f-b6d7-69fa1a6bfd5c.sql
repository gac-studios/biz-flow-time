
-- 1. Create clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Owner full CRUD
CREATE POLICY "Owners can select clients"
  ON public.clients FOR SELECT
  USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Owners can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Owners can update clients"
  ON public.clients FOR UPDATE
  USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

CREATE POLICY "Owners can delete clients"
  ON public.clients FOR DELETE
  USING (has_company_role(auth.uid(), company_id, 'owner'::app_role));

-- Staff read-only clients (useful for linking)
CREATE POLICY "Staff can read clients"
  ON public.clients FOR SELECT
  USING (has_company_role(auth.uid(), company_id, 'staff'::app_role));

CREATE INDEX idx_clients_company ON public.clients(company_id);

-- 2. Add columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN amount_cents integer NULL,
  ADD COLUMN currency text NOT NULL DEFAULT 'BRL',
  ADD COLUMN client_id uuid NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN category text NULL;

CREATE INDEX idx_appointments_client ON public.appointments(client_id);
