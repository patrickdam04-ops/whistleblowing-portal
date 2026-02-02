'use client'

import { useState } from 'react'
import { getReportStatus, getReportMessagesByTicket, addWhistleblowerMessage, type ReportMessage } from '@/app/actions/track-report'
import { Button } from '@/components/ui/button'
import { Search, Shield, ChevronLeft, Calendar, FileText, AlertCircle, CheckCircle, Clock, MessageSquare, Send } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badges'
import { formatDate, formatFullDate } from '@/lib/report-utils'
import Link from 'next/link'

interface ReportStatus {
  ticket_code: string
  created_at: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  admin_response: string | null
}

interface TrackClientProps {
  clientParam?: string
}

export default function TrackClient({ clientParam }: TrackClientProps) {
  const homeLink = clientParam ? `/azienda/${encodeURIComponent(clientParam)}` : '/'
  const backLabel = clientParam ? 'Torna alla Zona Segnalazioni' : 'Torna alla Home'
  const submitLink = clientParam
    ? `/invia?client=${encodeURIComponent(clientParam)}`
    : '/invia'
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ReportStatus | null>(null)
  const [messages, setMessages] = useState<ReportMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!code || code.trim() === '') {
      setError('Inserisci un codice valido')
      return
    }

    setIsLoading(true)
    try {
      const response = await getReportStatus(code.trim().toUpperCase())

      if ('error' in response) {
        setError(response.error)
        setResult(null)
      } else if (response.success && response.data) {
        const data = response.data as ReportStatus
        setResult(data)
        setError(null)
        const list = await getReportMessagesByTicket(data.ticket_code)
        setMessages(list)
      } else {
        setError('Codice non valido. Verifica di aver inserito il codice corretto.')
        setResult(null)
      }
    } catch (err) {
      setError('Si è verificato un errore durante la ricerca. Riprova più tardi.')
      console.error('Errore durante la ricerca:', err)
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Indietro: coerenza con Zona Segnalazioni dell'azienda */}
        <div className="mb-6">
          <Link
            href={homeLink}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 border border-slate-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-slate-200" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Segui la tua Segnalazione</h1>
          <p className="text-lg text-slate-400">
            Inserisci il tuo codice di tracciamento per verificare lo stato della pratica
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl p-6 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Codice */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-2">
                Codice di Tracciamento
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WB-XXXX-XXXX"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors font-mono text-center text-lg tracking-wider uppercase"
                maxLength={15}
              />
              <p className="mt-2 text-xs text-slate-500 text-center">
                Inserisci il codice che hai ricevuto dopo l'invio della segnalazione
              </p>
            </div>

            {/* Messaggio di errore */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottone submit */}
            <div className="flex justify-center">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Ricerca in corso...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Cerca Pratica
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Risultato - Card con lo stato */}
        {result && (
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 border border-slate-600 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Segnalazione Trovata</h2>
              <p className="text-sm text-slate-400">
                Codice: <span className="font-mono font-semibold text-slate-200">{result.ticket_code}</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Stato */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Stato della Pratica</span>
                </div>
                <div className="mt-2">
                  <StatusBadge status={result.status} />
                </div>
              </div>

              {/* Data */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Data di Ricezione</span>
                </div>
                <p className="text-sm text-slate-200 mt-1">{formatFullDate(result.created_at)}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(result.created_at)}</p>
              </div>

              {/* Risposta Admin (se presente) */}
              {result.admin_response && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-200">
                      Risposta dell'Amministrazione
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {result.admin_response}
                    </p>
                  </div>
                </div>
              )}

              {/* Messaggio se non c'è risposta */}
              {!result.admin_response && messages.length === 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-200">In attesa di risposta</p>
                      <p className="text-xs text-slate-400 mt-1">
                        La tua segnalazione è in fase di valutazione. Puoi scrivere qui sotto per fornire altri dati o chiarimenti.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversazione: messaggi successivi */}
              <div className="border-t border-slate-600 pt-6 mt-6">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversazione
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {result.admin_response && (
                    <div className="flex justify-end">
                      <div className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 max-w-[85%] text-left border border-slate-600">
                        <p className="text-xs font-medium text-slate-400 mb-0.5">Amministrazione</p>
                        <p className="text-sm whitespace-pre-wrap">{result.admin_response}</p>
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'admin' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={m.role === 'admin' ? 'bg-slate-700 text-slate-200 rounded-lg px-4 py-2 max-w-[85%] text-left border border-slate-600' : 'bg-slate-900/70 text-slate-200 rounded-lg px-4 py-2 max-w-[85%] text-left border border-slate-600'}>
                        <p className="text-xs font-medium text-slate-400 mb-0.5">{m.role === 'admin' ? 'Amministrazione' : 'Tu'}</p>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(m.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!result?.ticket_code || !messageText.trim()) return
                    setMessageError(null)
                    setSendingMessage(true)
                    const res = await addWhistleblowerMessage(result.ticket_code, messageText)
                    setSendingMessage(false)
                    if (res.success) {
                      setMessageText('')
                      const list = await getReportMessagesByTicket(result.ticket_code)
                      setMessages(list)
                    } else {
                      setMessageError(res.error)
                    }
                  }}
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Scrivi un messaggio (es. altri dati richiesti)..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    maxLength={2000}
                  />
                  <Button type="submit" disabled={sendingMessage || !messageText.trim()} size="sm">
                    {sendingMessage ? 'Invio...' : <><Send className="w-4 h-4" /> Invia</>}
                  </Button>
                </form>
                {messageError && <p className="text-sm text-red-400 mt-2">{messageError}</p>}
              </div>
            </div>

            {/* Bottone per tornare alla home */}
            <div className="mt-6 pt-6 border-t border-slate-600">
              <Button asChild variant="outline" className="w-full border-slate-500 text-slate-200 hover:bg-slate-700">
                <Link href={homeLink}>{backLabel}</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Link per inviare nuova segnalazione */}
        {!result && (
          <div className="text-center mt-6">
            <p className="text-sm text-slate-400 mb-2">Non hai ancora inviato una segnalazione?</p>
            <Button asChild variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-700">
              <Link href={submitLink}>Invia una Segnalazione</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
