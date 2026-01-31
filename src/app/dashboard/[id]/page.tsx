import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import {
  Shield,
  Calendar,
  AlertTriangle,
  User,
  FileText,
  ArrowLeft,
  Clock,
  Scale,
} from 'lucide-react'
import Link from 'next/link'
import { StatusSelector } from '@/components/StatusSelector'
import { AdminResponseForm } from '@/components/AdminResponseForm'
import { ReportAttachments } from '@/components/ReportAttachments'
import { LegalAnalysisCard } from '@/components/LegalAnalysisCard'
import { SherlockConsistencyCard } from '@/components/SherlockConsistencyCard'
import { AcknowledgeReportButton } from './AcknowledgeReportButton'
import { formatDate, formatFullDate } from '@/lib/report-utils'
import { SeverityBadge } from '@/components/ui/badges'
import {
  getFinalOutcomeDeadline,
  getDaysRemaining,
  getInitialFeedbackLabel,
  getFinalOutcomeLabel,
} from '@/lib/sla-utils'

interface Report {
  id: string
  created_at: string
  description: string
  is_anonymous: boolean
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  encrypted_contact_info: string | null
  admin_response: string | null
  ticket_code: string | null
  attachments: string | string[] | null
  acknowledged_at: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: {
    company?: string | string[]
  }
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function ReportDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const supabase = createClient()

  // Verifica autenticazione
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/gestione')
  }

  // Recupera la segnalazione
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !report) {
    notFound()
  }

  const reportData = report as Report

  const companyParam = getParam(searchParams?.company)
  const backHref = companyParam
    ? `/dashboard?company=${encodeURIComponent(companyParam)}`
    : '/dashboard'

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con back button */}
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla lista
          </Link>
        </div>

        {/* Titolo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Dettaglio Segnalazione</h1>
          </div>
          <p className="text-sm text-slate-600">ID: {reportData.id}</p>
        </div>

        {/* Layout a due colonne */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonna SX: Metadata + Smart Reply */}
          <div className="md:col-span-1 space-y-6">
            {/* Card Metadata */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informazioni
              </h2>
              <div className="space-y-4">
                {/* Data */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    Data di ricezione
                  </div>
                  <p className="text-sm font-medium text-slate-900">{formatFullDate(reportData.created_at)}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(reportData.created_at)}</p>
                </div>

                {/* Gravità */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Gravità
                  </div>
                  <SeverityBadge severity={reportData.severity} size="lg" />
                </div>

                {/* Anonimo */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <User className="w-4 h-4" />
                    Anonimato
                  </div>
                  {reportData.is_anonymous ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      Sì - Segnalazione anonima
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-slate-200">
                      No - Contatto disponibile
                    </span>
                  )}
                </div>

                {/* Stato - Form per aggiornare */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Clock className="w-4 h-4" />
                    Stato
                  </div>
                  <StatusSelector id={reportData.id} initialStatus={reportData.status} />
                </div>

              </div>
            </div>

            {/* Smart Reply - Risposta al Segnalante */}
            <AdminResponseForm
              reportId={reportData.id}
              reportDescription={reportData.description}
              ticketCode={reportData.ticket_code}
              initialResponse={reportData.admin_response}
            />
          </div>

          {/* Colonna DX: Conformità in evidenza + Descrizione */}
          <div className="md:col-span-2 space-y-6">
            {/* Conformità D.Lgs. 24/2023 - in cima alla colonna destra */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Conformità D.Lgs. 24/2023
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Riscontro iniziale entro 7 giorni (Art. 8; Direttiva UE 2019/1937). Comunicazione esito entro 90 giorni.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
                  <p className="text-sm font-medium text-slate-700 mb-1">Riscontro iniziale (7 gg)</p>
                  {reportData.acknowledged_at ? (
                    <p className="text-sm text-green-700">
                      Riscontro inviato il {formatDate(reportData.acknowledged_at)}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-900">{getInitialFeedbackLabel(reportData)}</p>
                      <div className="mt-2">
                        <AcknowledgeReportButton reportId={reportData.id} />
                      </div>
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
                  <p className="text-sm font-medium text-slate-700 mb-1">Comunicazione esito (90 gg)</p>
                  <p className="text-sm text-slate-900">{getFinalOutcomeLabel(reportData)}</p>
                  {reportData.status !== 'RESOLVED' && reportData.status !== 'DISMISSED' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Scadenza: {formatDate(getFinalOutcomeDeadline(reportData.created_at).toISOString())} —{' '}
                      {getDaysRemaining(getFinalOutcomeDeadline(reportData.created_at)) >= 0
                        ? `${getDaysRemaining(getFinalOutcomeDeadline(reportData.created_at))} giorni rimanenti`
                        : `${Math.abs(getDaysRemaining(getFinalOutcomeDeadline(reportData.created_at)))} giorni oltre il termine`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Descrizione della Segnalazione */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Descrizione della Segnalazione
              </h2>
              <div className="prose max-w-none">
                <div className="bg-slate-50/80 rounded-xl p-6 border border-slate-200/60">
                  <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                    {reportData.description}
                  </p>
                </div>
              </div>

              {/* Contatto (se disponibile) */}
              {!reportData.is_anonymous && reportData.encrypted_contact_info && (
                <div className="mt-6 pt-6 border-t border-slate-200/80">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contatto Segnalante
                  </h3>
                  <p className="text-sm text-slate-600">{reportData.encrypted_contact_info}</p>
                </div>
              )}

              {/* Allegati */}
              <ReportAttachments attachments={reportData.attachments} reportId={reportData.id} />

              {/* AI Cards */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SherlockConsistencyCard description={reportData.description} compact />
                <LegalAnalysisCard description={reportData.description} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
