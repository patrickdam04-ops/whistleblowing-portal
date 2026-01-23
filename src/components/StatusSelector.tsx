'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateStatus } from '@/app/dashboard/[id]/actions'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface StatusSelectorProps {
  id: string
  initialStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
}

const statusOptions = [
  { value: 'PENDING', label: 'In Attesa', icon: Clock },
  { value: 'IN_PROGRESS', label: 'In Lavorazione', icon: AlertCircle },
  { value: 'RESOLVED', label: 'Risolto', icon: CheckCircle },
] as const

export function StatusSelector({ id, initialStatus }: StatusSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const normalizedStatus =
    initialStatus === 'DISMISSED' ? 'RESOLVED' : initialStatus

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Exclude<StatusSelectorProps['initialStatus'], 'DISMISSED'>

    if (newStatus === normalizedStatus) return

    startTransition(async () => {
      try {
        await updateStatus(id, newStatus)
        // Refresh per aggiornare l'UI con i nuovi dati
        router.refresh()
      } catch (error) {
        console.error('Errore durante l\'aggiornamento dello stato:', error)
        // Ripristina il valore precedente in caso di errore
        e.target.value = normalizedStatus
        alert('Errore durante l\'aggiornamento dello stato. Riprova.')
      }
    })
  }

  return (
    <div>
      <select
        value={normalizedStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isPending && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <span className="animate-spin">⏳</span>
          Aggiornamento in corso...
        </p>
      )}
    </div>
  )
}
