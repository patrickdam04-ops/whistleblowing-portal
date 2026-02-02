import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Lock } from 'lucide-react'
import { DemoBanner } from '@/components/DemoBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Whistleblowing Sicuro',
  description: 'Piattaforma sicura per segnalazioni whistleblowing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <DemoBanner />
          <div className="flex-1">{children}</div>
          <footer className="w-full text-center py-6 text-xs uppercase tracking-widest bg-slate-900 border-t border-slate-700 text-slate-400">
            <span className="inline-flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-slate-500" />
              Powered by AI Secure Engine™
            </span>
          </footer>
        </div>
      </body>
    </html>
  )
}
