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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/[id]/actions.ts:acknowledgeReport',message:'acknowledgeReport entry',data:{reportId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/[id]/actions.ts:after getUser',message:'auth result',data:{authError:authError?.message||null,hasUser:Boolean(user)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log

    if (authError || !user) {
      return { success: false, error: 'Non autorizzato' }
    }

    const acknowledgedAt = new Date().toISOString()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/[id]/actions.ts:before update',message:'before update reports',data:{reportId,acknowledgedAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion agent log

    const { error, data } = await supabase
      .from('reports')
      .update({ acknowledged_at: acknowledgedAt })
      .eq('id', reportId)
      .select()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/[id]/actions.ts:after update',message:'update result',data:{errorMessage:error?.message||null,errorCode:error?.code||null,dataLength:data?.length??null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion agent log

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
    // #region agent log
    const errMsg = e instanceof Error ? e.message : String(e)
    fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/[id]/actions.ts:catch',message:'acknowledgeReport exception',data:{error:errMsg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion agent log
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
