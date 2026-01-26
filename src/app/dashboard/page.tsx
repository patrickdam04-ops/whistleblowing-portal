import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, AlertCircle } from 'lucide-react'
import { ReportRow } from './report-row'
import { DashboardFilters } from '@/components/DashboardFilters'

interface Report {
  id: string
  created_at: string
  description: string
  is_anonymous: boolean
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  encrypted_contact_info: string | null
  company_id: string | null
}

const TENANT_PERMISSIONS: Record<string, string[]> = {
  'demo@studiorock.it': ['StudioRock'],
  'demo@nexumstp.it': ['NexumStp'],
  'demo@lexant.it': ['Lexant'],
  'demo@laborproject.it': ['LaborProject'],
  'demo@231consulting.it': ['231Consulting'],
  'demo@braviassociati.it': ['Braviassociati'],
  'patrickdam04@gmail.com': ['Patrick-Personal'],
}

interface PageProps {
  searchParams?: {
    view?: 'active' | 'archived'
    sort?: 'recent' | 'severity'
  }
}

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
  const allowedCompanies = TENANT_PERMISSIONS[userEmail] || []

  if (!userEmail || allowedCompanies.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">Gestione Segnalazioni</h1>
            </div>
            <p className="text-sm text-slate-600">
              Area riservata al Responsabile della gestione delle segnalazioni (Art. 12 D.Lgs 24/2023)
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 text-red-900 px-4 py-3 text-sm">
            Accesso non autorizzato per questa utenza.
          </div>
        </div>
      </div>
    )
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .in('company_id', allowedCompanies)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore durante il recupero delle segnalazioni:', error)
  }

  const reportsData = (reports || []) as Report[]

  const currentView = searchParams?.view === 'archived' ? 'archived' : 'active'
  const currentSort = searchParams?.sort === 'severity' ? 'severity' : 'recent'

  const filteredReports = reportsData.filter((report) =>
    currentView === 'archived' ? report.status === 'RESOLVED' : report.status !== 'RESOLVED'
  )

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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Gestione Segnalazioni</h1>
          </div>
          <p className="text-sm text-slate-600">
            Area riservata al Responsabile della gestione delle segnalazioni (Art. 12 D.Lgs 24/2023)
          </p>
        </div>

        <DashboardFilters currentView={currentView} currentSort={currentSort} />

        {allowedCompanies.length > 0 && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 px-4 py-3 text-sm">
            Benvenuto nel portale riservato:{' '}
            <span className="font-semibold">{allowedCompanies.join(', ')}</span>
          </div>
        )}

        {/* Tabella */}
        {sortedReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-900 mb-2">
              Nessuna segnalazione trovata
            </p>
            <p className="text-sm text-slate-500">
              Le segnalazioni corrispondenti ai filtri appariranno qui.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Gravità
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Descrizione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Anonimo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
          <div className="mt-4 text-sm text-slate-600">
            Totale segnalazioni: <span className="font-medium">{sortedReports.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
