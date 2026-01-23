import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 px-4">
        <h1 className="text-5xl font-bold text-gray-900">
          Whistleblowing Sicuro
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Piattaforma sicura e anonima per segnalazioni whistleblowing
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg">
            <Link href="/submit-report">
              Invia Segnalazione
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              Accedi Azienda
            </Link>
          </Button>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Hai già inviato una segnalazione?</p>
          <a
            href="/track"
            className="inline-block px-6 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-colors"
          >
            🔍 Clicca qui per seguire la tua pratica
          </a>
        </div>
      </div>
    </div>
  )
}
