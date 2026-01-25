'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-1.5-flash'

export interface AIAnalysisResult {
  summary: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  recommended_actions: string[]
}

interface RedactionResult {
  redactedText: string
  tokenMap: Record<string, string>
}

interface AnalyzeOptions {
  names?: string[]
  reportId?: string
}

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const CF_REGEX = /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi
const DATE_REGEX = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g
const ISO_DATE_REGEX = /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g
const TEXT_DATE_REGEX =
  /\b\d{1,2}\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}\b/gi
const ORG_REGEX =
  /\b[A-Z][A-Za-z0-9&.\- ]+(?:S\.?p\.?A\.?|S\.?R\.?L\.?|SRL|SPA|SAS)\b/g
const NAME_REGEX = /\b[A-ZÀ-Ù][a-zà-ù]+(?:\s+[A-ZÀ-Ù][a-zà-ù]+){1,3}\b/g

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const redactSensitiveText = (input: string, names?: string[]): RedactionResult => {
  let redactedText = input
  const tokenMap: Record<string, string> = {}
  const valueToToken = new Map<string, string>()
  const counters = { EMAIL: 0, CF: 0, DATE: 0, NAME: 0, ORG: 0 }

  const createToken = (label: keyof typeof counters, value: string) => {
    const normalizedKey = value.trim().toLowerCase()
    const existing = valueToToken.get(normalizedKey)
    if (existing) return existing
    counters[label] += 1
    const token = `[${label}_${counters[label]}]`
    tokenMap[token] = value
    valueToToken.set(normalizedKey, token)
    return token
  }

  const replaceMatches = (regex: RegExp, label: keyof typeof counters) => {
    const matches = redactedText.match(regex) || []
    matches.forEach((match) => {
      const token = createToken(label, match)
      redactedText = redactedText.replace(new RegExp(escapeRegExp(match), 'g'), token)
    })
  }

  replaceMatches(EMAIL_REGEX, 'EMAIL')
  replaceMatches(CF_REGEX, 'CF')
  replaceMatches(ISO_DATE_REGEX, 'DATE')
  replaceMatches(DATE_REGEX, 'DATE')
  replaceMatches(TEXT_DATE_REGEX, 'DATE')
  replaceMatches(ORG_REGEX, 'ORG')

  if (names && names.length > 0) {
    names.forEach((name) => {
      if (!name || !redactedText.includes(name)) return
      const token = createToken('NAME', name)
      redactedText = redactedText.replace(new RegExp(escapeRegExp(name), 'g'), token)
    })
  }

  replaceMatches(NAME_REGEX, 'NAME')

  return { redactedText, tokenMap }
}

const restoreTokensInValue = (value: string, tokenMap: Record<string, string>) => {
  let restored = value
  Object.entries(tokenMap).forEach(([token, original]) => {
    restored = restored.replace(new RegExp(escapeRegExp(token), 'g'), original)
  })
  return restored
}

const restoreTokensInObject = (value: unknown, tokenMap: Record<string, string>): unknown => {
  if (typeof value === 'string') {
    return restoreTokensInValue(value, tokenMap)
  }
  if (Array.isArray(value)) {
    return value.map((item) => restoreTokensInObject(item, tokenMap))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, restoreTokensInObject(val, tokenMap)])
    )
  }
  return value
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

    const result = await model.generateContent(prompt)
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
