'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { STORAGE_BUCKET_NAME } from '@/lib/constants'

export default function TestStoragePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testStorage = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()
      let BUCKET_NAME = STORAGE_BUCKET_NAME.trim().replace(/^\/+/, '')

      console.log('🧪 Test Storage - Bucket RAW:', JSON.stringify(STORAGE_BUCKET_NAME))
      console.log('🧪 Test Storage - Bucket CLEANED:', JSON.stringify(BUCKET_NAME))
      console.log('🧪 Test Storage - Bucket length:', BUCKET_NAME.length)
      console.log('🧪 Test Storage - Bucket charCodes:', BUCKET_NAME.split('').map(c => c.charCodeAt(0)))
      console.log('🧪 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      // Prova a listare i file nel bucket
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 10,
        offset: 0,
      })

      if (error) {
        console.error('❌ Errore Storage:', error)
        const errorCode = (error as any).statusCode || (error as any).status || 'N/A'
        setResult({
          success: false,
          message: `Errore: ${error.message}\nCodice: ${errorCode}\nBucket: ${BUCKET_NAME}`,
        })
        alert(`❌ ERRORE:\n\n${error.message}\n\nCodice: ${errorCode}\nBucket testato: ${BUCKET_NAME}`)
      } else {
        console.log('✅ Successo! File trovati:', data)
        setResult({
          success: true,
          message: `Bucket "${BUCKET_NAME}" accessibile! File trovati: ${data?.length || 0}`,
        })
        alert(`✅ SUCCESSO!\n\nBucket "${BUCKET_NAME}" è accessibile!\n\nFile trovati: ${data?.length || 0}`)
      }
    } catch (err: any) {
      console.error('❌ Errore imprevisto:', err)
      const errorMessage = err.message || 'Errore sconosciuto'
      setResult({
        success: false,
        message: `Errore imprevisto: ${errorMessage}`,
      })
      alert(`❌ ERRORE IMPREVISTO:\n\n${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Supabase Storage</h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Bucket testato:</strong> <code className="bg-blue-100 px-2 py-1 rounded">report-attachments</code>
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>URL Supabase:</strong>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
              </code>
            </p>
          </div>

          <Button onClick={testStorage} disabled={loading} className="w-full mb-6">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Test in corso...
              </>
            ) : (
              '🧪 TEST SUPABASE STORAGE'
            )}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Test Riuscito' : 'Test Fallito'}
                  </p>
                  <p
                    className={`text-sm mt-1 whitespace-pre-wrap ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Nota:</strong> Controlla la console del browser (F12) per vedere i log dettagliati del test.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
