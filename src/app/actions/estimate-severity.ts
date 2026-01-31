'use server'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-2.5-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'
const MAX_BATCH = 20

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ReportForSeverity {
  id: string
  description: string
}

export interface EstimatedSeverity {
  id: string
  severity: SeverityLevel
}

/**
 * Stima la gravità (LOW | MEDIUM | HIGH | CRITICAL) per un batch di segnalazioni
 * tramite Gemini. Restituisce un array { id, severity } nello stesso ordine.
 * In caso di errore restituisce array vuoto (le segnalazioni restano con severity null).
 */
export async function estimateSeveritiesBatch(
  reports: ReportForSeverity[]
): Promise<EstimatedSeverity[]> {
  if (!reports.length || reports.length > MAX_BATCH) {
    return []
  }

  if (!API_KEY) {
    console.warn('estimateSeveritiesBatch: GOOGLE_GENERATIVE_AI_API_KEY mancante')
    return []
  }

  const descriptions = reports.map((r, i) => `[${i + 1}] ${r.description}`).join('\n\n---\n\n')
  const prompt = `Sei un assistente per la gestione di segnalazioni whistleblowing (D.Lgs. 24/2023).

Valuta la GRAVITÀ REALE della condotta segnalata, non il tono o il linguaggio usato. Una segnalazione scritta in modo formale o "legale" su un fatto futile deve essere LOW.

Regole:
- Valuta COSA è stato fatto (sostanza), non come è scritto. Es.: furto di cialde di caffè o materiale d'ufficio = LOW anche se descritto con termini come "violazione reiterata e sistematica", "occultamento", "Soggetto X".
- LOW: violazioni minori, richieste informative, disagi lievi, questioni futili (consumo non autorizzato di viveri d'ufficio, materiale di cancelleria, tensioni interpersonali minori).
- MEDIUM: irregolarità procedurali moderate, mancanze documentali, ritardi significativi.
- HIGH: violazioni gravi, possibili illeciti, molestie, discriminazioni, frodi di una certa entità.
- CRITICAL: reati gravi (corruzione, appropriazione indebita rilevante, minacce, pericolo per persone), frodi sistemiche, violazioni della sicurezza.

NON elevare la gravità solo perché il testo usa un linguaggio formale o giuridico. Se il fatto descritto è banale (es. caffè, materiale di poco valore, litigi da ufficio), rispondi LOW.

Rispondi SOLO con un JSON array di stringhe, nello stesso ordine delle segnalazioni (1 = primo elemento, 2 = secondo, ecc.).
Valori ammessi esattamente: "LOW", "MEDIUM", "HIGH", "CRITICAL".
Esempio: ["LOW", "CRITICAL", "MEDIUM"]

Segnalazioni:

${descriptions}`

  try {
    const response = await fetch(`${API_BASE}${MODEL}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    const rawText = await response.text()

    if (!response.ok) {
      console.warn('estimateSeveritiesBatch: Gemini error', response.status, rawText)
      return []
    }

    const parsed = JSON.parse(rawText)
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const firstBracket = cleaned.indexOf('[')
    const lastBracket = cleaned.lastIndexOf(']')
    if (firstBracket === -1 || lastBracket === -1) {
      console.warn('estimateSeveritiesBatch: risposta senza array JSON', text)
      return []
    }

    const arr = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1)) as string[]
    const valid: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const result: EstimatedSeverity[] = []

    for (let i = 0; i < reports.length && i < arr.length; i++) {
      const s = String(arr[i] ?? '').toUpperCase()
      const severity = valid.includes(s) ? (s as SeverityLevel) : 'MEDIUM'
      result.push({ id: reports[i].id, severity })
    }

    return result
  } catch (e) {
    console.warn('estimateSeveritiesBatch:', e)
    return []
  }
}
