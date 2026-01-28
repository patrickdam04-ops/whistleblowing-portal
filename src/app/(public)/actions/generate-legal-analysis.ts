'use server'

import { redactSensitiveText, restoreTokensInObject } from '@/lib/privacy-redaction'

export type LegalRiskLevel = 'ALTO' | 'MEDIO' | 'BASSO'

export interface LegalAnalysisResult {
  reati_ipotizzati: string[]
  livello_rischio: LegalRiskLevel
  riferimenti_normativi: string[]
  suggerimenti_azione: string[]
}

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const PRIMARY_MODEL = 'gemini-2.5-pro'
const FALLBACK_MODEL = 'gemini-2.5-pro'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'

const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
]

function buildPrompt(description: string): string {
  return `Sei un assistente legale esperto in diritto italiano (D.Lgs 231/01, Sicurezza, GDPR). Analizza il testo e restituisci un JSON rigoroso con:
{
  "reati_ipotizzati": ["Nome Reato 1", "Nome Reato 2"],
  "livello_rischio": "ALTO" | "MEDIO" | "BASSO",
  "riferimenti_normativi": ["Art. X", "D.Lgs Y"],
  "suggerimenti_azione": ["Azione 1", "Azione 2"]
}
Analizza il testo mantenendo rigorosamente i placeholder originali (es. [NOME_1], [EMAIL_1], [CF_1], [DATE_1], [ORG_1]) quando ti riferisci alle persone o entità. Non provare a indovinare i nomi reali.

Testo da analizzare: "${description}"`
}

function normalizeResult(raw: any): LegalAnalysisResult {
  const risk = String(raw?.livello_rischio || '').toUpperCase()
  const livello_rischio: LegalRiskLevel =
    risk === 'ALTO' || risk === 'MEDIO' || risk === 'BASSO' ? risk : 'BASSO'

  const toArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((item) => String(item)) : []

  return {
    reati_ipotizzati: toArray(raw?.reati_ipotizzati),
    livello_rischio,
    riferimenti_normativi: toArray(raw?.riferimenti_normativi),
    suggerimenti_azione: toArray(raw?.suggerimenti_azione),
  }
}

async function callGeminiModel(model: string, description: string): Promise<LegalAnalysisResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('CRITICAL: API KEY MISSING')
    throw new Error('Configurazione Server Mancante')
  }

  const { redactedText, tokenMap } = redactSensitiveText(description.trim())

  const response = await fetch(`${API_BASE}${model}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      safetySettings,
      contents: [
        {
          parts: [{ text: buildPrompt(redactedText) }],
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
  } catch (error) {
    console.error('Gemini Error:', (error as any)?.message, (error as any)?.response?.data)
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
  } catch (error) {
    console.error('Gemini Error:', (error as any)?.message, (error as any)?.response?.data)
    throw new Error(`JSON Gemini non valido: ${cleaned}`)
  }

  const normalized = normalizeResult(parsed)
  return restoreTokensInObject(normalized, tokenMap) as LegalAnalysisResult
}

export async function generateLegalAnalysis(description: string): Promise<LegalAnalysisResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('CRITICAL: API KEY MISSING')
    throw new Error('Configurazione Server Mancante')
  }

  if (!description) {
    return {
      reati_ipotizzati: [],
      livello_rischio: 'BASSO',
      riferimenti_normativi: [],
      suggerimenti_azione: [],
    }
  }

  try {
    return await callGeminiModel(PRIMARY_MODEL, description)
  } catch (error) {
    console.error('Gemini Error:', (error as any)?.message, (error as any)?.response?.data)
    return await callGeminiModel(FALLBACK_MODEL, description)
  }
}
