export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function truncateDescription(description: string, maxLength: number = 100): string {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}

/** Prime N parole per anteprima in tabella; clicca per vedere tutto. */
export function previewDescription(description: string, maxWords: number = 5): string {
  const trimmed = description.trim()
  if (!trimmed) return ''
  const words = trimmed.split(/\s+/)
  if (words.length <= maxWords) return trimmed
  return words.slice(0, maxWords).join(' ') + '…'
}
