
-- 1. Drop email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. Create secure RPC: owner-only access to member emails (reads from auth.users)
CREATE OR REPLACE FUNCTION public.get_company_members_secure()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  role text,
  active boolean,
  membership_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id uuid;
  _company_id uuid;
BEGIN
  _caller_id := auth.uid();
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get caller's company and verify owner role
  SELECT m.company_id INTO _company_id
  FROM public.memberships m
  WHERE m.user_id = _caller_id AND m.role = 'owner' AND m.active = true
  LIMIT 1;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Only owners can access member emails';
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id)
  VALUES (_company_id, _caller_id, 'MEMBER_EMAILS_VIEWED', 'memberships', _company_id);

  -- Return members with emails from auth.users
  RETURN QUERY
  SELECT
    m.user_id,
    p.full_name,
    u.email::text,
    m.role::text,
    m.active,
    m.id AS membership_id
  FROM public.memberships m
  JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.company_id = _company_id;
END;
$$;
