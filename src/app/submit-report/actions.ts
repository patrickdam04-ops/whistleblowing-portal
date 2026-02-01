'use server'

import { createClient } from '@/utils/supabase/server'
import { reportSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { estimateSeveritiesBatch } from '@/app/actions/estimate-severity'
import { encryptContact } from '@/lib/encrypt'

export interface ActionResult {
  success: boolean
  message: string
  ticket_code?: string
  errors?: Record<string, string[]>
}

export async function submitReport(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Estrai i dati dal FormData
    const description = formData.get('description') as string | null
    const isAnonymousValue = formData.get('is_anonymous') as string | null
    const contactInfo = formData.get('contact_info') as string | null
    const attachments = formData.getAll('attachments') as File[]
    const companyId = formData.get('company_id') as string | null

    // Prepara i dati per la validazione (normalizza i valori)
    const rawData = {
      description: description || '',
      is_anonymous: isAnonymousValue === 'true',
      contact_info: contactInfo && contactInfo.trim() !== '' ? contactInfo.trim() : '',
    }

    // Valida i dati con Zod
    const validationResult = reportSchema.safeParse(rawData)

    if (!validationResult.success) {
      // Formatta gli errori di validazione
      const errors: Record<string, string[]> = {}
      validationResult.error.errors.forEach((error) => {
        const field = error.path[0] as string
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(error.message)
      })

      // Crea un messaggio di errore dettagliato che indica i campi problematici
      const errorFields = Object.keys(errors)
      let errorMessage = 'Per favore, correggi gli errori nei seguenti campi: '
      errorMessage += errorFields
        .map((field) => {
          const fieldNames: Record<string, string> = {
            description: 'Descrizione',
            is_anonymous: 'Anonimato',
            contact_info: 'Contatto',
          }
          return fieldNames[field] || field
        })
        .join(', ')

      return {
        success: false,
        message: errorMessage,
        errors,
      }
    }

    const validatedData = validationResult.data
    const normalizedCompanyId = companyId?.trim() || ''

    if (!normalizedCompanyId) {
      return {
        success: false,
        message:
          'Portale non valido o non specificato. Riapri il link corretto fornito dall’azienda.',
      }
    }

    // Contatto: cifrato at-rest (D.Lgs. 24/2023). Se anonimo non salviamo contatto.
    let encryptedContactInfo: string | null = null
    if (!validatedData.is_anonymous && validatedData.contact_info?.trim()) {
      try {
        encryptedContactInfo = encryptContact(validatedData.contact_info.trim())
      } catch {
        encryptedContactInfo = null
      }
    }

    // GENERA IL CODICE (Cruciale!)
    // Esempio semplice e robusto
    const ticketCode = 'WB-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Crea il client Supabase
    const supabase = createClient()

    const BUCKET_NAME = 'report-attachments'
    
    // Gestione upload allegati
    const attachmentPaths: string[] = []
    
    const validAttachments = (attachments || []).filter(
      (file) => file && file instanceof File && file.size > 0 && file.name
    )

    if (validAttachments.length > 0) {
      for (const file of validAttachments) {
        // Verifica dimensione file (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
          return {
            success: false,
            message: `Il file "${file.name}" supera il limite di 5MB.`,
          }
        }

        // Genera un nome file univoco e sicuro per evitare collisioni
        const fileExt = file.name.split('.').pop()
        const cleanExt = fileExt && fileExt.trim() !== '' ? fileExt : 'jpg'
        const cleanFileName = `file-${Date.now()}.${cleanExt}`
        const filePath = `${ticketCode}/${cleanFileName}`

        try {
          // Upload del file nel bucket privato
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('report-attachments')
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            })

          if (uploadError) {
            return {
              success: false,
              message: `Errore durante l'upload del file "${file.name}". Verifica che il bucket "${BUCKET_NAME}" esista su Supabase.`,
            }
          }

          // Salva solo il path (non l'URL completo)
          attachmentPaths.push(filePath)
        } catch (uploadErr: any) {
          return {
            success: false,
            message: `Errore durante l'upload del file "${file.name}". Riprova più tardi.`,
          }
        }
      }
    }

    // SALVA NEL DB INCLUDENDO IL CODICE E GLI ALLEGATI
    // Gravità non impostata: sarà stimata dall'AI al caricamento della dashboard
    const insertData: any = {
      description: validatedData.description,
      is_anonymous: validatedData.is_anonymous,
      encrypted_contact_info: encryptedContactInfo,
      status: 'PENDING',
      ticket_code: ticketCode, // <--- QUESTO DEVE ESSERE PRESENTE!
    }

    insertData.company_id = normalizedCompanyId

    // Aggiungi attachments solo se ci sono file (come array nativo, non stringa JSON)
    if (attachmentPaths.length > 0) {
      insertData.attachments = attachmentPaths // Array nativo, non JSON.stringify()
    }

    const { error, data } = await supabase
      .from('reports')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      return {
        success: false,
        message: error.message || 'Si è verificato un errore durante l\'invio della segnalazione. Riprova più tardi.',
      }
    }

    // Stima gravità con AI subito dopo l'inserimento, così in dashboard non si aspetta l'AI
    const newReportId = (data as { id?: string } | null)?.id
    if (newReportId && validatedData.description) {
      try {
        const estimated = await estimateSeveritiesBatch([
          { id: newReportId, description: validatedData.description },
        ])
        if (estimated.length > 0) {
          await supabase
            .from('reports')
            .update({ severity: estimated[0].severity })
            .eq('id', newReportId)
        }
      } catch (e) {
        console.warn('Stima gravità post-invio fallita:', e)
        // Segnalazione già salvata, severity resta null (in dashboard: "In valutazione")
      }
    }

    // Notifica email: senza contenuto della segnalazione (riservatezza D.Lgs. 24/2023)
    const resendApiKey = process.env.RESEND_API_KEY
    const notifyEmail = process.env.WHISTLEBLOW_NOTIFY_EMAIL
    if (resendApiKey && notifyEmail) {
      try {
        const resend = new Resend(resendApiKey)
        await resend.emails.send({
          from: process.env.RESEND_FROM ?? 'Whistleblowing <onboarding@resend.dev>',
          to: notifyEmail,
          subject: 'Nuova segnalazione ricevuta',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #d32f2f;">Nuova segnalazione ricevuta</h2>
              <p><strong>Codice:</strong> ${ticketCode}</p>
              <p><strong>Azienda:</strong> ${normalizedCompanyId}</p>
              <p>Accedi alla dashboard per visualizzare e gestire la segnalazione.</p>
              <p style="font-size: 11px; color: #666;">Notifica automatica. Non includere dati sensibili per riservatezza.</p>
            </div>
          `,
        })
      } catch {
        // Non blocchiamo il flusso
      }
    }

    // Revalida la pagina (opzionale, utile se si vuole mostrare statistiche)
    revalidatePath('/submit-report')

    // RESTITUISCI IL CODICE AL FRONTEND
    return {
      success: true,
      message: 'Segnalazione inviata con successo. Grazie per il tuo contributo.',
      ticket_code: ticketCode, // <--- RESTITUISCI IL CODICE
    }
  } catch (error) {
    return {
      success: false,
      message:
        'Errore imprevisto: ' +
        (error instanceof Error ? error.message : 'Impossibile inviare la segnalazione.'),
    }
  }
}
