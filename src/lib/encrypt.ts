/**
 * Cifratura/decifratura per dati sensibili (es. contatto segnalante).
 * Conformità D.Lgs. 24/2023: riservatezza tramite tecnologie come la crittografia.
 * Chiave da env: WHISTLEBLOW_ENCRYPTION_KEY (32 bytes in base64, es. openssl rand -base64 32).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

function getKey(): Buffer {
  const raw = process.env.WHISTLEBLOW_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('WHISTLEBLOW_ENCRYPTION_KEY must be set (32 bytes base64, e.g. openssl rand -base64 32)')
  }
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== KEY_LENGTH) {
    throw new Error('WHISTLEBLOW_ENCRYPTION_KEY must be 32 bytes when base64-decoded')
  }
  return buf
}

/**
 * Cifra un testo in chiaro. Output: base64(iv || authTag || ciphertext).
 */
export function encryptContact(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, enc]).toString('base64')
}

/**
 * Decifra una stringa prodotta da encryptContact. Restituisce null se dati non validi.
 */
export function decryptContact(ciphertext: string): string | null {
  if (!ciphertext || typeof ciphertext !== 'string') return null
  try {
    const key = getKey()
    const raw = Buffer.from(ciphertext, 'base64')
    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH) return null
    const iv = raw.subarray(0, IV_LENGTH)
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const enc = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    return decipher.update(enc).toString('utf8') + decipher.final('utf8')
  } catch {
    return null
  }
}
