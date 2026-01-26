-- Schema per la tabella reports (Whistleblowing Platform)
-- Esegui questo script nel SQL Editor di Supabase

-- Crea la tabella reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  description TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  severity TEXT,
  encrypted_contact_info TEXT,
  company_id TEXT,
  ai_analysis JSONB,
  
  -- Vincoli CHECK per status
  CONSTRAINT reports_status_check CHECK (
    status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED')
  ),
  
  -- Vincoli CHECK per severity
  CONSTRAINT reports_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  )
);

-- Abilita Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts
-- Permette a chiunque (anon e authenticated) di inserire segnalazioni
CREATE POLICY "Allow public inserts"
ON reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow admin select
-- Permette solo agli utenti autenticati di leggere le segnalazioni
-- (sarà poi ristretta ulteriormente per permettere solo agli admin)
CREATE POLICY "Allow admin select"
ON reports
FOR SELECT
TO authenticated
USING (true);

-- IMPORTANTE: Disabilita Realtime per questa tabella
-- Vai su Supabase Dashboard > Database > Replication
-- e DISABILITA il Realtime per la tabella 'reports'
-- per motivi di privacy e sicurezza dei dati sensibili
