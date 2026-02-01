import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface SeverityBadgeProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  size?: 'sm' | 'lg'
}

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  // Colore solo per criticità alta; il resto neutro (dashboard dark)
  const styles = {
    CRITICAL: 'bg-red-900/50 text-red-300 border-red-700',
    HIGH: 'bg-orange-900/40 text-orange-300 border-orange-700',
    MEDIUM: 'bg-slate-700 text-slate-300 border-slate-600',
    LOW: 'bg-slate-700 text-slate-300 border-slate-600',
  }

  const style = severity ? styles[severity] : 'bg-slate-700 text-slate-400 border-slate-600'
  const label = severity ?? 'In valutazione'
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
  // Colore solo per Risolto (feedback positivo); il resto neutro
  const styles = {
    PENDING: 'bg-slate-700 text-slate-300 border-slate-600',
    IN_PROGRESS: 'bg-slate-700 text-slate-300 border-slate-600',
    RESOLVED: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
    DISMISSED: 'bg-slate-700 text-slate-300 border-slate-600',
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
