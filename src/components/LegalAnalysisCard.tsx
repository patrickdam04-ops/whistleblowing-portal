'use client'

import { useState, useTransition } from 'react'
import { generateLegalAnalysis, type LegalAnalysisResult } from '@/app/(public)/actions/generate-legal-analysis'
import { Button } from '@/components/ui/button'
import { Scale, Loader2, AlertTriangle } from 'lucide-react'

interface LegalAnalysisCardProps {
  description: string
}

export function LegalAnalysisCard({ description }: LegalAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<LegalAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await generateLegalAnalysis(description)
        setAnalysis(result)
      } catch (err: any) {
        console.error('Errore analisi legale:', err)
        setError(err?.message || 'Errore durante l\'analisi legale')
      }
    })
  }

  const getRiskBadge = (risk: LegalAnalysisResult['livello_rischio']) => {
    switch (risk) {
      case 'ALTO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'BASSO':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Categorizzazione Legale Automatica</h3>
        </div>

        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={isPending}
          variant="outline"
          className="w-full sm:w-auto mb-4"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            'Avvia Analisi Legale IA (Gemini 2.0)'
          )}
        </Button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ AVVISO IMPORTANTE: Questa analisi è generata dall'Intelligenza Artificiale e ha
            scopo puramente indicativo. L'IA può commettere errori e non sostituisce in alcun
            modo il parere di un avvocato o di un ufficio legale competente. Si consiglia sempre
            di richiedere una consulenza legale professionale prima di intraprendere azioni.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskBadge(analysis.livello_rischio)}`}>
                Rischio: {analysis.livello_rischio}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Reati ipotizzati</h4>
              {analysis.reati_ipotizzati.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna voce rilevata</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {analysis.reati_ipotizzati.map((item, idx) => (
                    <li key={`reato-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Riferimenti normativi</h4>
              {analysis.riferimenti_normativi.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna voce rilevata</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {analysis.riferimenti_normativi.map((item, idx) => (
                    <li key={`norma-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggerimenti azione</h4>
              {analysis.suggerimenti_azione.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna voce rilevata</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {analysis.suggerimenti_azione.map((item, idx) => (
                    <li key={`azione-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
