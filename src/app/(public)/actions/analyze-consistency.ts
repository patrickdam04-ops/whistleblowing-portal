'use server'

export interface ConsistencyAnalysisResult {
  score_solidita: number
  incoerenze_rilevate: string[]
  buchi_narrativi: string[]
  consiglio_investigativo: string
}

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-2.0-flash-exp'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'

const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
]

function normalizeResult(raw: any): ConsistencyAnalysisResult {
  const score = Number(raw?.score_solidita)
  const safeScore = Number.isFinite(score)
    ? Math.min(100, Math.max(1, Math.round(score)))
    : 50

  const toArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((item) => String(item)) : []

  return {
    score_solidita: safeScore,
    incoerenze_rilevate: toArray(raw?.incoerenze_rilevate),
    buchi_narrativi: toArray(raw?.buchi_narrativi),
    consiglio_investigativo: String(raw?.consiglio_investigativo || '').trim(),
  }
}

export async function analyzeConsistency(description: string): Promise<ConsistencyAnalysisResult> {
  if (!description) {
    return {
      score_solidita: 50,
      incoerenze_rilevate: [],
      buchi_narrativi: [],
      consiglio_investigativo: 'Descrizione mancante: raccogliere dettagli aggiuntivi.',
    }
  }

  if (!API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY non configurata')
  }

  const prompt = `Sei un detective esperto in analisi testuale e interrogatori. Analizza questa segnalazione cercando ERRORI LOGICI e DATI MANCANTI.
Non devi giudicare se è vero o falso, ma se il racconto è COERENTE.

Restituisci un JSON rigoroso:
{
  "score_solidita": (numero 1-100 basato su ricchezza dettagli e coerenza),
  "incoerenze_rilevate": ["Es: Dice lunedì ma cita una data che era domenica", "Es: Dice di essere solo ma poi parla di un collega"],
  "buchi_narrativi": ["Es: Manca la data dell'evento", "Es: Non specifica chi era presente"],
  "consiglio_investigativo": "Frase sintetica su cosa verificare subito"
}

Testo da analizzare: "${description}"`

  const response = await fetch(`${API_BASE}${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      safetySettings,
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  })

  const rawText = await response.text()
  if (!response.ok) {
    throw new Error(`Google Error ${response.status}: ${rawText}`)
  }

  let outer: any
  try {
    outer = JSON.parse(rawText)
  } catch {
    throw new Error(`Risposta Gemini non JSON: ${rawText}`)
  }

  const aiText = outer?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = String(aiText).replace(/```json|```/g, '').trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  const extracted =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? cleaned.substring(firstBrace, lastBrace + 1)
      : cleaned

  let parsed: any
  try {
    parsed = JSON.parse(extracted)
  } catch {
    throw new Error(`JSON Gemini non valido: ${cleaned}`)
  }

  return normalizeResult(parsed)
}
