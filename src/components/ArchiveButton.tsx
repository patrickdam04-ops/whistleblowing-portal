'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { archiveReport } from '@/app/dashboard/[id]/actions'
import { Button } from '@/components/ui/button'
import { Archive, Loader2 } from 'lucide-react'

interface ArchiveButtonProps {
  reportId: string
  isArchived?: boolean | null
}

export function ArchiveButton({ reportId, isArchived }: ArchiveButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleArchive = () => {
    if (isArchived) return
    startTransition(async () => {
      try {
        await archiveReport(reportId)
        router.refresh()
      } catch (error: any) {
        console.error('Errore archiviazione:', error)
        alert('Errore durante l\'archiviazione. Riprova.')
      }
    })
  }

  return (
    <Button
      type="button"
      onClick={handleArchive}
      disabled={isPending || !!isArchived}
      variant="outline"
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Archiviazione in corso...
        </>
      ) : isArchived ? (
        <>
          <Archive className="w-4 h-4 mr-2" />
          Pratica archiviata
        </>
      ) : (
        <>
          <Archive className="w-4 h-4 mr-2" />
          Archivia Pratica
        </>
      )}
    </Button>
  )
}
