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
      const result = await acknowledgeReport(reportId)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AcknowledgeReportButton:result',message:'acknowledgeReport result',data:{success:result?.success,error:result && !result.success ? (result as { error: string }).error : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion agent log
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
      className="flex items-center gap-2"
    >
      <CheckCircle className="w-4 h-4" />
      {isPending ? 'Salvataggio...' : 'Segna riscontro inviato'}
    </Button>
  )
}
