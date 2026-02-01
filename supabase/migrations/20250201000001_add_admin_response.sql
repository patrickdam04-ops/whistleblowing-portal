-- Aggiunge la colonna admin_response alla tabella reports (risposta al segnalante)
-- Errore PGRST204: "Could not find the 'admin_response' column of 'reports'" senza questa colonna.

ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_response TEXT;
