'use server'

import { redactSensitiveText, restoreTokensInObject } from '@/lib/privacy-redaction'

export interface ConsistencyAnalysisResult {
  score_solidita: number
  incoerenze_rilevate: string[]
  buchi_narrativi: string[]
  consiglio_investigativo: string
  emotional_profile: {
    dominant_emotion: 'PAURA' | 'RABBIA' | 'FRUSTRAZIONE' | 'VENDETTA' | 'CALMA/OGGETTIVA'
    intensity: 'BASSA' | 'MEDIA' | 'ALTA'
    stress_indicators: string[]
  }
  frivolity_check: {
    is_likely_futile: boolean
    nature: 'FATTUALE' | 'SOGGETTIVA/OPINIONE' | 'CONFLITTO INTERPERSONALE'
    reasoning: string
  }
}

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-2.5-pro'
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

  const emotion = String(raw?.emotional_profile?.dominant_emotion || '').toUpperCase()
  const dominant_emotion: ConsistencyAnalysisResult['emotional_profile']['dominant_emotion'] =
    emotion === 'PAURA' ||
    emotion === 'RABBIA' ||
    emotion === 'FRUSTRAZIONE' ||
    emotion === 'VENDETTA' ||
    emotion === 'CALMA/OGGETTIVA'
      ? (emotion as ConsistencyAnalysisResult['emotional_profile']['dominant_emotion'])
      : 'CALMA/OGGETTIVA'

  const intensity = String(raw?.emotional_profile?.intensity || '').toUpperCase()
  const normalized_intensity: ConsistencyAnalysisResult['emotional_profile']['intensity'] =
    intensity === 'BASSA' || intensity === 'MEDIA' || intensity === 'ALTA'
      ? (intensity as ConsistencyAnalysisResult['emotional_profile']['intensity'])
      : 'MEDIA'

  const nature = String(raw?.frivolity_check?.nature || '').toUpperCase()
  const normalized_nature: ConsistencyAnalysisResult['frivolity_check']['nature'] =
    nature === 'FATTUALE' ||
    nature === 'SOGGETTIVA/OPINIONE' ||
    nature === 'CONFLITTO INTERPERSONALE'
      ? (nature as ConsistencyAnalysisResult['frivolity_check']['nature'])
      : 'FATTUALE'

  return {
    score_solidita: safeScore,
    incoerenze_rilevate: toArray(raw?.incoerenze_rilevate),
    buchi_narrativi: toArray(raw?.buchi_narrativi),
    consiglio_investigativo: String(raw?.consiglio_investigativo || '').trim(),
    emotional_profile: {
      dominant_emotion,
      intensity: normalized_intensity,
      stress_indicators: toArray(raw?.emotional_profile?.stress_indicators),
    },
    frivolity_check: {
      is_likely_futile: Boolean(raw?.frivolity_check?.is_likely_futile),
      nature: normalized_nature,
      reasoning: String(raw?.frivolity_check?.reasoning || '').trim(),
    },
  }
}

function geminiUserMessage(status: number, body: string): string {
  if (status === 400) return 'Chiave API Gemini non valida o richiesta errata. Verifica GOOGLE_GENERATIVE_AI_API_KEY su Vercel.'
  if (status === 401 || status === 403) return 'Chiave API Gemini non autorizzata. Controlla la chiave in Vercel (Environment Variables).'
  if (status === 429) return 'Limite utilizzo Gemini raggiunto. Riprova più tardi.'
  if (status >= 500) return 'Servizio Gemini temporaneamente non disponibile. Riprova più tardi.'
  return 'Errore durante l\'analisi. Riprova o verifica la chiave API su Vercel.'
}

