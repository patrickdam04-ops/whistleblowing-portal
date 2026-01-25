'use client'

import { useRouter } from 'next/navigation'
import { formatDate, truncateDescription } from '@/lib/report-utils'
import { SeverityBadge, StatusBadge } from '@/components/ui/badges'

interface ReportRowProps {
  report: {
    id: string
    created_at: string
    description: string
    is_anonymous: boolean
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
    is_spam?: boolean | null
  }
}

export function ReportRow({ report }: ReportRowProps) {
  const router = useRouter()
  const isSpam = Boolean(report.is_spam)

  const handleClick = () => {
    router.push(`/dashboard/${report.id}`)
  }

  return (
    <tr
      onClick={handleClick}
      className={`transition-colors cursor-pointer ${
        isSpam
          ? 'opacity-60 grayscale bg-gray-100 dark:bg-slate-900 border-gray-200'
          : 'hover:bg-gray-50'
      }`}
    >
      <td
        className={`px-6 py-4 whitespace-nowrap text-sm text-slate-900 border-l-4 ${
          isSpam ? 'border-l-gray-400' : 'border-l-transparent'
        }`}
      >
        {formatDate(report.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isSpam ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 border border-gray-300">
            🗑️ RILEVATA FUTILITÀ
          </span>
        ) : (
          <SeverityBadge severity={report.severity} />
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={report.status} />
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
