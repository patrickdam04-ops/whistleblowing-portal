'use client'

import { useState, useTransition } from 'react'
import { generateAIResponse } from '@/app/actions/generate-ai-response'
import { saveAdminResponse } from '@/app/dashboard/[id]/actions'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Save, AlertTriangle } from 'lucide-react'

interface AdminResponseFormProps {
  reportId: string
  reportDescription: string
  ticketCode?: string | null
  initialResponse?: string | null
}

export function AdminResponseForm({
  reportId,
  reportDescription,
  ticketCode,
  initialResponse,
}: AdminResponseFormProps) {
  const [response, setResponse] = useState(initialResponse || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(false)

    try {
      const aiResponse = await generateAIResponse(reportDescription, ticketCode || undefined)
      setResponse(aiResponse)
    } catch (err: any) {
      console.error('Errore generazione AI:', err)
      setError('Errore durante la generazione della bozza. Riprova più tardi.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!response.trim()) {
      setError('La risposta non può essere vuota')
      return
    }

    setError(null)
    setSuccess(false)

    startSaving(async () => {
      try {
        await saveAdminResponse(reportId, response)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err: any) {
        console.error('Errore salvataggio:', err)
        setError(err.message || 'Errore durante il salvataggio. Riprova più tardi.')
      }
    })
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Risposta al Segnalante
        </h3>

        {/* Banner Avviso Legale */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                ⚠️ <strong>AVVISO:</strong> Questa è una bozza generata dall'AI. Si raccomanda caldamente di richiedere una consulenza legale prima dell'invio, poiché questa risposta non costituisce parere legale.
              </p>
            </div>
          </div>
        </div>

        {/* Bottone Genera Bozza */}
        <div className="mb-4">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                ✨ Genera Bozza con AI
              </>
            )}
          </Button>
        </div>

        {/* Area di testo */}
        <div className="mb-4">
          <label
            htmlFor="admin-response"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Risposta al Segnalante
          </label>
          <textarea
            id="admin-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm"
            placeholder="Scrivi qui la risposta al segnalante oppure usa il bottone 'Genera Bozza con AI' per creare una bozza automatica..."
          />
        </div>

        {/* Messaggi di errore/successo */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Risposta salvata con successo! Il segnalante potrà visualizzarla tramite il codice di tracking.
            </p>
          </div>
        )}

        {/* Bottone Salva */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !response.trim()}
            className="min-w-[200px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salva e Invia Risposta
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
