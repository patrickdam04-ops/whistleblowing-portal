'use server'

import { createClient } from '@/utils/supabase/server'
import {
  getInitialFeedbackStatus,
  getFinalOutcomeStatus,
  getInitialFeedbackDeadline,
  getFinalOutcomeDeadline,
  getDaysRemaining,
} from '@/lib/sla-utils'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-2.5-pro'
const URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  MODEL +
  ':generateContent?key=' +
  API_KEY

interface ReportRow {
  id: string
  created_at: string
  status: string
  severity: string | null
  acknowledged_at: string | null
  company_id: string | null
}

/** Snapshot della situazione segnalazioni (senza riferimenti temporali). */
function buildSituationSnapshot(
  reports: ReportRow[],
  companyLabel: string
): Record<string, unknown> {
  const now = new Date()
  let total = reports.length
  const byStatus: Record<string, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    DISMISSED: 0,
  }
  const bySeverity: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    null: 0,
  }
  let initialOk = 0
  let initialOverdue = 0
  let initialPending = 0
  let finalOverdue = 0
  let finalDueSoon = 0
  let openCount = 0
  let criticalOpen = 0

  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    const sev = r.severity ?? 'null'
    bySeverity[sev] = (bySeverity[sev] ?? 0) + 1

    const initialStatus = getInitialFeedbackStatus(r)
    if (initialStatus === 'ok') initialOk++
    else if (initialStatus === 'overdue') initialOverdue++
    else initialPending++

    const closed = r.status === 'RESOLVED' || r.status === 'DISMISSED'
    if (!closed) {
      openCount++
      if (r.severity === 'CRITICAL') criticalOpen++
      const finalStatus = getFinalOutcomeStatus(r)
      if (finalStatus === 'overdue') finalOverdue++
      else if (finalStatus === 'pending') {
        const rem = getDaysRemaining(getFinalOutcomeDeadline(r.created_at), now)
        if (rem >= 0 && rem <= 30) finalDueSoon++
      }
    }
  }

  return {
    azienda: companyLabel,
    totale_segnalazioni: total,
    per_stato: byStatus,
    per_gravita: bySeverity,
    riscontro_7_gg: { inviati: initialOk, in_scadenza: initialPending, scaduti: initialOverdue },
    esito_90_gg: { in_ritardo: finalOverdue, in_scadenza_prossimi_30_gg: finalDueSoon },
    aperte: openCount,
    aperte_critiche: criticalOpen,
  }
}

export type GenerateDashboardSummaryResult =
  | { success: true; summary: string }
  | { success: false; error: string }

export async function generateDashboardSummary(
  companyId: string,
  companyLabel: string
): Promise<GenerateDashboardSummaryResult> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Non autorizzato' }
  }

  const { data: memberships } = await supabase
    .from('tenant_members')
    .select('tenants ( slug, name )')
    .eq('user_id', user.id)

  const allowedIds = (memberships || [])
    .map((row: any) => {
      const t = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants
      return t?.slug || t?.name
    })
    .filter(Boolean) as string[]

  if (!allowedIds.includes(companyId)) {
    return { success: false, error: 'Azienda non autorizzata' }
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, created_at, status, severity, acknowledged_at, company_id')
    .eq('company_id', companyId)

  if (error) {
    console.error('generateDashboardSummary: fetch reports', error)
    return { success: false, error: 'Errore nel caricamento delle segnalazioni' }
  }

  const rows = (reports || []) as ReportRow[]
  const snapshot = buildSituationSnapshot(rows, companyLabel)

  if (!API_KEY) {
    console.error('GOOGLE_GENERATIVE_AI_API_KEY mancante')
    return { success: false, error: 'Configurazione server mancante' }
  }

  const prompt = `Sei un assistente per il Responsabile della gestione delle segnalazioni (whistleblowing, D.Lgs 24/2023).

Ti viene fornito lo stato attuale delle segnalazioni per un'azienda (snapshot corrente, senza riferimenti a periodi temporali).

Compito: scrivi un breve riepilogo narrativo in italiano (2-4 frasi) che descriva la situazione attuale delle segnalazioni per questa azienda.

Regole:
- NON usare riferimenti a intervalli di tempo (es. "questo mese", "nell'ultimo periodo", "a oggi").
- Descrivi solo lo stato attuale: numero di segnalazioni, come sono distribuite per stato e gravità, eventuali criticità (riscontri 7 gg non inviati o scaduti, esiti 90 gg in ritardo o in scadenza, segnalazioni critiche aperte).
- Se non ci sono segnalazioni, dillo in una frase.
- Tono professionale e neutro.
- Rispondi SOLO con il testo del riepilogo, senza titoli o elenchi puntati.

Dati attuali (JSON):
${JSON.stringify(snapshot, null, 2)}`

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    const rawText = await response.text()

    if (!response.ok) {
      console.warn('Gemini dashboard summary:', response.status, rawText)
      if (response.status === 429 || response.status >= 500) {
        return {
          success: false,
          error: 'Servizio temporaneamente non disponibile. Riprova tra poco.',
        }
      }
      return { success: false, error: `Errore generazione: ${response.status}` }
    }

    const parsed = JSON.parse(rawText)
    const text =
      parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    if (!text) {
      return { success: false, error: 'Risposta vuota dal servizio' }
    }

    return { success: true, summary: text }
  } catch (e) {
    console.error('generateDashboardSummary:', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore durante la generazione',
    }
  }
}
