'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import {
  Activity,
  Archive,
  ArrowUpDown,
  FileText,
} from 'lucide-react'
import { CompanySwitcher } from '@/components/CompanySwitcher'
import type { CompanyStats } from '@/lib/sla-utils'

type ViewMode = 'active' | 'archived'
type SortMode = 'recent' | 'severity'

interface CompanyWithStats {
  id: string
  label: string
  stats: CompanyStats
}

interface DashboardToolbarProps {
  companies: CompanyWithStats[]
  selectedCompany: string
  currentView: ViewMode
  currentSort: SortMode
}

export function DashboardToolbar({
  companies,
  selectedCompany,
  currentView,
  currentSort,
}: DashboardToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const baseParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    return params
  }, [searchParams])

  const updateParams = (next: Partial<{ view: ViewMode; sort: SortMode }>) => {
    const params = new URLSearchParams(baseParams.toString())
    if (next.view) {
      params.set('view', next.view)
    }
    if (next.sort) {
      params.set('sort', next.sort)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  const scrollToRiepilogo = () => {
    document.getElementById('riepilogo-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 shadow-card mb-6">
      {/* Azienda */}
      <CompanySwitcher companies={companies} selectedCompany={selectedCompany} />

      <div className="hidden sm:block h-6 w-px bg-slate-600" aria-hidden />

      {/* Attive | Archivio */}
      <div className="inline-flex rounded-lg border border-slate-600 bg-slate-700/50 p-0.5">
        <button
          type="button"
          onClick={() => updateParams({ view: 'active' })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === 'active'
              ? 'bg-slate-600 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          Attive
        </button>
        <button
          type="button"
          onClick={() => updateParams({ view: 'archived' })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === 'archived'
              ? 'bg-slate-600 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="h-4 w-4" />
          Archivio
        </button>
      </div>

      <div className="hidden sm:block h-6 w-px bg-slate-600" aria-hidden />

      {/* Riepilogo - scroll to section */}
      <button
        type="button"
        onClick={scrollToRiepilogo}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 transition-colors"
      >
        <FileText className="h-4 w-4" />
        Riepilogo
      </button>

      <div className="hidden sm:block h-6 w-px bg-slate-600" aria-hidden />

      {/* Ordina per */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
        <label htmlFor="sort" className="text-sm text-slate-400 whitespace-nowrap">
          Ordina per
        </label>
        <select
          id="sort"
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value as SortMode })}
          className="border border-slate-600 rounded-lg bg-slate-700/50 text-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
        >
          <option value="recent">Più recenti</option>
          <option value="severity">Priorità / Rischio</option>
        </select>
      </div>
    </div>
  )
}
