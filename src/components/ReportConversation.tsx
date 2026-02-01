'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addAdminMessage } from '@/app/dashboard/[id]/actions'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, User, Shield } from 'lucide-react'
import { formatDate } from '@/lib/report-utils'

export interface ReportMessageRow {
  id?: string
  role: string
  body: string
  created_at: string
}

interface ReportConversationProps {
  reportId: string
  messages: ReportMessageRow[]
  dark?: boolean
}

export function ReportConversation({ reportId, messages, dark }: ReportConversationProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setError(null)
    setSending(true)
    const res = await addAdminMessage(reportId, body)
    setSending(false)
    if (res.success) {
      setBody('')
      router.refresh()
    } else {
      setError(res.error)
    }
  }

  const base = dark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
  const adminBubble = dark ? 'bg-blue-900/50 border-blue-700 text-slate-100' : 'bg-blue-50 border-blue-200 text-blue-900'
  const whistleBubble = dark ? 'bg-slate-700/50 border-slate-600 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'

  return (
    <div className={`rounded-2xl border p-6 ${base}`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
        <MessageSquare className="w-5 h-5" />
        Conversazione con il segnalante
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Nessun messaggio successivo. Il segnalante può rispondere dalla pagina di tracciamento.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={m.id ?? i} className={m.role === 'admin' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2 border ${m.role === 'admin' ? adminBubble : whistleBubble}`}>
              <p className="text-xs font-medium flex items-center gap-1 mb-0.5">
                {m.role === 'admin' ? <><Shield className="w-3 h-3" /> Amministrazione</> : <><User className="w-3 h-3" /> Segnalante</>}
              </p>
              <p className="text-sm whitespace-pre-wrap">{m.body}</p>
              <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(m.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Risposta al segnalante (es. richiesta di altri dati)..."
          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400' : 'border-slate-300'}`}
          maxLength={2000}
        />
        <Button type="submit" disabled={sending || !body.trim()} size="sm">
          {sending ? 'Invio...' : <><Send className="w-4 h-4" /> Invia</>}
        </Button>
      </form>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  )
}
