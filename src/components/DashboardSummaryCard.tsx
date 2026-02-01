'use client'

import { useState } from 'react'
import { FileText, Loader2, Sparkles } from 'lucide-react'
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
    <div className="bg-slate-800 rounded-2xl shadow-card border border-slate-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-100">
            Riepilogo situazione
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="shrink-0 border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generazione...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Genera riepilogo
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-900/30 text-red-300 text-sm px-4 py-3 mt-4">
          {error}
        </div>
      )}

      {summary && (
        <div className="rounded-xl bg-slate-700/50 border border-slate-600 p-4 text-sm text-slate-200 leading-relaxed mt-4">
          {summary}
        </div>
      )}
    </div>
  )
}
