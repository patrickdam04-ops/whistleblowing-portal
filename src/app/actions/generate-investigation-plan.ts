'use server'

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const MODEL = 'gemini-1.5-flash'
const URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  MODEL +
  ':generateContent?key=' +
  API_KEY

// Funzione helper per generare un piano mock basato sulla descrizione
function generateMockPlan(description: string): string {
  const lowerDesc = description.toLowerCase()
  
  // Rileva il tipo di segnalazione
  let specificSteps = ''
  
  if (lowerDesc.includes('furto') || lowerDesc.includes('rubato') || lowerDesc.includes('sottratto')) {
    specificSteps = `1. Verifica log di accesso
   - Controlla i registri di accesso al magazzino o all'area interessata
   - Verifica gli orari di accesso nelle 48 ore precedenti la segnalazione
   - Identifica tutti gli accessi sospetti

2. Ispezione aree citate
   - Verifica fisicamente le aree menzionate nella segnalazione
   - Controlla l'inventario e confronta con i registri
   - Documenta eventuali discrepanze

3. Intervista testimoni
   - Identifica i dipendenti presenti nell'area al momento dei fatti
   - Intervista separatamente i testimoni potenziali
   - Documenta tutte le dichiarazioni`
  } else if (lowerDesc.includes('molest') || lowerDesc.includes('discrimin') || lowerDesc.includes('harass')) {
    specificSteps = `1. Protezione dell'anonimato
   - Assicurati che il segnalante rimanga completamente protetto
   - Non rivelare informazioni che possano identificare il segnalante
   - Mantieni la massima riservatezza

2. Verifica testimoni
   - Identifica eventuali testimoni dei fatti segnalati
   - Intervista i testimoni separatamente e in modo confidenziale
   - Documenta tutte le dichiarazioni

3. Controllo registri HR
   - Verifica i registri delle risorse umane per eventuali segnalazioni precedenti
   - Controlla le comunicazioni interne relative all'area interessata
   - Non confrontare direttamente le parti senza consulenza legale`
  } else if (lowerDesc.includes('sicurezza') || lowerDesc.includes('accesso') || lowerDesc.includes('permesso')) {
    specificSteps = `1. Verifica log di accesso
   - Controlla i log di accesso ai sistemi informatici
   - Verifica i permessi degli utenti coinvolti
   - Identifica accessi non autorizzati o sospetti

2. Ispezione dispositivi
   - Verifica lo stato dei dispositivi di sicurezza citati
   - Controlla i registri delle telecamere se disponibili
   - Ispeziona fisicamente le aree interessate

3. Controllo permessi
   - Verifica i livelli di accesso assegnati
   - Confronta i permessi effettivi con quelli previsti
   - Identifica eventuali discrepanze`
  } else if (lowerDesc.includes('contabil') || lowerDesc.includes('fattura') || lowerDesc.includes('pagamento')) {
    specificSteps = `1. Verifica registri contabili
   - Controlla i registri contabili relativi al periodo indicato
   - Verifica le fatture e i documenti di pagamento
   - Confronta con i documenti originali

2. Analisi transazioni
   - Verifica tutte le transazioni sospette
   - Controlla le autorizzazioni per i pagamenti
   - Identifica eventuali discrepanze nei registri

3. Ispezione documenti
   - Verifica l'autenticità dei documenti citati
   - Controlla le firme e le autorizzazioni
   - Confronta con i documenti archiviati`
  } else {
    specificSteps = `1. Verifica immediata dei fatti
   - Controlla i registri e documenti pertinenti alla segnalazione
   - Verifica le prove materiali citate
   - Identifica i testimoni potenziali

2. Ispezione aree interessate
   - Verifica fisicamente le aree menzionate nella segnalazione
   - Controlla i sistemi e gli strumenti citati
   - Documenta lo stato attuale

3. Raccolta informazioni
   - Intervista i dipendenti coinvolti separatamente
   - Verifica i registri e le comunicazioni rilevanti
   - Documenta tutte le informazioni raccolte`
  }

  return `⚠️ I server AI sono attualmente carichi. Ecco un esempio di piano investigativo per questa segnalazione:

${specificSteps}

4. Documentazione e conservazione
   - Documenta tutto ciò che viene verificato
   - Conserva i registri e le comunicazioni rilevanti
   - Mantieni una traccia completa delle verifiche effettuate

5. Valutazione e consulenza
   - Valuta la gravità dei fatti accertati
   - Consulta un consulente legale prima di intraprendere azioni disciplinari
   - Considera l'invio di una denuncia alle autorità competenti se necessario

NOTA: Questo è un piano di esempio generato automaticamente. Per un piano specifico e dettagliato, riprova quando l'AI sarà disponibile.`
}

