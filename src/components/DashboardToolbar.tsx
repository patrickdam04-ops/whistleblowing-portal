'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Activity,
  Archive,
  ArrowUpDown,
  Filter,
  X,
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

const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critica' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Bassa' },
  { value: 'NULL', label: 'In valutazione' },
] as const

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'In attesa' },
  { value: 'IN_PROGRESS', label: 'In lavorazione' },
  { value: 'RESOLVED', label: 'Risolto' },
  { value: 'DISMISSED', label: 'Archiviato' },
] as const

const SLA_OPTIONS = [
  { value: '', label: 'Tutti' },
  { value: 'ok', label: 'Regolare' },
  { value: 'pending', label: 'In scadenza' },
  { value: 'overdue', label: 'Scaduto' },
] as const

interface FilterForm {
  q: string
  severity: string
  status: string
  anonimo: string
  dataDa: string
  dataA: string
  slaRiscontro: string
  slaEsito: string
}

export function DashboardToolbar({
  companies,
  selectedCompany,
  currentView,
  currentSort,
}: DashboardToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const baseParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    return params
  }, [searchParams])

  const filterQ = searchParams.get('q') ?? ''
  const filterSeverity = searchParams.get('severity') ?? ''
  const filterStatus = searchParams.get('status') ?? ''
  const filterAnonimo = searchParams.get('anonimo') ?? ''
  const filterDataDa = searchParams.get('dataDa') ?? ''
  const filterDataA = searchParams.get('dataA') ?? ''
  const filterSlaRiscontro = searchParams.get('slaRiscontro') ?? ''
  const filterSlaEsito = searchParams.get('slaEsito') ?? ''

  const hasActiveFilter =
    filterQ || filterSeverity || filterStatus || filterAnonimo ||
    filterDataDa || filterDataA || filterSlaRiscontro || filterSlaEsito

  const updateParams = (next: Partial<{
    view: ViewMode
    sort: SortMode
    q: string
    severity: string
    status: string
    anonimo: string
    dataDa: string
    dataA: string
    slaRiscontro: string
    slaEsito: string
  }>) => {
    const params = new URLSearchParams(baseParams.toString())
    if (next.view !== undefined) params.set('view', next.view)
    if (next.sort !== undefined) params.set('sort', next.sort)
    const filterKeys = ['q', 'severity', 'status', 'anonimo', 'dataDa', 'dataA', 'slaRiscontro', 'slaEsito'] as const
    filterKeys.forEach((key) => {
      if (next[key] !== undefined) {
        if (next[key]) params.set(key, next[key]!)
        else params.delete(key)
      }
    })
    router.push(`/dashboard?${params.toString()}`)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    if (filterOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const handleApplyFilter = (form: FilterForm) => {
    updateParams({
      q: form.q.trim() || '',
      severity: form.severity || '',
      status: form.status || '',
      anonimo: form.anonimo || '',
      dataDa: form.dataDa || '',
      dataA: form.dataA || '',
      slaRiscontro: form.slaRiscontro || '',
      slaEsito: form.slaEsito || '',
    })
    setFilterOpen(false)
  }

  const handleClearFilter = () => {
    updateParams({
      q: '', severity: '', status: '', anonimo: '',
      dataDa: '', dataA: '', slaRiscontro: '', slaEsito: '',
    })
    setFilterOpen(false)
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 shadow-card">
        <CompanySwitcher companies={companies} selectedCompany={selectedCompany} />

        <div className="hidden sm:block h-6 w-px bg-slate-600" aria-hidden />

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

        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              hasActiveFilter
                ? 'border-amber-600/60 bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
                : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtra
            {hasActiveFilter && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
            )}
          </button>

          {filterOpen && (
            <FilterPanel
              initialQ={filterQ}
              initialSeverity={filterSeverity}
              initialStatus={filterStatus}
              initialAnonimo={filterAnonimo}
              initialDataDa={filterDataDa}
              initialDataA={filterDataA}
              initialSlaRiscontro={filterSlaRiscontro}
              initialSlaEsito={filterSlaEsito}
              onApply={handleApplyFilter}
              onClear={handleClearFilter}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-600" aria-hidden />

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
    </div>
  )
}

function FilterPanel({
  initialQ,
  initialSeverity,
  initialStatus,
  initialAnonimo,
  initialDataDa,
  initialDataA,
  initialSlaRiscontro,
  initialSlaEsito,
  onApply,
  onClear,
  onClose,
}: {
  initialQ: string
  initialSeverity: string
  initialStatus: string
  initialAnonimo: string
  initialDataDa: string
  initialDataA: string
  initialSlaRiscontro: string
  initialSlaEsito: string
  onApply: (form: FilterForm) => void
  onClear: () => void
  onClose: () => void
}) {
  const [q, setQ] = useState(initialQ)
  const [severity, setSeverity] = useState(initialSeverity)
  const [status, setStatus] = useState(initialStatus)
  const [anonimo, setAnonimo] = useState(initialAnonimo)
  const [dataDa, setDataDa] = useState(initialDataDa)
  const [dataA, setDataA] = useState(initialDataA)
  const [slaRiscontro, setSlaRiscontro] = useState(initialSlaRiscontro)
  const [slaEsito, setSlaEsito] = useState(initialSlaEsito)

  useEffect(() => {
    setQ(initialQ)
    setSeverity(initialSeverity)
    setStatus(initialStatus)
    setAnonimo(initialAnonimo)
    setDataDa(initialDataDa)
    setDataA(initialDataA)
    setSlaRiscontro(initialSlaRiscontro)
    setSlaEsito(initialSlaEsito)
  }, [initialQ, initialSeverity, initialStatus, initialAnonimo, initialDataDa, initialDataA, initialSlaRiscontro, initialSlaEsito])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply({ q, severity, status, anonimo, dataDa, dataA, slaRiscontro, slaEsito })
  }

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <span className="text-sm font-semibold text-slate-200">Filtra segnalazioni</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label htmlFor="filter-q" className="block text-xs font-medium text-slate-400 mb-1">
            Cerca in descrizione
          </label>
          <input
            id="filter-q"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Testo..."
            className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Gravità</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Tutte</option>
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Stato</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Tutti</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Anonimo</label>
          <select
            value={anonimo}
            onChange={(e) => setAnonimo(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Tutti</option>
            <option value="si">Sì</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-dataDa" className="block text-xs font-medium text-slate-400 mb-1">Data da</label>
            <input
              id="filter-dataDa"
              type="date"
              value={dataDa}
              onChange={(e) => setDataDa(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label htmlFor="filter-dataA" className="block text-xs font-medium text-slate-400 mb-1">Data a</label>
            <input
              id="filter-dataA"
              type="date"
              value={dataA}
              onChange={(e) => setDataA(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">SLA 7 gg</label>
            <select
              value={slaRiscontro}
              onChange={(e) => setSlaRiscontro(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
            >
              {SLA_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">SLA 90 gg</label>
            <select
              value={slaEsito}
              onChange={(e) => setSlaEsito(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-slate-500"
            >
              {SLA_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            Azzera
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-500"
          >
            Applica
          </button>
        </div>
      </form>
    </div>
  )
}
