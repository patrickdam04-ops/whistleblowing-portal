'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { submitReport, type ActionResult } from './actions'
import { transcribeAudio } from '@/app/(public)/actions/transcribe-audio'
import { Button } from '@/components/ui/button'
import {
  Shield,
  AlertTriangle,
  Lock,
  Mail,
  CheckCircle,
  Copy,
  Home,
  Paperclip,
  Mic,
  Square,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

const initialState: ActionResult = {
  success: false,
  message: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
      className="w-full sm:w-auto"
    >
      {pending ? 'Invio in corso...' : 'Invia Segnalazione'}
    </Button>
  )
}

interface SubmitReportPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default function SubmitReportPage({ searchParams }: SubmitReportPageProps) {
  const clientParam = getParam(searchParams?.client) || getParam(searchParams?.ref)
  const [state, formAction] = useFormState(submitReport, initialState)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [copied, setCopied] = useState(false)
  const [descriptionText, setDescriptionText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Funzione per copiare il codice nella clipboard
  const handleCopyCode = async () => {
    if (state.ticket_code) {
      try {
        await navigator.clipboard.writeText(state.ticket_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Errore durante la copia:', err)
      }
    }
  }

  const startRecording = async () => {
    setTranscriptionError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setTranscriptionError('Il tuo browser non supporta la registrazione audio.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsRecording(false)
        stream.getTracks().forEach((track) => track.stop())

        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        audioChunksRef.current = []

        if (blob.size === 0) {
          setTranscriptionError('Nessun audio registrato.')
          return
        }

        setIsTranscribing(true)
        try {
          const formData = new FormData()
          const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
            type: blob.type || 'audio/webm',
          })
          formData.append('audio', audioFile)

          const result = await transcribeAudio(formData)
          const transcribedText = result.text ?? ''
          if (!result.success || !transcribedText) {
            setTranscriptionError(result.error || 'Errore durante la trascrizione.')
          } else {
            setDescriptionText((prev) => (prev ? `${prev}\n${transcribedText}` : transcribedText))
          }
        } catch (error) {
          console.error('Errore trascrizione:', error)
          setTranscriptionError('Errore durante la trascrizione.')
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Errore accesso microfono:', error)
      setTranscriptionError('Impossibile accedere al microfono.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {clientParam && (
          <div className="mb-6 rounded-lg border border-blue-700 bg-blue-900 text-blue-100 px-4 py-3 text-sm">
            👋 Ambiente Demo Riservato per: <span className="font-semibold">{clientParam}</span>
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Invia una Segnalazione
          </h1>
          <p className="text-lg text-slate-600">
            La tua segnalazione è importante. Tutti i dati sono protetti e trattati con la massima riservatezza.
          </p>
        </div>

        {/* Success Card - Mostrata quando la segnalazione è stata inviata */}
        {state.success && state.ticket_code ? (
          <div className="bg-white rounded-lg shadow-xl p-8 sm:p-10">
            <div className="text-center">
              {/* Icona di successo */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              {/* Titolo */}
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Segnalazione Inviata
              </h2>

              {/* Testo informativo */}
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                È fondamentale salvare il tuo codice di tracciamento. Ti servirà per
                controllare lo stato della pratica e leggere le risposte mantenendo
                l'anonimato.
              </p>

              {/* Box con il codice */}
              <div className="bg-gray-50 border-2 border-slate-200 rounded-lg p-6 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Il tuo codice di tracciamento:
                </p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-3xl font-bold text-slate-900 tracking-wider font-mono">
                    {state.ticket_code}
                  </code>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copiato!' : 'Copia Codice'}
                  </Button>
                </div>
              </div>

              {/* Bottoni */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" size="lg">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Torna alla Home
                  </Link>
                </Button>
              </div>

              {/* Nota importante */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Salva questo codice in un posto sicuro. Non
                  potrai recuperarlo in seguito se lo perdi.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Form Card - Mostrata quando non c'è successo */
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
            {/* Messaggio di errore generale */}
            {!state.success && state.message && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {state.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form ref={formRef} action={formAction} className="space-y-6">
              {clientParam && (
                <input type="hidden" name="company_id" value={clientParam} />
              )}
            {/* Descrizione */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Descrivi la violazione <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant={isRecording ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Registra
                    </>
                  )}
                </Button>
              </div>
              <textarea
                id="description"
                name="description"
                rows={8}
                required
                minLength={10}
                maxLength={5000}
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Descrivi in dettaglio la violazione o il comportamento inappropriato che hai osservato..."
              />
              {isRecording && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  Registrazione in corso...
                </p>
              )}
              {isTranscribing && (
                <p className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Trascrizione in corso...
                </p>
              )}
              {transcriptionError && (
                <p className="mt-2 text-sm text-red-600">{transcriptionError}</p>
              )}
              {state.errors?.description && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.description[0]}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Minimo 10 caratteri, massimo 5000 caratteri
              </p>
            </div>

            {/* Gravità */}
            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Gravità <span className="text-red-500">*</span>
              </label>
              <select
                id="severity"
                name="severity"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Seleziona la gravità
                </option>
                <option value="LOW">Bassa - Violazione minore</option>
                <option value="MEDIUM">Media - Violazione moderata</option>
                <option value="HIGH">Alta - Violazione grave</option>
                <option value="CRITICAL">Critica - Violazione molto grave</option>
              </select>
              {state.errors?.severity && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.severity[0]}
                </p>
              )}
            </div>

            {/* Anonimato */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is_anonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="is_anonymous"
                  className="font-medium text-gray-700 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Voglio restare anonimo
                </label>
                <p className="text-slate-500 mt-1">
                  Se selezioni questa opzione, la tua identità sarà completamente protetta.
                </p>
              </div>
            </div>
            <input
              type="hidden"
              name="is_anonymous"
              value={isAnonymous ? 'true' : 'false'}
            />

            {/* Contatto (mostrato solo se non anonimo) */}
            {!isAnonymous && (
              <div>
                <label
                  htmlFor="contact_info"
                  className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contatto (facoltativo)
                </label>
                <input
                  type="email"
                  id="contact_info"
                  name="contact_info"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="tua.email@esempio.com"
                />
                {state.errors?.contact_info && (
                  <p className="mt-1 text-sm text-red-600">
                    {state.errors.contact_info[0]}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Fornisci un contatto se desideri ricevere aggiornamenti sulla tua segnalazione
                </p>
              </div>
            )}

            {/* Allegati */}
            <div>
              <label
                htmlFor="attachments"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
              >
                <Paperclip className="w-4 h-4" />
                Allegati (facoltativo)
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => {
                  // Validazione lato client per dimensione file
                  const files = Array.from(e.target.files || [])
                  const maxSize = 5 * 1024 * 1024 // 5MB
                  const oversizedFiles = files.filter((file) => file.size > maxSize)
                  
                  if (oversizedFiles.length > 0) {
                    alert(`I seguenti file superano il limite di 5MB:\n${oversizedFiles.map(f => f.name).join('\n')}\n\nRimuovi questi file prima di procedere.`)
                    e.target.value = '' // Reset input
                  }
                }}
              />
              <p className="mt-1 text-xs text-slate-500">
                Puoi caricare più file. Dimensione massima per file: <strong>5MB</strong>. Formati supportati: PDF, DOC, DOCX, JPG, PNG, GIF, TXT
              </p>
            </div>

            {/* Note sulla privacy */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    Privacy e Sicurezza
                  </h3>
                  <p className="text-xs text-blue-800">
                    Le tue informazioni sono protette e crittografate. Tutte le segnalazioni sono
                    trattate con la massima riservatezza secondo le normative vigenti.
                  </p>
                </div>
              </div>
            </div>

              {/* Bottone submit */}
              <div className="flex justify-end pt-4">
                <SubmitButton />
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
