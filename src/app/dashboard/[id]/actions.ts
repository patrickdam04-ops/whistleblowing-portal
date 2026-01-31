'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStatus(
  id: string,
  newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
) {
  const supabase = createClient()

  // Verifica autenticazione
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Non autorizzato')
  }

  // Aggiorna solo lo stato nel database
  const { error, data } = await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Errore durante l\'aggiornamento dello stato:', error)
    throw new Error(`Errore durante l'aggiornamento dello stato: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('Segnalazione non trovata')
  }

  // Revalida le pagine per aggiornare i dati
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${id}`)
  
  return { success: true }
}

export async function saveAdminResponse(id: string, response: string) {
  const supabase = createClient()

  // Verifica autenticazione
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Non autorizzato')
  }

  if (!response || response.trim() === '') {
    throw new Error('La risposta non può essere vuota')
  }

  // Aggiorna la risposta nel database
  const { error, data } = await supabase
    .from('reports')
    .update({ admin_response: response.trim() })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Errore durante il salvataggio della risposta:', error)
    throw new Error(`Errore durante il salvataggio: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('Segnalazione non trovata')
  }

  // Revalida le pagine per aggiornare i dati
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${id}`)
  revalidatePath('/track') // Anche la pagina di tracking deve aggiornarsi

  return { success: true, message: 'Risposta salvata con successo' }
}

export async function acknowledgeReport(reportId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non autorizzato' }
    }

    const acknowledgedAt = new Date().toISOString()

    const { error, data } = await supabase
      .from('reports')
      .update({ acknowledged_at: acknowledgedAt })
      .eq('id', reportId)
      .select()

    if (error) {
      console.error('Errore durante il salvataggio del riscontro:', error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Segnalazione non trovata' }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${reportId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
