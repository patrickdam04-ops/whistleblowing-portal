-- RLS reports: SELECT/UPDATE solo per utenti del tenant (D.Lgs. 24/2023)
-- Richiede: tenant_members(user_id, tenant_id) e tenants(id, slug, name). reports.company_id = tenants.slug.

CREATE OR REPLACE FUNCTION public.get_my_tenant_slugs()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT t.slug FROM tenant_members tm
  JOIN tenants t ON t.id = tm.tenant_id
  WHERE tm.user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "Allow admin select" ON reports;
DROP POLICY IF EXISTS "Allow admin update" ON reports;

CREATE POLICY "Reports select by tenant"
ON reports FOR SELECT TO authenticated
USING (company_id IN (SELECT get_my_tenant_slugs()));

CREATE POLICY "Reports update by tenant"
ON reports FOR UPDATE TO authenticated
USING (company_id IN (SELECT get_my_tenant_slugs()))
WITH CHECK (company_id IN (SELECT get_my_tenant_slugs()));
