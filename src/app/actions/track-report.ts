'use server'

import { createClient } from '@/utils/supabase/server'

export async function getReportStatus(code: string) {
  const supabase = createClient()

  if (!code) return { error: 'Inserisci un codice.' }

  const cleanCode = code.trim().toUpperCase()

  try {
    const { data, error } = await supabase
      .rpc('get_ticket_status', { input_code: cleanCode })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: 'Codice non trovato. Controlla di averlo scritto bene.' }
      }
      return { error: 'Errore tecnico: ' + error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    return { error: 'Errore di connessione.' }
  }
}

export type ReportMessage = { role: string; body: string; created_at: string }

/** Messaggi della conversazione per un codice (segnalante). */
export async function getReportMessagesByTicket(code: string): Promise<ReportMessage[]> {
  const supabase = createClient()
  if (!code?.trim()) return []
  try {
    const { data, error } = await supabase.rpc('get_ticket_messages', {
      input_code: code.trim().toUpperCase(),
    })
    if (error) return []
    return (data ?? []) as ReportMessage[]
  } catch {
    return []
  }
}

/** Aggiunge un messaggio del segnalante (solo con codice valido). */
export async function addWhistleblowerMessage(
  code: string,
  body: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!code?.trim()) return { success: false, error: 'Codice mancante.' }
  if (!body?.trim()) return { success: false, error: 'Scrivi un messaggio.' }
  const supabase = createClient()
  try {
    const { error } = await supabase.rpc('add_whistleblower_message', {
      input_code: code.trim().toUpperCase(),
      msg_body: body.trim(),
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Errore durante l\'invio.' }
  }
}
