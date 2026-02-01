-- Audit log accessi alle segnalazioni (conformità D.Lgs. 24/2023)
CREATE TABLE IF NOT EXISTS report_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS report_access_log_report_id_idx ON report_access_log(report_id);
CREATE INDEX IF NOT EXISTS report_access_log_user_id_idx ON report_access_log(user_id);
CREATE INDEX IF NOT EXISTS report_access_log_accessed_at_idx ON report_access_log(accessed_at);

ALTER TABLE report_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert own access log"
ON report_access_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Select access log by tenant"
ON report_access_log FOR SELECT TO authenticated
USING (
  report_id IN (
    SELECT id FROM reports WHERE company_id IN (SELECT get_my_tenant_slugs())
  )
);
