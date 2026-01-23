import Link from 'next/link'

export function Navbar() {
  return (
    <nav>
      <ul className="flex items-center gap-4">
        <li>
          <Link href="/track" className="text-blue-600 font-bold hover:underline">
            Segui Segnalazione
          </Link>
        </li>
      </ul>
    </nav>
  )
}
