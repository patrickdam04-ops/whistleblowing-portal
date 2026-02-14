'use client'

import { useState, useTransition } from 'react'
import { generateLegalAnalysis, type LegalAnalysisResult } from '@/app/(public)/actions/generate-legal-analysis'
import { saveLegalAnalysis } from '@/app/dashboard/[id]/actions'
import { Button } from '@/components/ui/button'
import { Scale, Loader2, AlertTriangle } from 'lucide-react'

interface LegalAnalysisCardProps {
  description: string
  reportId?: string
  initialAnalysis?: LegalAnalysisResult | Record<string, unknown> | null
  compact?: boolean
  dark?: boolean
}

function isLegalResult(v: unknown): v is LegalAnalysisResult {
  return (
    !!v &&
    typeof v === 'object' &&
    'livello_rischio' in v &&
    Array.isArray((v as LegalAnalysisResult).reati_ipotizzati)
  )
}

export function LegalAnalysisCard({ description, reportId, initialAnalysis, compact, dark }: LegalAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<LegalAnalysisResult | null>(() =>
    isLegalResult(initialAnalysis) ? initialAnalysis : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      const result = await generateLegalAnalysis(description)
      if (result.ok) {
        setAnalysis(result.data)
        if (reportId) {
          await saveLegalAnalysis(reportId, result.data as Record<string, unknown>)
        }
      } else {
        setError(result.error)
      }
    })
  }

  const getRiskBadge = (risk: LegalAnalysisResult['livello_rischio']) => {
    if (dark) {
      switch (risk) {
        case 'ALTO':
          return 'bg-red-900/40 text-red-300 border-red-700'
        case 'MEDIO':
          return 'bg-amber-900/40 text-amber-300 border-amber-700'
        case 'BASSO':
          return 'bg-slate-700 text-slate-300 border-slate-600'
        default:
          return 'bg-slate-700 text-slate-300 border-slate-600'
      }
    }
    switch (risk) {
      case 'ALTO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'BASSO':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-slate-300'
    }
  }

  return (
    <div className={compact ? '' : dark ? 'mt-6 pt-6 border-t border-slate-700' : 'mt-8 pt-8 border-t border-slate-200'}>
      <div className={dark ? 'bg-slate-800 rounded-2xl border border-slate-700 p-6' : 'bg-white rounded-lg border border-slate-200 p-6'}>
        <div className="flex items-center gap-2 mb-4">
          <Scale className={`w-5 h-5 ${dark ? 'text-slate-400' : 'text-gray-700'}`} />
          <h3 className={`text-lg font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Categorizzazione Legale Automatica</h3>
        </div>

        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={isPending}
          variant="outline"
          className={`w-full sm:w-auto mb-4 ${dark ? 'border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-slate-100' : ''}`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisi in corso...
            </>
          ) : analysis ? (
            'Rianalizza'
          ) : (
            'Avvia Analisi Legale'
          )}
        </Button>

        <div className={dark ? 'bg-slate-700/50 border border-slate-600 rounded-xl p-4 mb-4' : 'bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4'}>
          <p className={`text-sm ${dark ? 'text-amber-200' : 'text-yellow-800'}`}>
            ⚠️ AVVISO IMPORTANTE: Questa analisi è generata dall'Intelligenza Artificiale e ha
            scopo puramente indicativo. L'IA può commettere errori e non sostituisce in alcun
            modo il parere di un avvocato o di un ufficio legale competente. Si consiglia sempre
            di richiedere una consulenza legale professionale prima di intraprendere azioni.
          </p>
        </div>

        {error && (
          <div className={dark ? 'bg-red-900/30 border border-red-700 rounded-xl p-4 mb-4' : 'bg-red-50 border border-red-200 rounded-lg p-4 mb-4'}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${dark ? 'text-red-400' : 'text-red-600'}`} />
              <p className={dark ? 'text-sm text-red-300' : 'text-sm text-red-800'}>{error}</p>
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
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Reati ipotizzati</h4>
              {analysis.reati_ipotizzati.length === 0 ? (
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Nessuna voce rilevata</p>
              ) : (
                <ul className={`list-disc list-inside text-sm space-y-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {analysis.reati_ipotizzati.map((item, idx) => (
                    <li key={`reato-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Riferimenti normativi</h4>
              {analysis.riferimenti_normativi.length === 0 ? (
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Nessuna voce rilevata</p>
              ) : (
                <ul className={`list-disc list-inside text-sm space-y-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {analysis.riferimenti_normativi.map((item, idx) => (
                    <li key={`norma-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Suggerimenti azione</h4>
              {analysis.suggerimenti_azione.length === 0 ? (
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Nessuna voce rilevata</p>
              ) : (
                <ul className={`list-disc list-inside text-sm space-y-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
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
