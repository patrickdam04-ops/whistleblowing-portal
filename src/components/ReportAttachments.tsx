'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, Download, Loader2, AlertCircle, Image, File, FileType } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Costante per il nome del bucket - MODIFICA QUI SE IL BUCKET HA UN NOME DIVERSO SU SUPABASE
const BUCKET_NAME = 'report-attachments'

interface ReportAttachmentsProps {
  attachments: string | string[] | null // Array di path (PostgreSQL array) o stringa JSON
  reportId: string
}

// Funzione helper per determinare il tipo di file
function getFileType(fileName: string): 'image' | 'pdf' | 'document' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const pdfExts = ['pdf']
  const docExts = ['doc', 'docx', 'txt', 'rtf']

  if (imageExts.includes(ext)) return 'image'
  if (pdfExts.includes(ext)) return 'pdf'
  if (docExts.includes(ext)) return 'document'
  return 'other'
}

// Funzione helper per ottenere l'icona appropriata
function getFileIcon(fileType: 'image' | 'pdf' | 'document' | 'other') {
  switch (fileType) {
    case 'image':
      return Image
    case 'pdf':
      return FileType
    case 'document':
      return FileText
    default:
      return File
  }
}

export function ReportAttachments({ attachments, reportId }: ReportAttachmentsProps) {
  const [signedUrls, setSignedUrls] = useState<Array<{ path: string; url: string; name: string; type: 'image' | 'pdf' | 'document' | 'other' }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSignedUrls() {
      if (!attachments) {
        setLoading(false)
        return
      }

      try {
        // Gestisci sia array PostgreSQL nativo che stringa JSON (per retrocompatibilità)
        let paths: string[] = []
        
        if (Array.isArray(attachments)) {
          // Se è già un array (PostgreSQL array type)
          paths = attachments
        } else if (typeof attachments === 'string') {
          // Se è una stringa, prova a parsarla come JSON
          try {
            const parsed = JSON.parse(attachments)
            paths = Array.isArray(parsed) ? parsed : []
          } catch {
            // Se non è JSON valido, potrebbe essere una singola stringa
            paths = [attachments]
          }
        }

        if (!Array.isArray(paths) || paths.length === 0) {
          setLoading(false)
          return
        }

        console.log(`📦 Processing ${paths.length} attachment path(s):`, paths)

        console.log(`📦 Tentativo generazione signed URLs per ${paths.length} file(s) dal bucket: "${BUCKET_NAME}"`)

        const supabase = createClient()
        const urlPromises = paths.map(async (path) => {
          // Estrai il nome del file dal path
          const fileName = path.split('/').pop() || path

          console.log(`🔗 Generazione signed URL per: ${path} dal bucket "${BUCKET_NAME}"`)

          // Crea signed URL valido per 1 ora (3600 secondi)
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, 3600)

          if (error) {
            console.error(`❌ Errore generando signed URL per ${path}:`, error)
            console.error('📋 Dettagli errore:', {
              message: error.message,
              statusCode: error.statusCode,
              error: error.error,
              bucket: BUCKET_NAME,
              path: path,
            })
            return null
          }

          console.log(`✅ Signed URL generato per: ${fileName}`)
          const fileType = getFileType(fileName)
          return {
            path,
            url: data.signedUrl,
            name: fileName,
            type: fileType,
          }
        })

        const results = await Promise.all(urlPromises)
        const validUrls = results.filter((item): item is { path: string; url: string; name: string; type: 'image' | 'pdf' | 'document' | 'other' } => item !== null)

        if (validUrls.length === 0 && paths.length > 0) {
          setError(`Impossibile generare link per gli allegati. Verifica che il bucket "${BUCKET_NAME}" esista su Supabase.`)
        }

        setSignedUrls(validUrls)
      } catch (err: any) {
        console.error('❌ Errore durante il recupero degli allegati:', err)
        setError(`Errore durante il caricamento degli allegati: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSignedUrls()
  }, [attachments])

  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Caricamento allegati...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      </div>
    )
  }

  // Se non ci sono allegati, mostra un messaggio
  if (!attachments || signedUrls.length === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          📁 Allegati e Prove
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Nessun allegato presente
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        📁 Allegati e Prove ({signedUrls.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signedUrls.map((item, index) => {
          const FileIcon = getFileIcon(item.type)
          const isImage = item.type === 'image'

          return (
            <div
              key={index}
              className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {isImage ? (
                // Miniatura per immagini
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // Fallback se l'immagine non può essere caricata
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    {/* Fallback visivo se l'immagine non carica */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200 hidden">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                      <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Clicca per visualizzare</p>
                  </div>
                </a>
              ) : (
                // Icona e download per altri file
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-3 bg-white rounded-lg border border-gray-200">
                      <FileIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate mb-2">
                        {item.name}
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={item.name}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Scarica file
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        ⚠️ I link di download scadono dopo 1 ora per motivi di sicurezza.
      </p>
    </div>
  )
}
