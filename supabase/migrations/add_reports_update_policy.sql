-- Migrazione: policy UPDATE su reports per ODV (acknowledged_at, status, admin_response)
-- Esegui nel SQL Editor di Supabase

CREATE POLICY "Allow admin update"
ON reports
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
