import { Info } from 'lucide-react'

export function DemoBanner() {
  return (
    <div
      role="banner"
      className="w-full bg-slate-700 border-b border-slate-600 py-2 px-4 text-center text-sm text-slate-100"
    >
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <Info className="w-4 h-4 flex-shrink-0" aria-hidden />
        <span>
          <strong>Demo condivisa.</strong> Usa solo dati fittizi; i dati presenti sono inventati.
          Le segnalazioni vengono ripulite periodicamente.
        </span>
      </span>
    </div>
  )
}
