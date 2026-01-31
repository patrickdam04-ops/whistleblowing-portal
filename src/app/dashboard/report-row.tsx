'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate, truncateDescription } from '@/lib/report-utils'
import { SeverityBadge, StatusBadge } from '@/components/ui/badges'
import {
  getInitialFeedbackStatus,
  getInitialFeedbackLabel,
  getFinalOutcomeStatus,
  getFinalOutcomeLabel,
} from '@/lib/sla-utils'

function SlaBadges({
  report,
}: {
  report: { created_at: string; acknowledged_at: string | null; status: string }
}) {
  const initialStatus = getInitialFeedbackStatus(report)
  const finalStatus = getFinalOutcomeStatus(report)
  const initialLabel = getInitialFeedbackLabel(report)
  const finalLabel = getFinalOutcomeLabel(report)

  const initialStyle =
    initialStatus === 'ok'
      ? 'bg-green-100 text-green-800 border-green-200'
      : initialStatus === 'overdue'
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-amber-100 text-amber-800 border-amber-200'
  const finalStyle =
    finalStatus === 'ok'
      ? 'bg-green-100 text-green-800 border-green-200'
      : finalStatus === 'overdue'
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-amber-100 text-amber-800 border-amber-200'

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium ${initialStyle}`}
        title="Riscontro iniziale entro 7 gg (D.Lgs. 24/2023)"
      >
        {initialLabel}
      </span>
      <span
        className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium ${finalStyle}`}
        title="Esito entro 90 gg (D.Lgs. 24/2023)"
      >
        {finalLabel}
      </span>
    </div>
  )
}

interface ReportRowProps {
  report: {
    id: string
    created_at: string
    description: string
    is_anonymous: boolean
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
    acknowledged_at: string | null
  }
}

export function ReportRow({ report }: ReportRowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyParam = searchParams.get('company')

  const handleClick = () => {
    const suffix = companyParam ? `?company=${encodeURIComponent(companyParam)}` : ''
    router.push(`/dashboard/${report.id}${suffix}`)
  }

  return (
    <tr
      onClick={handleClick}
      className="hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
        {formatDate(report.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <SeverityBadge severity={report.severity} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={report.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <SlaBadges report={report} />
      </td>
      <td className="px-6 py-4 text-sm text-slate-900 max-w-md">
        <p className="truncate" title={report.description}>
          {truncateDescription(report.description)}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {report.is_anonymous ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            Sì
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-slate-200">
            No
          </span>
        )}
      </td>
    </tr>
  )
}