export async function analyzeConsistency(description: string): Promise<ConsistencyAnalysisResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('CRITICAL: API KEY MISSING')
    throw new Error('Chiave API non configurata. Aggiungi GOOGLE_GENERATIVE_AI_API_KEY in Vercel.')
  }

  if (!description) {
    return {
      score_solidita: 50,
      incoerenze_rilevate: [],
      buchi_narrativi: [],
      consiglio_investigativo: 'Descrizione mancante: raccogliere dettagli aggiuntivi.',
      emotional_profile: {
        dominant_emotion: 'CALMA/OGGETTIVA',
        intensity: 'BASSA',
        stress_indicators: [],
      },
      frivolity_check: {
        is_likely_futile: false,
        nature: 'FATTUALE',
        reasoning: 'Dati insufficienti per valutare la futilità.',
      },
    }
  }

  try {
  const { redactedText, tokenMap } = redactSensitiveText(description.trim())

  const prompt = `Sei un detective esperto in analisi testuale e interrogatori. Analizza questa segnalazione cercando ERRORI LOGICI e DATI MANCANTI.
Non devi giudicare se è vero o falso, ma se il racconto è COERENTE.
Analizza il testo mantenendo rigorosamente i placeholder originali (es. [NOME_1], [EMAIL_1], [CF_1], [DATE_1], [ORG_1]) quando ti riferisci alle persone o entità. Non provare a indovinare i nomi reali.
Regola sui DATI MANCANTI: il nome del segnalante è OPZIONALE. Se la segnalazione è anonima o il nome non è presente, NON inserirlo mai nella lista "buchi_narrativi". Considera la segnalazione completa se ci sono i fatti, anche senza firma. Elenca solo mancanze fattuali (es. data, luogo, prove/testimoni, descrizione dettagliata).
CONTESTO AZIENDALE IMPLICITO: Non inserire mai "Nome Azienda", "Luogo di Lavoro" o "Ente di appartenenza" nella lista dei dati mancanti. Dai per scontato che i fatti siano avvenuti all'interno dell'azienda che riceve la segnalazione, a meno che il testo non specifichi chiaramente che sono avvenuti presso terzi (es. presso un fornitore).
Esempio negativo: se l'utente scrive "Il direttore ha rubato", NON dire "Manca il nome dell'azienda". Dì: "Dati mancanti: Nessuno" (se il resto c'è).
Valutazione solidità: NON abbassare il punteggio di solidità solo perché la segnalazione è anonima. Valuta basandoti su coerenza interna, dettagli forniti e presenza di prove.
Contesto legale: nel whistleblowing (D.Lgs 24/2023) l'anonimato è un diritto protetto e una condizione standard, non un errore.

Restituisci un JSON rigoroso:
{
  "score_solidita": (numero 1-100 basato su ricchezza dettagli e coerenza),
  "incoerenze_rilevate": ["Es: Dice lunedì ma cita una data che era domenica", "Es: Dice di essere solo ma poi parla di un collega"],
  "buchi_narrativi": ["Es: Manca la data dell'evento", "Es: Non specifica chi era presente"],
  "consiglio_investigativo": "Frase sintetica su cosa verificare subito",
  "emotional_profile": {
    "dominant_emotion": "PAURA" | "RABBIA" | "FRUSTRAZIONE" | "VENDETTA" | "CALMA/OGGETTIVA",
    "intensity": "BASSA" | "MEDIA" | "ALTA",
    "stress_indicators": ["Uso di maiuscole", "Punteggiatura aggressiva"]
  },
  "frivolity_check": {
    "is_likely_futile": true | false,
    "nature": "FATTUALE" | "SOGGETTIVA/OPINIONE" | "CONFLITTO INTERPERSONALE",
    "reasoning": "Spiegazione sintetica del perché"
  }
}

Testo da analizzare: "${redactedText}"`

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
    console.error('Gemini API error', response.status, rawText?.slice(0, 500))
    throw new Error(geminiUserMessage(response.status, rawText))
  }

  let outer: any
  try {
    outer = JSON.parse(rawText)
  } catch (error) {
    console.error('Gemini parse error:', (error as any)?.message)
    throw new Error('Risposta Gemini non valida. Riprova più tardi.')
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
  } catch (error) {
    console.error('Gemini JSON parse error:', (error as any)?.message)
    throw new Error('Risposta Gemini non valida. Riprova più tardi.')
  }

  const normalized = normalizeResult(parsed)
  return restoreTokensInObject(normalized, tokenMap) as ConsistencyAnalysisResult
  } catch (err: any) {
    const msg = err?.message && typeof err.message === 'string' && err.message.length < 300 ? err.message : 'Errore durante l\'analisi. Verifica la chiave API Gemini su Vercel e riprova.'
    console.error('analyzeConsistency error:', err?.message ?? err)
    throw new Error(msg)
  }
}
