import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface SeverityBadgeProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  size?: 'sm' | 'lg'
}

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const styles = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-green-100 text-green-800 border-green-200',
  }

  const style = severity ? styles[severity] : 'bg-gray-100 text-gray-800 border-gray-200'
  const label = severity || 'N/A'
  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1 text-sm' 
    : 'px-2.5 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${style} ${sizeClasses}`}>
      {label}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    DISMISSED: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const icons = {
    PENDING: Clock,
    IN_PROGRESS: AlertCircle,
    RESOLVED: CheckCircle,
    DISMISSED: XCircle,
  }

  const Icon = icons[status]
  const style = styles[status]
  const labels = {
    PENDING: 'In Attesa',
    IN_PROGRESS: 'In Lavorazione',
    RESOLVED: 'Risolto',
    DISMISSED: 'Archiviato',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      <Icon className="w-3 h-3" />
      {labels[status]}
    </span>
  )
}
