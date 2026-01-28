'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'
import { redactSensitiveText, restoreTokensInObject } from '@/lib/privacy-redaction'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-2.5-pro'

export interface AIAnalysisResult {
  summary: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  recommended_actions: string[]
}

interface AnalyzeOptions {
  names?: string[]
  reportId?: string
}

export async function analyzeReport(
  description: string,
  options?: AnalyzeOptions
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
      console.error('ERRORE GEMINI: GOOGLE_GENERATIVE_AI_API_KEY non configurata')
      return {
        summary: 'Analisi AI non disponibile al momento.',
        risk_level: 'LOW',
        recommended_actions: [
          'Verifica la configurazione della chiave API',
          'Riprova più tardi',
        ],
      }
    }
    console.log(
      'CHIAVE USATA:',
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.slice(0, 5) + '...'
    )
    console.log(
      'DEBUG CHIAVE:',
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10)
    )
    const textOnlyDescription = description.trim()
    const { redactedText, tokenMap } = redactSensitiveText(textOnlyDescription, options?.names)
    console.log('Analisi IA: solo testo, nessun allegato inviato')
    console.log('Tentativo analisi con modello:', MODEL)

    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: MODEL })

    const prompt = `Sei un esperto legale. Analizza questa segnalazione: "${redactedText}".
Analizza il testo mantenendo rigorosamente i placeholder originali (es. [NOME_1], [EMAIL_1], [CF_1], [DATE_1], [ORG_1]) quando ti riferisci alle persone o entità. Non provare a indovinare i nomi reali.
Rispondi SOLO con un JSON valido (senza markdown) con:
{ "summary": "riassunto breve", "risk_level": "LOW/MEDIUM/HIGH", "recommended_actions": ["azione1", "azione2"] }`

    let result
    try {
      result = await model.generateContent(prompt)
    } catch (error: any) {
      const errorMessage = String(error?.message || error || '')
      if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found')) {
        try {
          const availableModels = await (genAI as any).getGenerativeModelFactory().listModels()
          console.error(
            `ERRORE: Il modello 'gemini-2.5-pro' non è stato trovato. Ecco i modelli disponibili per questa API Key: ${JSON.stringify(availableModels)}`
          )
        } catch (listError: any) {
          console.error(
            `ERRORE: Il modello 'gemini-2.5-pro' non è stato trovato. Impossibile recuperare la lista modelli: ${listError?.message || listError}`
          )
        }
      }
      throw error
    }
    const response = result.response
    const rawText = response.text()

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

    const restored = restoreTokensInObject(
      {
        summary: analysis.summary,
        risk_level: normalizedRisk,
        recommended_actions: analysis.recommended_actions,
      },
      tokenMap
    ) as AIAnalysisResult

    if (options?.reportId) {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('reports')
          .update({ ai_analysis: restored })
          .eq('id', options.reportId)
        if (error) {
          console.error('Errore salvataggio analisi AI:', error)
        }
      } catch (dbError) {
        console.error('Errore connessione DB per salvataggio analisi AI:', dbError)
      }
    }

    return restored
  } catch (error: any) {
    console.error('ERRORE GEMINI:', error)
    return {
      summary: 'Analisi AI non disponibile al momento.',
      risk_level: 'LOW',
      recommended_actions: [
        'Riprova tra qualche minuto',
        'Se il problema persiste, verifica i log su Vercel',
      ],
    }
  }
}
