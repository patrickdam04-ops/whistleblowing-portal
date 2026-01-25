export interface RedactionResult {
  redactedText: string
  tokenMap: Record<string, string>
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

export const redactSensitiveText = (input: string, names?: string[]): RedactionResult => {
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
    const escapedToken = escapeRegExp(token)
    const regex = new RegExp(escapedToken, 'gi')
    restored = restored.replace(regex, original)
  })
  return restored
}

export const restoreTokensInObject = (
  value: unknown,
  tokenMap: Record<string, string>
): unknown => {
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
