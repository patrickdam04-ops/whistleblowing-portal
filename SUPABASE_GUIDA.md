# Cosa fare su Supabase (guida passo-passo)

Segui questi passi **una sola volta** dopo aver fatto il deploy del sito. Non serve sapere SQL: basta copiare e incollare.

---

## 1. Apri Supabase

1. Vai su **https://supabase.com** e fai login.
2. Clicca sul **tuo progetto** (quello usato per il portale whistleblowing).
3. Nel menu a sinistra clicca su **“SQL Editor”** (icona che assomiglia a `</>`).

---

## 2. Esegui i tre script SQL (in ordine)

Per **ogni** script qui sotto:

1. Clicca su **“New query”** (nuova query).
2. **Copia tutto** il contenuto dello script (dal primo `--` fino alla fine).
3. **Incolla** nella finestra dell’editor.
4. Clicca **“Run”** (in basso a destra, oppure tasto Run).
5. Controlla che compaia **“Success”** (o nessun errore in rosso).
6. Poi passa allo script successivo.

---

### Script 1 – RLS reports (chi può vedere le segnalazioni)

Copia e incolla **tutto** questo blocco, poi Run:

```sql
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
```

---

### Script 2 – Storage allegati (chi può scaricare gli allegati)

Copia e incolla **tutto** questo blocco, poi Run:

```sql
-- Storage: accesso allegati solo per report del proprio tenant (D.Lgs. 24/2023)
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
```

---

### Script 3 – Tabella audit log (chi ha aperto quale segnalazione)

Copia e incolla **tutto** questo blocco, poi Run:

```sql
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
```

---

## 3. Fine

Dopo aver eseguito i tre script con successo **non devi fare altro su Supabase**.  
Il sito userà da solo le nuove regole (RLS, storage, audit log).

---

## Se compare un errore

- **“relation tenant_members does not exist”** (o simile): nel tuo progetto le tabelle per aziende/tenant potrebbero avere nomi diversi. In quel caso scrivi come si chiamano le tabelle (e le colonne) che usi per “utenti” e “aziende” e si può adattare lo script.
- **“policy already exists”**: puoi ignorarlo oppure, se vuoi, prima esegui solo la riga che fa `DROP POLICY IF EXISTS ...` e poi di nuovo lo script completo.
- Altri errori: copia il messaggio di errore completo (testo in rosso) e usalo per chiedere supporto o per adattare gli script.
