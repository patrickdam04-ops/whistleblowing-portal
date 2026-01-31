import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Lock } from 'lucide-react'
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
  // #region agent log
  if (typeof fetch !== 'undefined') fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:entry',message:'RootLayout render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion agent log
  return (
    <html lang="it">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="w-full text-center py-6 text-xs uppercase tracking-widest text-slate-600">
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
