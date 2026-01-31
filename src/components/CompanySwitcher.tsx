'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import type { CompanyStats } from '@/lib/sla-utils'

interface CompanyWithStats {
  id: string
  label: string
  stats: CompanyStats
}

interface CompanySwitcherProps {
  companies: CompanyWithStats[]
  selectedCompany?: string
}

export function CompanySwitcher({ companies, selectedCompany }: CompanySwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(() => {
    return companies.find((c) => c.id === selectedCompany)?.label || 'Seleziona azienda'
  }, [companies, selectedCompany])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleSelect = (companyId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('company', companyId)
    router.push(`/dashboard?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Seleziona azienda"
      >
        <span className="font-medium">Azienda:</span>
        <span>{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-[320px] max-w-xl rounded-lg border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          <div className="border-b border-slate-200 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Aziende da monitorare
            </p>
          </div>
          <ul className="max-h-[70vh] overflow-y-auto py-2">
            {companies.map((company) => {
              const s = company.stats
              const isSelected = company.id === selectedCompany
              const hasUrgency =
                s.critical > 0 ||
                s.initialOverdue > 0 ||
                s.initialDueSoon > 0 ||
                s.finalOverdue > 0 ||
                s.finalDueSoon > 0
              return (
                <li key={company.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(company.id)}
                    className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50 ring-inset ring-1 ring-blue-200' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {company.label}
                      </span>
                      {hasUrgency && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                          Attenzione
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                        Da completare: {s.pending}
                      </span>
                      {s.critical > 0 && (
                        <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-800">
                          Critiche: {s.critical}
                        </span>
                      )}
                      {s.initialOverdue > 0 && (
                        <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-800">
                          Riscontro 7 gg scaduti: {s.initialOverdue}
                        </span>
                      )}
                      {s.initialDueSoon > 0 && (
                        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                          Riscontro 7 gg in scadenza: {s.initialDueSoon}
                        </span>
                      )}
                      {s.finalOverdue > 0 && (
                        <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-800">
                          Esito 90 gg scaduti: {s.finalOverdue}
                        </span>
                      )}
                      {s.finalDueSoon > 0 && (
                        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                          Esito 90 gg in scadenza: {s.finalDueSoon}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
