-- Analisi AI Sherlock e Legale persistenti per report (dashboard)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS sherlock_analysis JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS legal_analysis JSONB;