export async function generateInvestigationPlan(description: string): Promise<string> {
  if (!description) {
    throw new Error('Descrizione mancante')
  }

  // Disclaimer legale che verrà aggiunto a tutte le risposte
  const legalDisclaimer = `⚠️ DISCLAIMER LEGALE: Questo piano investigativo è generato automaticamente dall'AI e non costituisce consulenza legale. Consulta sempre un professionista qualificato prima di intraprendere azioni disciplinari o denunce.

`

  try {
    if (!API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY non configurata')
    }
    console.log('🕵️ Generazione piano investigativo per admin...')

    const prompt = `Agisci come un esperto di audit interno e sicurezza aziendale. 
Analizza questa segnalazione: "${description}".

In base al contenuto, suggerisci all'amministratore dell'azienda i passi pratici da compiere per verificare i fatti. 

IMPORTANTE:
- Se nella descrizione compaiono nomi di luoghi specifici (es: magazzino, ufficio A, reparto X), menzionali esplicitamente nei consigli.
- Se vengono citati strumenti o sistemi (es: badge, software, telecamere, registri), includili nei suggerimenti.
- Se si parla di furto o appropriazione indebita: suggerisci di controllare i registri di accesso del magazzino, verificare le telecamere citate, intervistare il responsabile di turno, controllare i movimenti di magazzino.
- Se si parla di molestie o discriminazione: assicurati di proteggere l'anonimato del segnalante, non confrontare subito le parti, verifica se ci sono stati testimoni, controlla i registri delle risorse umane.
- Se si parla di violazioni di sicurezza: verifica i log di accesso, controlla i permessi degli utenti, ispeziona i dispositivi di sicurezza.
- Se si parla di irregolarità contabili: controlla i registri contabili, verifica le fatture, confronta con i documenti originali.

Sii molto schematico e pratico. Usa un tono confidenziale rivolto al datore di lavoro. Organizza i suggerimenti in punti chiari e azionabili.

Rispondi SOLO con il testo del piano investigativo, senza aggiungere commenti o note aggiuntive.`

    const safetySettings = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]

    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        safetySettings,
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

    // Gestione errori - NON lanciare eccezioni per 429/503
    if (!response.ok) {
      console.warn('AI API Error:', response.status, rawText)

      // Se è un problema di quota (429) o server overload (503), restituiamo un piano mock
      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        console.log('🔄 Usando piano mock a causa di errore di quota/server')
        return legalDisclaimer + generateMockPlan(description)
      }

      // Per altri errori, restituiamo comunque un piano mock invece di lanciare errore
      console.log('🔄 Usando piano mock a causa di errore API')
      return legalDisclaimer + generateMockPlan(description)
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
        const extractedText = textMatch[1].replace(/\\n/g, '\n')
        // Aggiungi il disclaimer legale all'inizio
        return legalDisclaimer + extractedText
      }
    }

    // Aggiungi il disclaimer legale all'inizio della risposta AI
    return legalDisclaimer + cleanedResponse
  } catch (error: any) {
    console.error('Critical AI Error:', error)
    // Restituisci un piano mock in caso di errore critico
    console.log('🔄 Usando piano mock a causa di errore critico')
    return legalDisclaimer + generateMockPlan(description)
  }
}
