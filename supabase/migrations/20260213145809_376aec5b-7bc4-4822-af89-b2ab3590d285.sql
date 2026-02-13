
-- Add columns as nullable first
ALTER TABLE public.companies
  ADD COLUMN cnpj text,
  ADD COLUMN razao_social text,
  ADD COLUMN nome_fantasia text,
  ADD COLUMN inscricao_estadual text;

-- Backfill existing rows with unique placeholder values
UPDATE public.companies SET cnpj = '00000000000001', razao_social = name WHERE id = '30a8b30e-9186-4961-a3fb-21d18297efcf';
UPDATE public.companies SET cnpj = '00000000000002', razao_social = name WHERE id = 'c9fbd87e-7f48-45ce-a903-e43fffa3621f';

-- Now apply constraints
ALTER TABLE public.companies ALTER COLUMN cnpj SET NOT NULL;
ALTER TABLE public.companies ALTER COLUMN razao_social SET NOT NULL;
ALTER TABLE public.companies ADD CONSTRAINT companies_cnpj_key UNIQUE (cnpj);

-- Recreate function with new params
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  _name text,
  _slug text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _segment text DEFAULT NULL,
  _city text DEFAULT NULL,
  _state text DEFAULT NULL,
  _timezone text DEFAULT 'America/Sao_Paulo',
  _cnpj text DEFAULT NULL,
  _razao_social text DEFAULT NULL,
  _nome_fantasia text DEFAULT NULL,
  _inscricao_estadual text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _company_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.companies (name, slug, phone, segment, city, state, timezone, cnpj, razao_social, nome_fantasia, inscricao_estadual)
  VALUES (_name, _slug, _phone, _segment, _city, _state, _timezone, _cnpj, _razao_social, _nome_fantasia, _inscricao_estadual)
  RETURNING id INTO _company_id;

  INSERT INTO public.memberships (company_id, user_id, role)
  VALUES (_company_id, auth.uid(), 'owner');

  RETURN _company_id;
END;
$function$;
