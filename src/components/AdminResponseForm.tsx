'use client'

import { useEffect, useState, useTransition } from 'react'
import { generateAIResponse } from '@/app/actions/generate-ai-response'
import type { ConsistencyAnalysisResult } from '@/app/(public)/actions/analyze-consistency'
import { saveAdminResponse } from '@/app/dashboard/[id]/actions'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Save, AlertTriangle } from 'lucide-react'

interface AdminResponseFormProps {
  reportId: string
  reportDescription: string
  ticketCode?: string | null
  initialResponse?: string | null
  sherlockAnalysis?: ConsistencyAnalysisResult | null
}

export function AdminResponseForm({
  reportId,
  reportDescription,
  ticketCode,
  initialResponse,
  sherlockAnalysis,
}: AdminResponseFormProps) {
  const [response, setResponse] = useState(initialResponse || '')
  const [localSherlock, setLocalSherlock] = useState<ConsistencyAnalysisResult | null>(
    sherlockAnalysis || null
  )
  const [generatingMode, setGeneratingMode] = useState<'SHERLOCK' | 'STANDARD' | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ConsistencyAnalysisResult>).detail
      if (detail) {
        setLocalSherlock(detail)
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('sherlock:analysis', handler)
      return () => window.removeEventListener('sherlock:analysis', handler)
    }
    return undefined
  }, [])

  const handleGenerate = async (mode: 'SHERLOCK' | 'STANDARD') => {
    setGeneratingMode(mode)
    setError(null)
    setSuccess(false)

    try {
      if (mode === 'SHERLOCK' && !localSherlock) {
        setError('Avvia prima l’analisi Sherlock per usare questa modalità.')
        setGeneratingMode(null)
        return
      }
      const aiResponse = await generateAIResponse(
        reportDescription,
        ticketCode || undefined,
        localSherlock || null,
        mode
      )
      setResponse(aiResponse)
    } catch (err: any) {
      console.error('Errore generazione AI:', err)
      setError('Errore durante la generazione della bozza. Riprova più tardi.')
    } finally {
      setGeneratingMode(null)
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
    <div className="mt-8 pt-8 border-t border-slate-700">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Risposta al Segnalante
        </h3>

        {/* Banner Avviso Legale */}
        <div className="bg-slate-700/50 border-l-4 border-amber-500 p-4 my-4 rounded-r">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-amber-200">
                ⚠️ <strong>AVVISO:</strong> Questa è una bozza generata dall'AI. Si raccomanda caldamente di richiedere una consulenza legale prima dell'invio, poiché questa risposta non costituisce parere legale.
              </p>
            </div>
          </div>
        </div>

        {/* Bottoni Genera Bozza (loading solo sul pulsante cliccato) */}
        <div className="mb-4 flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => handleGenerate('SHERLOCK')}
            disabled={generatingMode !== null}
            variant="outline"
            className="w-full border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
          >
            {generatingMode === 'SHERLOCK' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Genera con Sherlock
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={() => handleGenerate('STANDARD')}
            disabled={generatingMode !== null}
            variant="outline"
            className="w-full border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
          >
            {generatingMode === 'STANDARD' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Genera Standard
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          ℹ️ Standard: Risposta generica formale. 🕵️ Sherlock: Include domande specifiche sui dati
          mancanti rilevati dall&apos;IA.
        </p>

        {/* Area di testo */}
        <div className="mb-4">
          <label
            htmlFor="admin-response"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Risposta al Segnalante
          </label>
          <textarea
            id="admin-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={12}
            className="w-full min-h-[300px] px-4 py-3 border border-slate-600 rounded-xl bg-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-y font-mono text-sm"
            placeholder="Scrivi qui la risposta al segnalante oppure usa il bottone 'Genera Bozza con AI' per creare una bozza automatica..."
          />
        </div>

        {/* Messaggi di errore/successo */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-xl">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-700 rounded-xl">
            <p className="text-sm text-emerald-300">
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
            className="min-w-[200px] bg-slate-600 text-slate-100 hover:bg-slate-500"
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
