'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type ViewMode = 'active' | 'archived'
type SortMode = 'recent' | 'severity'

interface DashboardFiltersProps {
  currentView: ViewMode
  currentSort: SortMode
}

export function DashboardFilters({ currentView, currentSort }: DashboardFiltersProps) {
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => updateParams({ view: 'active' })}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            currentView === 'active'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attive
        </button>
        <button
          type="button"
          onClick={() => updateParams({ view: 'archived' })}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            currentView === 'archived'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Archivio
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm text-slate-600">
          Ordina per
        </label>
        <select
          id="sort"
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value as SortMode })}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="recent">Più Recenti</option>
          <option value="severity">Priorità/Rischio</option>
        </select>
      </div>
    </div>
  )
}
