-- Migrazione: aggiunge acknowledged_at per SLA D.Lgs. 24/2023 (riscontro iniziale entro 7 gg)
-- Esegui nel SQL Editor di Supabase se la tabella reports esiste già

ALTER TABLE reports ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;
