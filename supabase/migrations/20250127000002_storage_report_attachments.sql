-- Storage: accesso allegati solo per report del proprio tenant (D.Lgs. 24/2023)
-- Path allegati: {ticket_code}/{filename}. Richiede get_my_tenant_slugs() dalla migration precedente.

CREATE OR REPLACE FUNCTION public.can_access_report_attachment(obj_bucket_id text, obj_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM reports r
    WHERE r.ticket_code = split_part(obj_name, '/', 1)
      AND r.company_id IN (SELECT get_my_tenant_slugs())
  );
$$;

DROP POLICY IF EXISTS "Report attachments read by tenant" ON storage.objects;
CREATE POLICY "Report attachments read by tenant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'report-attachments'
  AND can_access_report_attachment(bucket_id, name)
);
