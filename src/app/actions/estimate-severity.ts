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
Per ogni segnalazione sotto, assegna UNA sola gravità in base alla gravità della condotta segnalata:
- LOW: violazioni minori, richieste informative, disagi lievi
- MEDIUM: irregolarità moderate, mancanze procedurali
- HIGH: violazioni gravi, possibili illeciti, molestie, discriminazioni
- CRITICAL: reati gravi, frodi, corruzione, minacce, situazioni di pericolo

Rispondi SOLO con un JSON array di stringhe, nello stesso ordine delle segnalazioni (1 = primo elemento, 2 = secondo, ecc.).
Valori ammessi esattamente: "LOW", "MEDIUM", "HIGH", "CRITICAL".
Esempio: ["MEDIUM", "CRITICAL", "LOW"]

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
