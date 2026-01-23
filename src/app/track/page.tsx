'use client'

import { useState } from 'react'
import { getReportStatus } from '@/app/actions/track-report'

interface ReportStatus {
  ticket_code: string
  created_at: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  admin_response: string | null
}
import { Button } from '@/components/ui/button'
import { Search, Shield, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badges'
import { formatDate, formatFullDate } from '@/lib/report-utils'
import Link from 'next/link'

export default function TrackPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ReportStatus | null>(null)
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
        setResult(response.data as ReportStatus)
        setError(null)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Segui la tua Segnalazione
          </h1>
          <p className="text-lg text-gray-600">
            Inserisci il tuo codice di tracciamento per verificare lo stato della pratica
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Codice */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center text-lg tracking-wider uppercase"
                maxLength={15}
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Inserisci il codice che hai ricevuto dopo l'invio della segnalazione
              </p>
            </div>

            {/* Messaggio di errore */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottone submit */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full sm:w-auto"
              >
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
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Segnalazione Trovata
              </h2>
              <p className="text-sm text-gray-600">
                Codice: <span className="font-mono font-semibold">{result.ticket_code}</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Stato */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Stato della Pratica</span>
                </div>
                <div className="mt-2">
                  <StatusBadge status={result.status} />
                </div>
              </div>

              {/* Data */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Data di Ricezione</span>
                </div>
                <p className="text-sm text-gray-900 mt-1">{formatFullDate(result.created_at)}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(result.created_at)}</p>
              </div>

              {/* Risposta Admin (se presente) */}
              {result.admin_response && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Risposta dell'Amministrazione</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
                      {result.admin_response}
                    </p>
                  </div>
                </div>
              )}

              {/* Messaggio se non c'è risposta */}
              {!result.admin_response && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">
                        In attesa di risposta
                      </p>
                      <p className="text-xs text-yellow-800 mt-1">
                        La tua segnalazione è in fase di valutazione. Controlla periodicamente questo codice per eventuali aggiornamenti.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottone per tornare alla home */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Torna alla Home
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Link per inviare nuova segnalazione */}
        {!result && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 mb-2">
              Non hai ancora inviato una segnalazione?
            </p>
            <Button asChild variant="outline">
              <Link href="/submit-report">
                Invia una Segnalazione
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
