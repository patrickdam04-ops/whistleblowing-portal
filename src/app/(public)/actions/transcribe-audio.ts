'use server'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const PRIMARY_MODEL = 'gemini-1.5-flash'
const FALLBACK_MODEL = 'gemini-1.5-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return Buffer.from(binary, 'binary').toString('base64')
}

async function callGemini(model: string, file: File): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('CRITICAL: API KEY MISSING')
    throw new Error('Configurazione Server Mancante')
  }

  const buffer = await file.arrayBuffer()
  const base64 = arrayBufferToBase64(buffer)
  const mimeType = file.type || 'audio/webm'

  const prompt =
    'Trascrivi questo audio in italiano fedelmente. Non aggiungere commenti, spiegazioni o punteggiatura eccessiva. Restituisci solo il testo parlato.'

  const response = await fetch(`${API_BASE}${model}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            { text: prompt },
          ],
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

  const text = outer?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return String(text).replace(/```/g, '').trim()
}

export async function transcribeAudio(formData: FormData): Promise<{ success: boolean; text?: string; error?: string }> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('CRITICAL: API KEY MISSING')
    throw new Error('Configurazione Server Mancante')
  }

  const file = formData.get('audio') as File | null

  if (!file || file.size === 0) {
    return { success: false, error: 'Nessun audio ricevuto' }
  }

  try {
    const text = await callGemini(PRIMARY_MODEL, file)
    return { success: true, text }
  } catch (error) {
    console.error('Gemini Error:', (error as any)?.message, (error as any)?.response?.data)
    try {
      const text = await callGemini(FALLBACK_MODEL, file)
      return { success: true, text }
    } catch (fallbackError) {
      console.error(
        'Gemini Error:',
        (fallbackError as any)?.message,
        (fallbackError as any)?.response?.data
      )
      return { success: false, error: 'Trascrizione non disponibile al momento' }
    }
  }
}
