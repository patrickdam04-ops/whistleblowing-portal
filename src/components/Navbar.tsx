'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function Navbar() {
  const searchParams = useSearchParams()
  const clientParam = searchParams.get('client')
  const homeHref = clientParam ? `/?client=${encodeURIComponent(clientParam)}` : '/'
  const trackHref = clientParam ? `/track?client=${encodeURIComponent(clientParam)}` : '/track'

  return (
    <nav>
      <ul className="flex items-center gap-4">
        <li>
          <Link href={homeHref} className="font-semibold text-slate-900">
            ZonaSegnalazioni
          </Link>
        </li>
        <li>
          <Link href={trackHref} className="text-blue-600 font-bold hover:underline">
            Segui Segnalazione
          </Link>
        </li>
      </ul>
    </nav>
  )
}
