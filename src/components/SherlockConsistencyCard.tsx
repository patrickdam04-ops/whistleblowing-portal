'use client'

import { useState, useTransition } from 'react'
import { analyzeConsistency, type ConsistencyAnalysisResult } from '@/app/(public)/actions/analyze-consistency'
import { saveSherlockAnalysis } from '@/app/dashboard/[id]/actions'
import { Button } from '@/components/ui/button'
import { Search, Loader2, AlertTriangle } from 'lucide-react'

interface SherlockConsistencyCardProps {
  description: string
  reportId?: string
  initialAnalysis?: ConsistencyAnalysisResult | Record<string, unknown> | null
  compact?: boolean
  dark?: boolean
  onAnalysis?: (analysis: ConsistencyAnalysisResult) => void
}

function isConsistencyResult(v: unknown): v is ConsistencyAnalysisResult {
  return !!v && typeof v === 'object' && 'score_solidita' in v && typeof (v as ConsistencyAnalysisResult).score_solidita === 'number'
}

export function SherlockConsistencyCard({ description, reportId, initialAnalysis, compact, dark, onAnalysis }: SherlockConsistencyCardProps) {
  const [analysis, setAnalysis] = useState<ConsistencyAnalysisResult | null>(() =>
    isConsistencyResult(initialAnalysis) ? initialAnalysis : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      const result = await analyzeConsistency(description)
      if (result.ok) {
        setAnalysis(result.data)
        onAnalysis?.(result.data)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sherlock:analysis', { detail: result.data }))
        }
        if (reportId) {
          await saveSherlockAnalysis(reportId, result.data as Record<string, unknown>)
        }
      } else {
        setError(result.error)
      }
    })
  }

  const getScoreColor = (score: number) => {
    if (score < 40) return 'bg-red-500'
    if (score < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={compact ? '' : dark ? 'mt-6 pt-6 border-t border-slate-700' : 'mt-8 pt-8 border-t border-slate-200'}>
      <div className={dark ? 'bg-slate-800 rounded-2xl border border-slate-700 p-6' : 'bg-white rounded-lg border border-slate-200 p-6'}>
        <div className="flex items-center gap-2 mb-4">
          <Search className={`w-5 h-5 ${dark ? 'text-slate-400' : 'text-gray-700'}`} />
          <h3 className={`text-lg font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
            🕵️‍♂️ Sherlock AI - Analisi Coerenza
          </h3>
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
            'Analizza Coerenza'
          )}
        </Button>

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
            <div>
              <p className={`text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Punteggio di Solidità</p>
              <div className={`w-full rounded-full h-3 overflow-hidden ${dark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-3 ${getScoreColor(analysis.score_solidita)}`}
                  style={{ width: `${analysis.score_solidita}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{analysis.score_solidita}/100</p>
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Incoerenze rilevate</h4>
              {analysis.incoerenze_rilevate.length === 0 ? (
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Nessuna incoerenza evidente</p>
              ) : (
                <ul className={`list-disc list-inside text-sm space-y-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {analysis.incoerenze_rilevate.map((item, idx) => (
                    <li key={`inc-${idx}`}>⚠️ {item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Dati mancanti</h4>
              {analysis.buchi_narrativi.length === 0 ? (
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Nessun buco narrativo evidente</p>
              ) : (
                <ul className={`list-disc list-inside text-sm space-y-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {analysis.buchi_narrativi.map((item, idx) => (
                    <li key={`gap-${idx}`}>⚠️ {item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Consiglio investigativo</h4>
              <p className={dark ? 'text-sm text-slate-300' : 'text-sm text-gray-700'}>{analysis.consiglio_investigativo}</p>
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Analisi emotiva</h4>
              <p className={dark ? 'text-sm text-slate-300' : 'text-sm text-gray-700'}>
                Emozione dominante:{' '}
                <span className="font-medium">{analysis.emotional_profile.dominant_emotion}</span>
              </p>
              <p className={dark ? 'text-sm text-slate-300' : 'text-sm text-gray-700'}>
                Intensità:{' '}
                <span className="font-medium">{analysis.emotional_profile.intensity}</span>
              </p>
              {analysis.emotional_profile.stress_indicators.length === 0 ? (
                <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nessun indicatore di stress evidente
                </p>
              ) : (
                <ul className={`list-disc list-inside text-sm space-y-1 mt-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {analysis.emotional_profile.stress_indicators.map((item, idx) => (
                    <li key={`stress-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-900'}`}>Rilevamento futilità</h4>
              <p className={dark ? 'text-sm text-slate-300' : 'text-sm text-gray-700'}>
                Probabile futilità:{' '}
                <span className="font-medium">
                  {analysis.frivolity_check.is_likely_futile ? 'Sì' : 'No'}
                </span>
              </p>
              <p className={dark ? 'text-sm text-slate-300' : 'text-sm text-gray-700'}>
                Natura: <span className="font-medium">{analysis.frivolity_check.nature}</span>
              </p>
              <p className={dark ? 'text-sm text-slate-300' : 'text-sm text-gray-700'}>{analysis.frivolity_check.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
