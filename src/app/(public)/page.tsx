import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="absolute top-5 right-5">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Accesso Admin</Link>
        </Button>
      </div>

      <div className="text-center space-y-8 px-4">
        <h1 className="text-5xl font-bold text-slate-900">
          Whistleblowing Sicuro
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl">
          Piattaforma sicura e anonima per segnalazioni whistleblowing
        </p>
        <div className="flex flex-col items-center gap-4">
          <Button
            asChild
            className="text-xl px-10 py-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Link href="/submit-report">Invia Segnalazione</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="text-sm px-6 py-3"
          >
            <Link href="/track">Segui la tua pratica</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
