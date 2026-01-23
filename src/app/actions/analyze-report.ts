'use server'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-1.5-pro'
const URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  MODEL +
  ':generateContent?key=' +
  API_KEY

export interface AIAnalysisResult {
  summary: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  recommended_actions: string[]
}

export async function analyzeReport(
  description: string
): Promise<AIAnalysisResult> {
  if (!description) {
    return {
      summary: 'Descrizione mancante',
      risk_level: 'LOW',
      recommended_actions: ['Fornire una descrizione valida'],
    }
  }

  try {
    if (!API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY non configurata')
    }
    console.log('Tentativo analisi con modello:', MODEL)

    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Sei un esperto legale. Analizza questa segnalazione: "${description}".
Rispondi SOLO con un JSON valido (senza markdown) con:
{ "summary": "riassunto breve", "risk_level": "LOW/MEDIUM/HIGH", "recommended_actions": ["azione1", "azione2"] }`,
              },
            ],
          },
        ],
      }),
    })

    const rawText = await response.text()

    if (!response.ok) {
      throw new Error(`Google Error ${response.status}: ${rawText}`)
    }

    // Se arriviamo qui, l'AI ha risposto! Puliamo e restituiamo.
    const cleanJson = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    let finalText = cleanJson
    if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
      finalText = parsed.candidates[0].content.parts[0].text
    }

    const finalJsonString = finalText.replace(/```json|```/g, '').trim()

    // Estrai il JSON se è racchiuso in altro testo
    const firstBrace = finalJsonString.indexOf('{')
    const lastBrace = finalJsonString.lastIndexOf('}')
    const extractedJson =
      firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? finalJsonString.substring(firstBrace, lastBrace + 1)
        : finalJsonString

    const analysis = JSON.parse(extractedJson) as AIAnalysisResult

    // Validazione base
    if (!analysis.summary || !analysis.risk_level || !Array.isArray(analysis.recommended_actions)) {
      throw new Error('Risposta AI non valida: campi mancanti')
    }

    // Normalizza risk_level
    const normalizedRisk = analysis.risk_level.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH'
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(normalizedRisk)) {
      throw new Error(`Risk level non valido: ${analysis.risk_level}`)
    }

    return {
      summary: analysis.summary,
      risk_level: normalizedRisk,
      recommended_actions: analysis.recommended_actions,
    }
  } catch (error: any) {
    console.error('ERRORE GEMINI:', error?.message || error)
    // Anche in caso di crash totale, salviamo la giornata
    return {
      summary: 'Errore di connessione AI. Impossibile analizzare al momento.',
      risk_level: 'LOW',
      recommended_actions: [
        'Controllare la connessione internet',
        'Verificare lo stato dei servizi Google',
      ],
    }
  }
}
