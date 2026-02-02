'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revokeAcknowledgeReport } from './actions'
import { Button } from '@/components/ui/button'
import { Undo2 } from 'lucide-react'

export function RevokeAcknowledgeButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('Vuoi togliere il riscontro inviato? La segnalazione tornerà come "riscontro non ancora inviato".')) return
    startTransition(async () => {
      const result = await revokeAcknowledgeReport(reportId)
      if (result && !result.success) {
        alert('Errore: ' + (result as { error: string }).error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="mt-2 flex items-center gap-2 border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
    >
      <Undo2 className="w-4 h-4" />
      {isPending ? 'Salvataggio...' : 'Togli riscontro inviato'}
    </Button>
  )
}
