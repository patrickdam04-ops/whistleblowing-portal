/**
 * SLA utilities per D.Lgs. 24/2023 (Direttiva UE 2019/1937):
 * - Riscontro iniziale entro 7 giorni
 * - Comunicazione esito entro 90 giorni
 */

export const DAYS_INITIAL_FEEDBACK = 7
export const DAYS_FINAL_OUTCOME = 90

export function getInitialFeedbackDeadline(createdAt: string): Date {
  const created = new Date(createdAt)
  const deadline = new Date(created)
  deadline.setDate(deadline.getDate() + DAYS_INITIAL_FEEDBACK)
  return deadline
}

export function getFinalOutcomeDeadline(createdAt: string): Date {
  const created = new Date(createdAt)
  const deadline = new Date(created)
  deadline.setDate(deadline.getDate() + DAYS_FINAL_OUTCOME)
  return deadline
}

export function getDaysRemaining(deadline: Date, now: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const diff = deadline.getTime() - now.getTime()
  return Math.floor(diff / msPerDay)
}

export type InitialFeedbackStatus = 'ok' | 'overdue' | 'pending'
export type FinalOutcomeStatus = 'ok' | 'overdue' | 'pending'

export function getInitialFeedbackStatus(report: {
  created_at: string
  acknowledged_at: string | null
}): InitialFeedbackStatus {
  if (report.acknowledged_at) return 'ok'
  const deadline = getInitialFeedbackDeadline(report.created_at)
  const remaining = getDaysRemaining(deadline)
  if (remaining < 0) return 'overdue'
  return 'pending'
}

export function getFinalOutcomeStatus(report: {
  created_at: string
  status: string
}): FinalOutcomeStatus {
  const closed = report.status === 'RESOLVED' || report.status === 'DISMISSED'
  const deadline = getFinalOutcomeDeadline(report.created_at)
  const now = new Date()
  const remaining = getDaysRemaining(deadline, now)
  if (closed) return 'ok'
  if (remaining < 0) return 'overdue'
  return 'pending'
}

/** Label per riscontro 7 gg: lista o dettaglio */
export function getInitialFeedbackLabel(report: {
  created_at: string
  acknowledged_at: string | null
}): string {
  if (report.acknowledged_at) return 'Riscontro inviato'
  const deadline = getInitialFeedbackDeadline(report.created_at)
  const remaining = getDaysRemaining(deadline)
  if (remaining < 0) return `Riscontro scaduto (${Math.abs(remaining)} gg fa)`
  if (remaining === 0) return 'Riscontro oggi'
  return `Riscontro: ${remaining} gg`
}

/** Label per esito 90 gg: lista o dettaglio */
export function getFinalOutcomeLabel(report: {
  created_at: string
  status: string
}): string {
  const closed = report.status === 'RESOLVED' || report.status === 'DISMISSED'
  const deadline = getFinalOutcomeDeadline(report.created_at)
  const remaining = getDaysRemaining(deadline)
  if (closed) {
    if (remaining >= 0) return 'Chiuso in tempo'
    return 'Chiuso oltre termine'
  }
  if (remaining < 0) return `Esito scaduto (${Math.abs(remaining)} gg fa)`
  if (remaining === 0) return 'Esito oggi'
  return `Esito: ${remaining} gg`
}
