-- Conversazione segnalante / admin (messaggi successivi alla segnalazione)
CREATE TABLE IF NOT EXISTS report_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('whistleblower', 'admin')),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS report_messages_report_id_idx ON report_messages(report_id);
CREATE INDEX IF NOT EXISTS report_messages_created_at_idx ON report_messages(created_at);

ALTER TABLE report_messages ENABLE ROW LEVEL SECURITY;

-- Admin: può vedere e inserire messaggi solo per report del proprio tenant
CREATE POLICY "Report messages select by tenant"
ON report_messages FOR SELECT TO authenticated
USING (
  report_id IN (SELECT id FROM reports WHERE company_id IN (SELECT get_my_tenant_slugs()))
);

CREATE POLICY "Report messages insert by tenant"
ON report_messages FOR INSERT TO authenticated
WITH CHECK (
  role = 'admin'
  AND report_id IN (SELECT id FROM reports WHERE company_id IN (SELECT get_my_tenant_slugs()))
);

-- Segnalante: accesso solo tramite RPC con ticket_code (nessun accesso diretto anon)
-- Restituisce i messaggi per un dato codice (solo se il codice esiste)
CREATE OR REPLACE FUNCTION public.get_ticket_messages(input_code TEXT)
RETURNS TABLE(role TEXT, body TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  r_id UUID;
BEGIN
  SELECT id INTO r_id FROM reports WHERE ticket_code = upper(trim(input_code)) LIMIT 1;
  IF r_id IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT rm.role, rm.body, rm.created_at
  FROM report_messages rm
  WHERE rm.report_id = r_id
  ORDER BY rm.created_at ASC;
END;
$$;

-- Inserisce un messaggio del segnalante (solo con codice valido)
CREATE OR REPLACE FUNCTION public.add_whistleblower_message(input_code TEXT, msg_body TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_id UUID;
BEGIN
  IF coalesce(trim(msg_body), '') = '' THEN
    RETURN;
  END IF;
  SELECT id INTO r_id FROM reports WHERE ticket_code = upper(trim(input_code)) LIMIT 1;
  IF r_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO report_messages (report_id, role, body)
  VALUES (r_id, 'whistleblower', trim(msg_body));
END;
$$;
