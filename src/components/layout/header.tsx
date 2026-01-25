import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-white">
            Whistleblowing Sicuro
          </Link>
          <a
            href="/track"
            className="ml-5 font-bold text-blue-600 hover:underline"
          >
            🔍 Segui Segnalazione
          </a>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/submit-report" className="text-slate-200 hover:text-white">
            Invia Segnalazione
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/track" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Segui la tua Segnalazione
            </Link>
          </Button>
          <Link href="/gestione" className="text-slate-200 hover:text-white">
            Accedi
          </Link>
        </nav>
      </div>
    </header>
  )
}
