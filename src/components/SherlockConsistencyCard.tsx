'use client'

import { useState, useTransition } from 'react'
import { analyzeConsistency, type ConsistencyAnalysisResult } from '@/app/(public)/actions/analyze-consistency'
import { Button } from '@/components/ui/button'
import { Search, Loader2, AlertTriangle } from 'lucide-react'

interface SherlockConsistencyCardProps {
  description: string
  compact?: boolean
  onAnalysis?: (analysis: ConsistencyAnalysisResult) => void
}

export function SherlockConsistencyCard({ description, compact, onAnalysis }: SherlockConsistencyCardProps) {
  const [analysis, setAnalysis] = useState<ConsistencyAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await analyzeConsistency(description)
        setAnalysis(result)
        onAnalysis?.(result)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sherlock:analysis', { detail: result }))
        }
      } catch (err: any) {
        console.error('Errore analisi coerenza:', err)
        setError(err?.message || 'Errore durante l\'analisi di coerenza.')
      }
    })
  }

  const getScoreColor = (score: number) => {
    if (score < 40) return 'bg-red-500'
    if (score < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={compact ? '' : 'mt-8 pt-8 border-t border-slate-200'}>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-slate-900">
            🕵️‍♂️ Sherlock AI - Analisi Coerenza
          </h3>
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
            'Analizza Coerenza'
          )}
        </Button>

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
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Punteggio di Solidità</p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 ${getScoreColor(analysis.score_solidita)}`}
                  style={{ width: `${analysis.score_solidita}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{analysis.score_solidita}/100</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Incoerenze rilevate</h4>
              {analysis.incoerenze_rilevate.length === 0 ? (
                <p className="text-sm text-slate-500">Nessuna incoerenza evidente</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {analysis.incoerenze_rilevate.map((item, idx) => (
                    <li key={`inc-${idx}`}>⚠️ {item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Dati mancanti</h4>
              {analysis.buchi_narrativi.length === 0 ? (
                <p className="text-sm text-slate-500">Nessun buco narrativo evidente</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {analysis.buchi_narrativi.map((item, idx) => (
                    <li key={`gap-${idx}`}>⚠️ {item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Consiglio investigativo</h4>
              <p className="text-sm text-gray-700">{analysis.consiglio_investigativo}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Analisi emotiva</h4>
              <p className="text-sm text-gray-700">
                Emozione dominante:{' '}
                <span className="font-medium">{analysis.emotional_profile.dominant_emotion}</span>
              </p>
              <p className="text-sm text-gray-700">
                Intensità:{' '}
                <span className="font-medium">{analysis.emotional_profile.intensity}</span>
              </p>
              {analysis.emotional_profile.stress_indicators.length === 0 ? (
                <p className="text-sm text-slate-500 mt-1">
                  Nessun indicatore di stress evidente
                </p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-1">
                  {analysis.emotional_profile.stress_indicators.map((item, idx) => (
                    <li key={`stress-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Rilevamento futilità</h4>
              <p className="text-sm text-gray-700">
                Probabile futilità:{' '}
                <span className="font-medium">
                  {analysis.frivolity_check.is_likely_futile ? 'Sì' : 'No'}
                </span>
              </p>
              <p className="text-sm text-gray-700">
                Natura: <span className="font-medium">{analysis.frivolity_check.nature}</span>
              </p>
              <p className="text-sm text-gray-700">{analysis.frivolity_check.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
