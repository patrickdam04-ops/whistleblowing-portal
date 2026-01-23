import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <div className="absolute top-6 right-6">
        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Accesso Admin
        </Link>
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
            className="h-auto text-xl md:text-2xl px-10 py-5 font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Link href="/submit-report">Invia Segnalazione</Link>
          </Button>
          <Button asChild variant="outline" className="text-sm px-6 py-3">
            <Link href="/track">Segui pratica</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
