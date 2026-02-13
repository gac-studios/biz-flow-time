
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles of their company members
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners can read company member profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m1
    JOIN public.memberships m2 ON m1.company_id = m2.company_id
    WHERE m1.user_id = auth.uid() AND m1.role = 'owner' AND m1.active = true
      AND m2.user_id = profiles.user_id AND m2.active = true
  )
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Service role inserts profiles (via edge function)
-- No INSERT policy needed for regular users

-- 2. Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Fix memberships SELECT: staff sees only own row, owners see all company
DROP POLICY IF EXISTS "Members can view company memberships" ON public.memberships;

CREATE POLICY "Owners can view company memberships"
ON public.memberships FOR SELECT
TO authenticated
USING (has_company_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Staff can view own membership"
ON public.memberships FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4. Add safety: prevent deleting owner memberships via a trigger
CREATE OR REPLACE FUNCTION public.prevent_owner_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner' THEN
    -- Check if this is the last owner of the company
    IF NOT EXISTS (
      SELECT 1 FROM public.memberships
      WHERE company_id = OLD.company_id AND role = 'owner' AND active = true AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot remove the last owner of a company';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_owner_deletion_trigger
BEFORE DELETE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.prevent_owner_deletion();

-- 5. Prevent role escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owners can change roles, and they can't make themselves non-owner if last owner
  IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
    IF NOT has_company_role(auth.uid(), NEW.company_id, 'owner') THEN
      RAISE EXCEPTION 'Only owners can promote to owner role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_role_escalation_trigger
BEFORE UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();
