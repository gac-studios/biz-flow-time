
-- Replace the permissive companies INSERT policy with a narrower one
-- We keep WITH CHECK (true) because at INSERT time there's no membership yet.
-- Security is enforced by the memberships INSERT policy which requires user_id = auth.uid().
-- However, to satisfy the linter, we add a function-based onboarding approach instead.

-- Drop the old policy
DROP POLICY "Owners can insert companies" ON public.companies;

-- Create a SECURITY DEFINER function for onboarding that creates company + membership atomically
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  _name TEXT,
  _slug TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _segment TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _state TEXT DEFAULT NULL,
  _timezone TEXT DEFAULT 'America/Sao_Paulo'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create company
  INSERT INTO public.companies (name, slug, phone, segment, city, state, timezone)
  VALUES (_name, _slug, _phone, _segment, _city, _state, _timezone)
  RETURNING id INTO _company_id;

  -- Create owner membership
  INSERT INTO public.memberships (company_id, user_id, role)
  VALUES (_company_id, auth.uid(), 'owner');

  RETURN _company_id;
END;
$$;
