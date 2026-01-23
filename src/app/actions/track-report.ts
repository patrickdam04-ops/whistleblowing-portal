'use server'

import { createClient } from '@/utils/supabase/server'

export async function getReportStatus(code: string) {
  const supabase = createClient()

  if (!code) return { error: 'Inserisci un codice.' }

  // Pulizia aggressiva: via spazi, tutto maiuscolo
  const cleanCode = code.trim().toUpperCase()
  console.log('SERVER: Cerco codice:', cleanCode)

  try {
    const { data, error } = await supabase
      .rpc('get_ticket_status', { input_code: cleanCode }) // <--- PARAMETRO AGGIORNATO
      .single()

    if (error) {
      console.error('RPC Error:', error)
      // PGRST116 significa "Nessuna riga trovata" (quindi codice errato)
      if (error.code === 'PGRST116') {
        return { error: 'Codice non trovato. Controlla di averlo scritto bene.' }
      }
      return { error: 'Errore tecnico: ' + error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Crash:', err)
    return { error: 'Errore di connessione.' }
  }
}
