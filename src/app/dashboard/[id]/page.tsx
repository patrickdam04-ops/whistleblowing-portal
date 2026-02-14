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
import { ReportConversation } from '@/components/ReportConversation'
import { LegalAnalysisCard } from '@/components/LegalAnalysisCard'
import { SherlockConsistencyCard } from '@/components/SherlockConsistencyCard'
import { AcknowledgeReportButton } from './AcknowledgeReportButton'
import { RevokeAcknowledgeButton } from './RevokeAcknowledgeButton'
import { formatDate, formatFullDate } from '@/lib/report-utils'
import { decryptContact } from '@/lib/encrypt'
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
  sherlock_analysis?: Record<string, unknown> | null
  legal_analysis?: Record<string, unknown> | null
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

  // Audit log: traccia accesso alla segnalazione (conformità D.Lgs. 24/2023)
  try {
    await supabase.from('report_access_log').insert({
      report_id: id,
      user_id: user.id,
    })
  } catch {
    // Tabella non ancora creata su Supabase
  }

  // Decifra contatto solo se non anonimo (D.Lgs. 24/2023)
  let contactDisplay: string | null = null
  if (!reportData.is_anonymous && reportData.encrypted_contact_info) {
    try {
      contactDisplay = decryptContact(reportData.encrypted_contact_info)
    } catch {
      contactDisplay = null
    }
    if (!contactDisplay && /@/.test(reportData.encrypted_contact_info)) {
      contactDisplay = reportData.encrypted_contact_info
    }
  }

  const companyParam = getParam(searchParams?.company)
  const backHref = companyParam
    ? `/dashboard?company=${encodeURIComponent(companyParam)}`
    : '/dashboard'

  // Messaggi della conversazione (segnalante / admin)
  const { data: messagesData } = await supabase
    .from('report_messages')
    .select('id, role, body, created_at')
    .eq('report_id', id)
    .order('created_at', { ascending: true })
  const messages = (messagesData ?? []) as { id: string; role: string; body: string; created_at: string }[]

  // Testo completo per AI: descrizione + prima risposta admin + messaggi successivi (per risposta, legal, Sherlock)
  const parts: string[] = [reportData.description]
  if (reportData.admin_response?.trim()) {
    parts.push('\n\n--- Risposte successive ---\n[Amministrazione]: ' + reportData.admin_response.trim())
  }
  if (messages.length > 0) {
    if (parts.length === 1) parts.push('\n\n--- Risposte successive ---')
    parts.push(messages.map((m) => `[${m.role === 'admin' ? 'Amministrazione' : 'Segnalante'}]: ${m.body}`).join('\n\n'))
  }
  const fullConversation = parts.join('')

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con back button */}
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla lista
          </Link>
        </div>

        {/* Titolo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-slate-400" />
            <h1 className="text-3xl font-bold text-slate-100">Dettaglio Segnalazione</h1>
          </div>
          <p className="text-sm text-slate-400">ID: {reportData.id}</p>
        </div>

        {/* Layout a due colonne */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonna SX: Metadata + Smart Reply */}
          <div className="md:col-span-1 space-y-6">
            {/* Card Metadata */}
            <div className="bg-slate-800 rounded-2xl shadow-card border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Informazioni
              </h2>
              <div className="space-y-4">
                {/* Data */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    Data di ricezione
                  </div>
                  <p className="text-sm font-medium text-slate-200">{formatFullDate(reportData.created_at)}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(reportData.created_at)}</p>
                </div>

                {/* Gravità */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Gravità
                  </div>
                  <SeverityBadge severity={reportData.severity} size="lg" />
                </div>

                {/* Anonimo */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <User className="w-4 h-4" />
                    Anonimato
                  </div>
                  {reportData.is_anonymous ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300 border border-slate-600">
                      Sì - Segnalazione anonima
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300 border border-slate-600">
                      No - Contatto disponibile
                    </span>
                  )}
                </div>

                {/* Stato - Form per aggiornare */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Clock className="w-4 h-4" />
                    Stato
                  </div>
                  <StatusSelector id={reportData.id} initialStatus={reportData.status} />
                </div>

              </div>
            </div>

            {/* Smart Reply - Risposta al Segnalante (AI legge anche le risposte successive) */}
            <AdminResponseForm
              reportId={reportData.id}
              reportDescription={fullConversation}
              ticketCode={reportData.ticket_code}
              initialResponse={reportData.admin_response}
            />
            {/* Conversazione: messaggi successivi segnalante / admin */}
            <div className="mt-6">
              <ReportConversation reportId={reportData.id} messages={messages} dark />
            </div>
          </div>

          {/* Colonna DX: Conformità in evidenza + Descrizione */}
          <div className="md:col-span-2 space-y-6">
            {/* Conformità D.Lgs. 24/2023 - in cima alla colonna destra */}
            <div className="bg-slate-800 rounded-2xl shadow-card border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2">
                <Scale className="w-5 h-5 text-slate-400" />
                Conformità D.Lgs. 24/2023
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Riscontro iniziale entro 7 giorni (Art. 8; Direttiva UE 2019/1937). Comunicazione esito entro 90 giorni.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-700/50 p-4 border border-slate-600">
                  <p className="text-sm font-medium text-slate-300 mb-1">Riscontro iniziale (7 gg)</p>
                  {reportData.acknowledged_at ? (
                    <>
                      <p className="text-sm text-emerald-400">
                        Riscontro inviato il {formatDate(reportData.acknowledged_at)}
                      </p>
                      <RevokeAcknowledgeButton reportId={reportData.id} />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-200">{getInitialFeedbackLabel(reportData)}</p>
                      <div className="mt-2">
                        <AcknowledgeReportButton reportId={reportData.id} />
                      </div>
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-slate-700/50 p-4 border border-slate-600">
                  <p className="text-sm font-medium text-slate-300 mb-1">Comunicazione esito (90 gg)</p>
                  <p className="text-sm text-slate-200">{getFinalOutcomeLabel(reportData)}</p>
                  {reportData.status !== 'RESOLVED' && reportData.status !== 'DISMISSED' && (
                    <p className="text-xs text-slate-400 mt-1">
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
            <div className="bg-slate-800 rounded-2xl shadow-card border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Descrizione della Segnalazione
              </h2>
              <div className="prose max-w-none">
                <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {reportData.description}
                  </p>
                </div>
              </div>

              {/* Contatto (se disponibile, decifrato) */}
              {!reportData.is_anonymous && contactDisplay && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contatto Segnalante
                  </h3>
                  <p className="text-sm text-slate-400">{contactDisplay}</p>
                </div>
              )}

              {/* Allegati */}
              <ReportAttachments attachments={reportData.attachments} reportId={reportData.id} />

              {/* AI Cards (analisi persistenti: mostrano ultima e bottone Rianalizza) */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SherlockConsistencyCard
                  reportId={reportData.id}
                  description={fullConversation}
                  initialAnalysis={reportData.sherlock_analysis ?? null}
                  compact
                  dark
                />
                <LegalAnalysisCard
                  reportId={reportData.id}
                  description={fullConversation}
                  initialAnalysis={reportData.legal_analysis ?? null}
                  compact
                  dark
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
