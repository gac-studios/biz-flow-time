
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');

-- 2. Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  phone TEXT,
  segment TEXT,
  city TEXT,
  state TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  default_interval_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Memberships
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 5. Helper: get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.memberships
  WHERE user_id = _user_id AND active = true
  LIMIT 1;
$$;

-- 6. Helper: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND role = _role AND active = true
  );
$$;

-- 7. Helper: check role within specific company
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id AND role = _role AND active = true
  );
$$;

-- 8. Helper: is member of company
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id AND active = true
  );
$$;

-- 9. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS POLICIES ============

-- COMPANIES
CREATE POLICY "Members can view their company"
  ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id));

CREATE POLICY "Owners can insert companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can update their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.has_company_role(auth.uid(), id, 'owner'));

CREATE POLICY "Owners can delete their company"
  ON public.companies FOR DELETE TO authenticated
  USING (public.has_company_role(auth.uid(), id, 'owner'));

-- MEMBERSHIPS
CREATE POLICY "Members can view company memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Owners can insert memberships"
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Owners can update memberships"
  ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Owners can delete memberships"
  ON public.memberships FOR DELETE TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'owner'));

-- APPOINTMENTS
CREATE POLICY "Owners see all company appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Staff see own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    created_by_user_id = auth.uid()
    AND public.has_company_role(auth.uid(), company_id, 'staff')
  );

CREATE POLICY "Members can insert appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_member(auth.uid(), company_id)
    AND created_by_user_id = auth.uid()
  );

CREATE POLICY "Owners can update any appointment"
  ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Staff can update own appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (
    created_by_user_id = auth.uid()
    AND public.has_company_role(auth.uid(), company_id, 'staff')
  );

CREATE POLICY "Owners can delete any appointment"
  ON public.appointments FOR DELETE TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'owner'));

-- Special: allow owner to insert their own membership during onboarding
CREATE POLICY "Users can insert own owner membership"
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'owner');
