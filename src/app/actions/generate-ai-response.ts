'use server'

import type { ConsistencyAnalysisResult } from '@/app/(public)/actions/analyze-consistency'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-2.0-flash-exp'
const URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  MODEL +
  ':generateContent?key=' +
  API_KEY

export async function generateAIResponse(
  description: string,
  ticketCode?: string,
  sherlockAnalysis?: ConsistencyAnalysisResult | null,
  mode: 'SHERLOCK' | 'STANDARD' = 'STANDARD'
): Promise<string> {
  if (!description) {
    throw new Error('Descrizione mancante')
  }

  try {
    if (!API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY non configurata')
    }
    console.log('🤖 Generazione risposta AI per segnalazione...', ticketCode ? `Codice: ${ticketCode}` : '')

    // Costruisci il prompt migliorato
    const codeReference = ticketCode
      ? `La segnalazione è stata registrata con il codice ${ticketCode}.`
      : 'La segnalazione è stata registrata.'

    const hasSherlockData =
      !!sherlockAnalysis &&
      ((sherlockAnalysis.incoerenze_rilevate?.length ?? 0) > 0 ||
        (sherlockAnalysis.buchi_narrativi?.length ?? 0) > 0)

    const sherlockContext = sherlockAnalysis
      ? `SherlockAnalysis:
- incoerenze_rilevate: ${JSON.stringify(sherlockAnalysis.incoerenze_rilevate || [])}
- buchi_narrativi: ${JSON.stringify(sherlockAnalysis.buchi_narrativi || [])}
- consiglio_investigativo: ${sherlockAnalysis.consiglio_investigativo || ''}`
      : 'SherlockAnalysis: nessun dato disponibile'

    const intent = mode === 'SHERLOCK' && hasSherlockData ? 'ASK_PROOF' : 'STANDARD'

    const prompt = `Sei un assistente legale specializzato in Whistleblowing (D.Lgs 24/2023).
Intent: ${intent}
Se nel parametro 'sherlockAnalysis' sono presenti buchi narrativi o dati mancanti (es. date, luoghi), e l'intent è 'ASK_PROOF', devi generare una risposta che chieda SPECIFICAMENTE quei dati mancanti. Sii preciso e gentile.

Analizza questa segnalazione: "${description}".

Genera una bozza di risposta professionale che:
- Ringrazi il segnalante per il senso civico dimostrato.
- Confermi che la segnalazione è stata registrata. ${codeReference}
- Spieghi i prossimi passi in modo specifico basandoti sul contenuto della segnalazione:
  * Se si parla di furto, appropriazione indebita o irregolarità finanziarie, menziona l'avvio di un audit interno o il controllo dei registri contabili.
  * Se si parla di sicurezza sul lavoro, menziona un'ispezione tecnica o una verifica dei dispositivi di sicurezza.
  * Se si parla di discriminazione o molestie, menziona l'avvio di un'indagine interna con il supporto delle risorse umane.
  * Se si parla di violazioni ambientali, menziona una verifica tecnica e il coinvolgimento degli enti competenti se necessario.
  * Se si parla di altro, adatta i prossimi passi al contesto specifico.
- Sia empatica ma mantenga il distacco professionale richiesto in ambito legale.
- Eviti promesse legali vincolanti ma assicuri la massima riservatezza e il rispetto delle normative sul whistleblowing.
- Sia scritta in italiano, in tono formale ma accessibile.
- Sia lunga circa 200-250 parole.

NON includere placeholder come [Nome] o [Azienda]. Scrivi una bozza pronta all'uso, completa e professionale.

SherlockAnalysis: ${mode === 'SHERLOCK' ? sherlockContext : 'IGNORARE'}

Rispondi SOLO con il testo della lettera, senza aggiungere commenti, note aggiuntive o formattazioni markdown.`

    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    const rawText = await response.text()

    // Gestione errori
    if (!response.ok) {
      console.warn('AI API Error:', response.status, rawText)

      // Se è un problema di quota o server, restituiamo una risposta di fallback
      if (response.status === 429 || response.status >= 500) {
        const codeReference = ticketCode
          ? `La sua segnalazione è stata registrata con il codice ${ticketCode}.`
          : 'La sua segnalazione è stata registrata.'

        return `Gentile Segnalante,

La ringraziamo per il senso civico dimostrato nel segnalare quanto da lei osservato.

Con la presente, confermiamo la ricezione della sua segnalazione. ${codeReference} La sua segnalazione sarà oggetto di un'attenta valutazione da parte del nostro team competente, che procederà con le verifiche necessarie.

Le assicuriamo che la sua segnalazione verrà trattata con la massima riservatezza e nel rispetto delle normative vigenti in materia di whistleblowing (D.Lgs 24/2023).

La terremo informata sull'esito delle verifiche non appena disponibile.

Cordiali saluti,
Il Responsabile della Gestione delle Segnalazioni`
      }

      throw new Error(`Google Error ${response.status}: ${rawText}`)
    }

    // Parsing della risposta
    const cleanJson = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    let finalText = cleanJson
    if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
      finalText = parsed.candidates[0].content.parts[0].text
    }

    // Pulisci eventuali markdown o formattazioni
    const cleanedResponse = finalText
      .replace(/```json|```|```text|```/g, '')
      .trim()

    // Estrai solo il testo se c'è altro contenuto
    const firstLine = cleanedResponse.split('\n')[0]
    if (cleanedResponse.length > 500 && firstLine.includes('{')) {
      // Probabilmente è JSON, estrai solo il testo
      const textMatch = cleanedResponse.match(/"text":\s*"([^"]+)"/)
      if (textMatch) {
        return textMatch[1].replace(/\\n/g, '\n')
      }
    }

    return cleanedResponse
  } catch (error: any) {
    console.error('Critical AI Error:', error)
    // Restituisci una risposta di fallback in caso di errore
    const codeReference = ticketCode
      ? `La sua segnalazione è stata registrata con il codice ${ticketCode}.`
      : 'La sua segnalazione è stata registrata.'

    return `Gentile Segnalante,

La ringraziamo per il senso civico dimostrato nel segnalare quanto da lei osservato.

Con la presente, confermiamo la ricezione della sua segnalazione. ${codeReference} La sua segnalazione sarà oggetto di un'attenta valutazione da parte del nostro team competente, che procederà con le verifiche necessarie.

Le assicuriamo che la sua segnalazione verrà trattata con la massima riservatezza e nel rispetto delle normative vigenti in materia di whistleblowing (D.Lgs 24/2023).

La terremo informata sull'esito delle verifiche non appena disponibile.

Cordiali saluti,
Il Responsabile della Gestione delle Segnalazioni`
  }
}
