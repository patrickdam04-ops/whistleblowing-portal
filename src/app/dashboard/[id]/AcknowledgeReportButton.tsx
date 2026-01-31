'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acknowledgeReport } from './actions'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export function AcknowledgeReportButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await acknowledgeReport(reportId)
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
      className="flex items-center gap-2"
    >
      <CheckCircle className="w-4 h-4" />
      {isPending ? 'Salvataggio...' : 'Segna riscontro inviato'}
    </Button>
  )
}
