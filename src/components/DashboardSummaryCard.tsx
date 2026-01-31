'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { generateDashboardSummary } from '@/app/actions/generate-dashboard-summary'
import { Button } from '@/components/ui/button'

interface DashboardSummaryCardProps {
  selectedCompanyId: string
  selectedCompanyLabel: string
}

export function DashboardSummaryCard({
  selectedCompanyId,
  selectedCompanyLabel,
}: DashboardSummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setError(null)
    setSummary(null)
    setLoading(true)
    try {
      const result = await generateDashboardSummary(
        selectedCompanyId,
        selectedCompanyLabel
      )
      if (result.success) {
        setSummary(result.summary)
      } else {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Riepilogo situazione
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generazione...
            </>
          ) : (
            'Genera riepilogo'
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        Riassunto narrativo delle segnalazioni per l&apos;azienda selezionata
        (senza riferimenti a periodi temporali).
      </p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {summary && (
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/60 p-4 text-sm text-slate-800 leading-relaxed">
          {summary}
        </div>
      )}

      {!summary && !error && !loading && (
        <p className="text-sm text-slate-500 italic">
          Clicca &quot;Genera riepilogo&quot; per ottenere un riassunto della
          situazione delle segnalazioni.
        </p>
      )}
    </div>
  )
}
