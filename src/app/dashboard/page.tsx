export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, AlertCircle, Calendar, AlertTriangle, Activity, Clock, FileText, EyeOff } from 'lucide-react'
import { ReportRow } from './report-row'
import { DashboardToolbar } from '@/components/DashboardToolbar'
import { LogoutButton } from '@/components/LogoutButton'
import { DashboardSummaryCard } from '@/components/DashboardSummaryCard'
import { computeCompanyStats, getEmptyCompanyStats, getInitialFeedbackStatus, getFinalOutcomeStatus } from '@/lib/sla-utils'

interface Report {
  id: string
  created_at: string
  description: string
  is_anonymous: boolean
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  encrypted_contact_info: string | null
  company_id: string | null
  acknowledged_at: string | null
}

interface PageProps {
  searchParams?: {
    view?: 'active' | 'archived'
    sort?: 'recent' | 'severity'
    company?: string | string[]
    q?: string
    severity?: string
    status?: string
    anonimo?: string
    dataDa?: string
    dataA?: string
    slaRiscontro?: string
    slaEsito?: string
  }
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = createClient()

  // Verifica autenticazione
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/gestione')
  }

  const userEmail = user?.email?.toLowerCase() || ''

  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_members')
    .select(
      `
      tenants (
        name,
        slug
      )
    `
    )
    .eq('user_id', user.id)

  if (membershipError) {
    console.error('Errore durante il recupero dei tenant:', membershipError)
  }

  const companyOptions = (memberships || [])
    .map((row: any) => {
      const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants
      const id = tenant?.slug || tenant?.name
      if (!id) return null
      return {
        id,
        label: tenant?.name || id,
      }
    })
    .filter(Boolean) as { id: string; label: string }[]

  const allowedCompanyIds = companyOptions.map((company) => company.id)

  if (!userEmail || allowedCompanyIds.length === 0) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-slate-400" />
              <h1 className="text-3xl font-bold text-slate-100">Gestione Segnalazioni</h1>
            </div>
            <p className="text-sm text-slate-400">
              Area riservata al Responsabile della gestione delle segnalazioni (Art. 12 D.Lgs 24/2023)
            </p>
          </div>

          <div className="rounded-xl border border-slate-600 bg-slate-800 text-slate-200 px-4 py-3 text-sm">
            Nessuna azienda assegnata per questa utenza.
          </div>
        </div>
      </div>
    )
  }

  const selectedCompanyParam = getParam(searchParams?.company)
  const selectedCompany = allowedCompanyIds.includes(selectedCompanyParam || '')
    ? (selectedCompanyParam as string)
    : allowedCompanyIds[0]
  const selectedCompanyLabel =
    companyOptions.find((company) => company.id === selectedCompany)?.label || selectedCompany

  if (!selectedCompany) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-slate-400" />
              <h1 className="text-3xl font-bold text-slate-100">Gestione Segnalazioni</h1>
            </div>
            <p className="text-sm text-slate-400">
              Area riservata al Responsabile della gestione delle segnalazioni (Art. 12 D.Lgs 24/2023)
            </p>
          </div>

          <div className="rounded-xl border border-slate-600 bg-slate-800 text-amber-400 px-4 py-3 text-sm">
            Nessuna azienda selezionata. Seleziona un&apos;azienda dal menu per continuare.
          </div>
        </div>
      </div>
    )
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .in('company_id', allowedCompanyIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore durante il recupero delle segnalazioni:', error)
  }

  const reportsData = (reports || []) as Report[]
  const reportsForSelected = reportsData.filter((r) => r.company_id === selectedCompany)

  const companyStats = computeCompanyStats(reportsData)
  const companiesWithStats = companyOptions.map((c) => ({
    ...c,
    stats: companyStats[c.id] ?? getEmptyCompanyStats(),
  }))

  const currentView = searchParams?.view === 'archived' ? 'archived' : 'active'
  const currentSort = searchParams?.sort === 'severity' ? 'severity' : 'recent'

  let filteredReports = reportsForSelected.filter((report) =>
    currentView === 'archived' ? report.status === 'RESOLVED' : report.status !== 'RESOLVED'
  )

  const filterQ = (getParam(searchParams?.q) || '').trim().toLowerCase()
  const filterSeverity = getParam(searchParams?.severity)
  const filterStatus = getParam(searchParams?.status)
  const filterAnonimo = getParam(searchParams?.anonimo)
  const filterDataDa = getParam(searchParams?.dataDa)
  const filterDataA = getParam(searchParams?.dataA)
  const filterSlaRiscontro = getParam(searchParams?.slaRiscontro)
  const filterSlaEsito = getParam(searchParams?.slaEsito)

  if (filterQ) {
    filteredReports = filteredReports.filter((r) =>
      r.description.toLowerCase().includes(filterQ)
    )
  }
  if (filterSeverity) {
    filteredReports = filteredReports.filter((r) =>
      filterSeverity === 'NULL'
        ? r.severity === null
        : r.severity === filterSeverity
    )
  }
  if (filterStatus) {
    filteredReports = filteredReports.filter((r) => r.status === filterStatus)
  }
  if (filterAnonimo === 'si' || filterAnonimo === 'sì') {
    filteredReports = filteredReports.filter((r) => r.is_anonymous)
  } else if (filterAnonimo === 'no') {
    filteredReports = filteredReports.filter((r) => !r.is_anonymous)
  }
  if (filterDataDa) {
    const da = new Date(filterDataDa)
    da.setHours(0, 0, 0, 0)
    filteredReports = filteredReports.filter((r) => new Date(r.created_at) >= da)
  }
  if (filterDataA) {
    const a = new Date(filterDataA)
    a.setHours(23, 59, 59, 999)
    filteredReports = filteredReports.filter((r) => new Date(r.created_at) <= a)
  }
  if (filterSlaRiscontro) {
    filteredReports = filteredReports.filter((r) => {
      const status = getInitialFeedbackStatus(r)
      return status === filterSlaRiscontro
    })
  }
  if (filterSlaEsito) {
    filteredReports = filteredReports.filter((r) => {
      const status = getFinalOutcomeStatus(r)
      return status === filterSlaEsito
    })
  }

  const severityRank: Record<NonNullable<Report['severity']>, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  }

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (currentSort === 'severity') {
      const rankA = a.severity ? severityRank[a.severity] : 0
      const rankB = b.severity ? severityRank[b.severity] : 0
      if (rankA !== rankB) {
        return rankB - rankA
      }
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-slate-400" />
              <h1 className="text-3xl font-bold text-slate-100">Gestione Segnalazioni</h1>
            </div>
            <p className="text-sm text-slate-400">
              Area riservata al Responsabile della gestione delle segnalazioni (Art. 12 D.Lgs 24/2023)
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              Pannello per: <span className="text-slate-100">{selectedCompanyLabel}</span>
              <span className="text-slate-500 font-normal"> — Le segnalazioni atterrano su questa azienda.</span>
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-400/90">
              Conformità al 100% al D.Lgs. 24/2023 e alla Direttiva UE 2019/1937
            </p>
          </div>
          <LogoutButton />
        </div>

        <DashboardToolbar
          companies={companiesWithStats}
          selectedCompany={selectedCompany}
          currentView={currentView}
          currentSort={currentSort}
        />

        <div id="riepilogo-section" className="mb-6">
          <DashboardSummaryCard
            selectedCompanyId={selectedCompany}
            selectedCompanyLabel={selectedCompanyLabel}
          />
        </div>

        {/* Tabella */}
        {sortedReports.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl shadow-card border border-slate-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-200 mb-2">
              Nessuna segnalazione trovata
            </p>
            <p className="text-sm text-slate-400">
              Le segnalazioni corrispondenti ai filtri appariranno qui.
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl shadow-card border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Data
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Gravità
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Stato
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        SLA
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Descrizione
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        <EyeOff className="h-3.5 w-3.5" />
                        Anonimo
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {sortedReports.map((report) => (
                    <ReportRow key={report.id} report={report} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer con conteggio */}
        {sortedReports.length > 0 && (
          <div className="mt-4 text-sm text-slate-400">
            Totale segnalazioni: <span className="font-medium text-slate-200">{sortedReports.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
