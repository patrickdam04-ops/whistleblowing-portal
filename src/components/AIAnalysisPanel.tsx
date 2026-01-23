'use client'

import { useState } from 'react'
import { analyzeReport, type AIAnalysisResult } from '@/app/actions/analyze-report'
import { Sparkles, Loader2, AlertTriangle, CheckCircle, AlertCircle, Lightbulb, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIAnalysisPanelProps {
  description: string
}

export function AIAnalysisPanel({ description }: AIAnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const result = await analyzeReport(description)
      setAnalysis(result)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Errore durante l\'analisi. Riprova più tardi.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-slate-300'
    }
  }

  const getRiskIcon = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'HIGH':
        return AlertTriangle
      case 'MEDIUM':
        return AlertCircle
      case 'LOW':
        return CheckCircle
      default:
        return AlertCircle
    }
  }

  const getRiskLabel = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'HIGH':
        return 'Alto Rischio'
      case 'MEDIUM':
        return 'Rischio Medio'
      case 'LOW':
        return 'Basso Rischio'
      default:
        return risk
    }
  }

  return (
    <div className="mt-6">
      {!analysis && !isLoading && !error && (
        <Button
          onClick={handleAnalyze}
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analizza con AI
        </Button>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">L'AI sta analizzando la segnalazione...</p>
              <p className="text-xs text-blue-700 mt-1">Questo potrebbe richiedere alcuni secondi</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Errore durante l'analisi</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              <Button
                onClick={handleAnalyze}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Riprova
              </Button>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Analisi AI</h3>
          </div>

          {/* Risk Level */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Livello di Rischio:</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium ${getRiskColor(analysis.risk_level)}`}>
              {(() => {
                const Icon = getRiskIcon(analysis.risk_level)
                return (
                  <>
                    <Icon className="w-5 h-5" />
                    <span>{getRiskLabel(analysis.risk_level)}</span>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-gray-700">Riassunto:</span>
            </div>
            <p className="text-sm text-gray-800 bg-white rounded-lg p-3 border border-slate-200">
              {analysis.summary}
            </p>
          </div>

          {/* Recommended Actions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-gray-700">Azioni Consigliate:</span>
            </div>
            <ul className="space-y-2">
              {analysis.recommended_actions.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-800 bg-white rounded-lg p-3 border border-slate-200"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium mt-0.5">
                    {index + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Re-analyze button */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <Button
              onClick={handleAnalyze}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analizza di nuovo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

