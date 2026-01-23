'use server'

import { createClient } from '@/utils/supabase/server'
import { reportSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

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
    const severity = formData.get('severity') as string | null
    const isAnonymousValue = formData.get('is_anonymous') as string | null
    const contactInfo = formData.get('contact_info') as string | null
    const attachments = formData.getAll('attachments') as File[]

    // Prepara i dati per la validazione (normalizza i valori)
    const rawData = {
      description: description || '',
      severity: severity || '', // Stringa vuota se non selezionato (Zod darà errore)
      is_anonymous: isAnonymousValue === 'true',
      contact_info: contactInfo && contactInfo.trim() !== '' ? contactInfo.trim() : '',
    }

    // Debug: log dei dati ricevuti
    console.log('📥 Dati ricevuti dal form:', rawData)

    // Valida i dati con Zod
    const validationResult = reportSchema.safeParse(rawData)

    if (!validationResult.success) {
      // Debug: log dettagliato degli errori Zod
      console.error('❌ Errore di validazione Zod:', validationResult.error)
      console.error('📋 Dettagli errori:', JSON.stringify(validationResult.error.errors, null, 2))

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
            severity: 'Gravità',
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

    // Se l'utente ha scelto l'anonimato, forza contact_info a null
    const encryptedContactInfo = validatedData.is_anonymous
      ? null
      : validatedData.contact_info || null

    // GENERA IL CODICE (Cruciale!)
    // Esempio semplice e robusto
    const ticketCode = 'WB-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    console.log('🎫 Codice generato:', ticketCode)

    // Crea il client Supabase
    const supabase = createClient()

    // Costante per il nome del bucket - MODIFICA QUI SE IL BUCKET HA UN NOME DIVERSO SU SUPABASE
    const BUCKET_NAME = 'report-attachments'
    
    // Gestione upload allegati
    const attachmentPaths: string[] = []
    
    if (attachments && attachments.length > 0) {
      console.log(`📦 Tentativo upload di ${attachments.length} file(s) nel bucket: "${BUCKET_NAME}"`)
      
      for (const file of attachments) {
        // Verifica dimensione file (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
          return {
            success: false,
            message: `Il file "${file.name}" supera il limite di 5MB.`,
          }
        }

        // Genera un nome file univoco per evitare collisioni
        const fileExt = file.name.split('.').pop()
        const fileName = `${ticketCode}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const filePath = `${ticketCode}/${fileName}`

        try {
          console.log(`📤 Upload file "${file.name}" (${(file.size / 1024).toFixed(2)} KB) nel bucket "${BUCKET_NAME}" al path: ${filePath}`)
          
          // Upload del file nel bucket privato
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            })

          if (uploadError) {
            console.error('❌ Errore durante l\'upload del file:', uploadError)
            console.error('📋 Dettagli errore:', {
              message: uploadError.message,
              statusCode: uploadError.statusCode,
              error: uploadError.error,
              bucket: BUCKET_NAME,
              path: filePath,
            })
            return {
              success: false,
              message: `Errore durante l'upload del file "${file.name}". Verifica che il bucket "${BUCKET_NAME}" esista su Supabase.`,
            }
          }

          // Salva solo il path (non l'URL completo)
          attachmentPaths.push(filePath)
          console.log('✅ File caricato con successo:', filePath, uploadData)
        } catch (uploadErr: any) {
          console.error('❌ Errore imprevisto durante l\'upload:', uploadErr)
          console.error('📋 Dettagli errore:', {
            message: uploadErr.message,
            stack: uploadErr.stack,
            bucket: BUCKET_NAME,
            path: filePath,
          })
          return {
            success: false,
            message: `Errore durante l'upload del file "${file.name}". Riprova più tardi.`,
          }
        }
      }
    }

    // SALVA NEL DB INCLUDENDO IL CODICE E GLI ALLEGATI
    // Salva i path come array nativo (PostgreSQL array type)
    console.log('💾 Salvataggio nel DB con attachments:', attachmentPaths)
    
    const insertData: any = {
      description: validatedData.description,
      severity: validatedData.severity,
      is_anonymous: validatedData.is_anonymous,
      encrypted_contact_info: encryptedContactInfo,
      status: 'PENDING',
      ticket_code: ticketCode, // <--- QUESTO DEVE ESSERE PRESENTE!
    }

    // Aggiungi attachments solo se ci sono file (come array nativo, non stringa JSON)
    if (attachmentPaths.length > 0) {
      insertData.attachments = attachmentPaths // Array nativo, non JSON.stringify()
    }

    const { error, data } = await supabase.from('reports').insert(insertData)

    if (error) {
      console.error('❌ Errore durante l\'inserimento della segnalazione:', error)
      console.error('🎫 Codice che stavo cercando di salvare:', ticketCode)
      return {
        success: false,
        message: 'Si è verificato un errore durante l\'invio della segnalazione. Riprova più tardi.',
      }
    }

    console.log('✅ Segnalazione salvata con successo. Codice:', ticketCode)

    // Invia notifica email all'amministratore
    try {
      // Usa variabile d'ambiente se disponibile, altrimenti fallback alla chiave hardcoded
      const resendApiKey = process.env.RESEND_API_KEY || 're_bKNWtpSS_Ff5oKVo4wZ5xGPLSawkQ83Be'
      
      if (!resendApiKey) {
        console.warn('⚠️ RESEND_API_KEY non configurata, email non inviata')
        // Non blocchiamo il flusso se l'email non può essere inviata
      } else {
        const resend = new Resend(resendApiKey)

        // Crea un titolo dalla descrizione (primi 50 caratteri)
        const title = validatedData.description.length > 50
          ? validatedData.description.substring(0, 50) + '...'
          : validatedData.description

        await resend.emails.send({
          from: 'Whistleblowing AI <onboarding@resend.dev>',
          to: 'patrickdam04@gmail.com', // <-- Indirizzo corretto
          subject: `🔴 Nuova Segnalazione: ${title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
              <h2 style="color: #d32f2f;">Nuova Segnalazione Ricevuta</h2>
              <p><strong>Titolo:</strong> ${title}</p>
              <p><strong>Codice di Tracciamento:</strong> ${ticketCode}</p>
              <p><strong>Descrizione:</strong> ${validatedData.description}</p>
              <hr />
              <p>Accedi alla Dashboard per l'analisi AI completa e il piano investigativo.</p>
              <br />
              <p style="font-size: 11px; color: #666;">
                ⚠️ AVVISO LEGALE: Questa notifica è generata automaticamente. Le analisi AI sono a scopo informativo e non sostituiscono il parere di un legale.
              </p>
            </div>
          `,
        })

        console.log('Tentativo di invio mail a patrickdam04@gmail.com effettuato.')
      }
    } catch (emailError: any) {
      // Non blocchiamo il flusso se l'email fallisce - loggiamo solo l'errore
      console.error('❌ Errore durante l\'invio dell\'email di notifica:', emailError)
      // Continuiamo comunque - la segnalazione è stata salvata con successo
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
    console.error('Errore imprevisto durante l\'invio della segnalazione:', error)
    return {
      success: false,
      message: 'Si è verificato un errore imprevisto. Riprova più tardi.',
    }
  }
}
