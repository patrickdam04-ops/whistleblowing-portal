'use client'

import { useState } from 'react'
import { generateInvestigationPlan } from '@/app/actions/generate-investigation-plan'
import { Button } from '@/components/ui/button'
import { Search, Loader2, AlertTriangle } from 'lucide-react'

interface InvestigationPlanPanelProps {
  reportDescription: string
}

export function InvestigationPlanPanel({ reportDescription }: InvestigationPlanPanelProps) {
  const [plan, setPlan] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setPlan(null)

    try {
      const investigationPlan = await generateInvestigationPlan(reportDescription)
      setPlan(investigationPlan)
    } catch (err: any) {
      console.error('Errore generazione piano investigativo:', err)
      setError('Errore durante la generazione del piano investigativo. Riprova più tardi.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-slate-900">
            🕵️ Suggerimenti Investigativi (Privato)
          </h3>
        </div>

        {/* Banner Avviso Legale - Sempre visibile */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                ⚠️ <strong>AVVISO:</strong> Questi suggerimenti sono generati dall'AI e non costituiscono consulenza legale. Consulta sempre un professionista prima di intraprendere azioni disciplinari o denunce.
              </p>
            </div>
          </div>
        </div>

        {/* Bottone Genera Piano */}
        <div className="mb-4">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Genera Piano Investigativo
              </>
            )}
          </Button>
        </div>

        {/* Messaggio di errore */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Piano Investigativo Generato */}
        {plan && (
          <div className="mt-4">
            <div className="bg-gray-50 rounded-lg p-6 border border-slate-200">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-900 font-sans leading-relaxed">
                  {plan}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Messaggio iniziale se non ancora generato */}
        {!plan && !isGenerating && !error && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Clicca su "Genera Piano Investigativo" per ricevere suggerimenti pratici su come verificare i fatti segnalati.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
