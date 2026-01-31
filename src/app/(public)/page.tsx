import Link from 'next/link'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default function HomePage({ searchParams }: PageProps) {
  // #region agent log
  const _sp = searchParams; fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/page.tsx:entry',message:'HomePage render',data:{searchParamsType:typeof _sp,isPromise:typeof (_sp as any)?.then==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion agent log
  const clientParam = getParam(searchParams?.client)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5141b8e2-d936-46ae-8beb-6c0c4c1faa0e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/page.tsx:getParam',message:'getParam done',data:{clientParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion agent log
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-100">
            Zona Segnalazioni
          </h1>
          <p className="mt-3 text-slate-400">
            Scegli cosa vuoi fare: inviare una nuova segnalazione o seguire una pratica già aperta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href={`/invia${clientParam ? `?client=${encodeURIComponent(clientParam)}` : ''}`}
            className="group bg-slate-900/50 border border-slate-700 shadow-xl shadow-black/20 rounded-2xl p-6 md:p-8 transition-all hover:border-blue-600 hover:shadow-black/40"
          >
            <div className="text-2xl mb-3">📝</div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Nuova Segnalazione
            </h2>
            <p className="text-sm text-slate-400">
              Invia una segnalazione anonima o riservata.
            </p>
            <div className="mt-6 text-sm text-blue-600 group-hover:text-blue-500">
              Avvia segnalazione →
            </div>
          </Link>

          <Link
            href={`/track${clientParam ? `?client=${encodeURIComponent(clientParam)}` : ''}`}
            className="group bg-slate-900/50 border border-slate-700 shadow-xl shadow-black/20 rounded-2xl p-6 md:p-8 transition-all hover:border-blue-600 hover:shadow-black/40"
          >
            <div className="text-2xl mb-3">🔍</div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Segui la tua Pratica
            </h2>
            <p className="text-sm text-slate-400">
              Hai già un codice? Controlla lo stato o rispondi all’azienda.
            </p>
            <div className="mt-6 text-sm text-blue-600 group-hover:text-blue-500">
              Inserisci codice →
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
