import crypto from 'node:crypto'
import {
  addFailedCodeAttempt,
  deleteEmailCode,
  getEmailCode,
  purgeExpiredVerifications,
  saveEmailCode,
  saveVerificationToken,
} from './db.js'

export const CODE_TTL_MINUTES = 10
const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000
const TOKEN_TTL_MS = 60 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_WRONG_GUESSES = 5

const hashCode = (email, code) =>
  crypto.createHash('sha256').update(`${email}:${code}`).digest('hex')

const sameHash = (a, b) => crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))

// Makes a new 6-digit code for an email. Only the hash is stored.
// Returns { code } to be emailed, or { retryAfterSeconds } if one was sent too recently.
export function createCode(email, now = Date.now()) {
  purgeExpiredVerifications(now)

  const existing = getEmailCode(email)
  if (existing && now - existing.sent_at < RESEND_COOLDOWN_MS) {
    return { retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - (now - existing.sent_at)) / 1000) }
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  saveEmailCode({ email, codeHash: hashCode(email, code), expiresAt: now + CODE_TTL_MS, sentAt: now })
  return { code }
}

// Checks the code. On success returns { token }, a one-hour proof that this email is verified.
// Otherwise returns { error: 'expired' | 'too-many' | 'incorrect' }.
export function confirmCode(email, code, now = Date.now()) {
  const row = getEmailCode(email)
  if (!row || row.expires_at < now) return { error: 'expired' }
  if (row.attempts >= MAX_WRONG_GUESSES) return { error: 'too-many' }

  if (!sameHash(row.code_hash, hashCode(email, code))) {
    addFailedCodeAttempt(email)
    return { error: 'incorrect' }
  }

  deleteEmailCode(email)
  const token = crypto.randomBytes(16).toString('hex')
  saveVerificationToken(email, token, now + TOKEN_TTL_MS)
  return { token }
}
