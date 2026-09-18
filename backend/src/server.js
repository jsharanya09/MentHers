import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import {
  createIntroRequest,
  createMentee,
  createMentor,
  createSession,
  deleteAccount,
  deleteSession,
  getLatestMentee,
  getMentee,
  getMenteeProfile,
  getMentorByEmail,
  getMentorContact,
  getMentorProfile,
  getRequestParties,
  getSessionEmail,
  hasAccount,
  isEmailVerified,
  listMentors,
  listRequestsForMentor,
  listSentRequests,
  markRequestsSeen,
  requestedMentorIds,
  respondToRequest,
  saveReport,
} from './db.js'
import { aiEnabled, assessMatches, draftIntroMessage } from './ai.js'
import { CODE_TTL_MINUTES, confirmCode, createCode } from './emailVerification.js'
import { blendWithAi, matchMentors } from './matching.js'
import {
  sendNewRequestEmail,
  sendReportEmail,
  sendRequestResponseEmail,
  sendVerificationEmail,
} from './mailer.js'
import { parseIntroRequest, parseMenteeAnswers } from './menteeSignup.js'
import { parseMentorSignup } from './mentorSignup.js'
import { isEmail, isText } from './validation.js'

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// Behind a hosting provider's proxy, trust it so visitors' real IP addresses (for rate limits)
// and HTTPS (for secure cookies) are detected correctly.
if (isProduction) app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())

// Simple in-memory limit per IP address, so the code endpoints can't be used to spam inboxes
// or guess codes. It resets when the server restarts.
function rateLimit({ windowMs, max }) {
  const hits = new Map()

  return (req, res, next) => {
    const now = Date.now()

    if (hits.size > 1000) {
      for (const [key, times] of hits) {
        if (times.every((time) => now - time >= windowMs)) hits.delete(key)
      }
    }

    const recent = (hits.get(req.ip) ?? []).filter((time) => now - time < windowMs)
    if (recent.length >= max) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' })
    }

    recent.push(now)
    hits.set(req.ip, recent)
    next()
  }
}

const HOUR = 60 * 60 * 1000

// ---- Sessions ----
// A signed-in browser holds a random token in an httpOnly cookie; the database only stores its hash.
const SESSION_COOKIE = 'menthers_session'
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function readCookie(req, name) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return undefined
}

function startSession(res, email) {
  res.cookie(SESSION_COOKIE, createSession(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: SESSION_MAX_AGE_MS,
  })
}

// Adds req.userEmail (or null) from the session cookie.
app.use((req, res, next) => {
  req.sessionToken = readCookie(req, SESSION_COOKIE)
  req.userEmail = getSessionEmail(req.sessionToken)
  next()
})

function requireUser(req, res, next) {
  if (!req.userEmail) return res.status(401).json({ error: 'Please sign in.' })
  next()
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Step 1 of verifying an email address: email a 6-digit code.
app.post('/api/verify-email/send', rateLimit({ windowMs: HOUR, max: 10 }), async (req, res) => {
  if (!isEmail(req.body?.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  const email = req.body.email.trim().toLowerCase()

  const { code, retryAfterSeconds } = createCode(email)
  if (retryAfterSeconds) {
    return res.status(429).json({
      error: `Please wait ${retryAfterSeconds} seconds before asking for another code.`,
    })
  }

  const sent = await sendVerificationEmail(email, code, CODE_TTL_MINUTES)
  if (!sent) {
    return res.status(502).json({ error: 'We couldn’t send the email. Please try again shortly.' })
  }

  res.json({ ok: true, expiresInMinutes: CODE_TTL_MINUTES })
})

// Step 2: check the code. The returned token proves the email is verified for the next hour.
const CONFIRM_ERRORS = {
  incorrect: 'That code isn’t right. Please check it and try again.',
  expired: 'That code has expired. Please ask for a new one.',
  'too-many': 'Too many wrong guesses. Please ask for a new code.',
}

app.post('/api/verify-email/confirm', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }), (req, res) => {
  const { email, code } = req.body ?? {}
  if (!isEmail(email) || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Please enter the 6-digit code from your email.' })
  }

  const result = confirmCode(email.trim().toLowerCase(), code)
  if (result.error) return res.status(400).json({ error: CONFIRM_ERRORS[result.error] })

  res.json({ verificationToken: result.token })
})

const NOT_VERIFIED = { error: 'Please verify your email address first.' }

// Saves a mentee's questionnaire answers and returns ranked mentor matches.
// `menteeId` is private to that mentee and is needed to send intro requests.
app.post('/api/matches', rateLimit({ windowMs: HOUR, max: 60 }), async (req, res) => {
  const { mentee, error } = parseMenteeAnswers(req.body)
  if (error) return res.status(400).json({ error })
  if (!isEmailVerified(mentee.email, req.body.verificationToken)) {
    return res.status(403).json(NOT_VERIFIED)
  }

  const menteeId = createMentee(mentee)
  startSession(res, mentee.email)
  const alreadyRequested = requestedMentorIds(mentee.email)

  // Rules pick the best 8, then AI (when configured) reads the mentee's goal and the mentors'
  // bios to reorder them and explain each one. Without AI the rule-based top 5 is used.
  const candidates = matchMentors(mentee, listMentors(), 8)
  const assessments = await assessMatches(mentee, candidates)

  const matches = blendWithAi(candidates, assessments).map((match) => ({
    ...match,
    requested: alreadyRequested.has(match.mentor.id),
  }))

  res.json({ menteeId, matches, aiDrafting: aiEnabled() })
})

// Writes a first draft of an intro message for the mentee to edit. Uses AI, so it is rate limited.
app.post('/api/intro-drafts', rateLimit({ windowMs: HOUR, max: 30 }), async (req, res) => {
  const { menteeId, mentorId } = req.body ?? {}
  if (!isText(menteeId, 64) || !Number.isInteger(mentorId)) {
    return res.status(400).json({ error: 'Something went wrong. Please try again.' })
  }

  const mentee = getMenteeProfile(menteeId)
  const mentor = getMentorProfile(mentorId)
  if (!mentee || !mentor) {
    return res.status(404).json({ error: 'We couldn’t find that mentor. Please try again.' })
  }
  if (!aiEnabled()) {
    return res.status(503).json({ error: 'Message suggestions aren’t available right now.' })
  }

  const draft = await draftIntroMessage(mentee, mentor)
  if (!draft) {
    return res
      .status(502)
      .json({ error: 'We couldn’t write a draft right now. You can write your own message.' })
  }

  res.json({ draft })
})

// Saves a new mentor from the mentor questionnaire and signs them in.
app.post('/api/mentors', (req, res) => {
  const { mentor, error } = parseMentorSignup(req.body)
  if (error) return res.status(400).json({ error })
  if (!isEmailVerified(mentor.email, req.body.verificationToken)) {
    return res.status(403).json(NOT_VERIFIED)
  }

  const created = createMentor(mentor)
  if (created === null) {
    return res.status(409).json({ error: 'A mentor with that email address is already signed up.' })
  }

  startSession(res, mentor.email)
  res.status(201).json({ id: created.id })
})

// A mentee asks to be introduced to a mentor. The mentor is notified by email and in their account.
app.post('/api/intro-requests', (req, res) => {
  const { request, error } = parseIntroRequest(req.body)
  if (error) return res.status(400).json({ error })

  const status = createIntroRequest(request)

  if (status === 'no-mentee' || status === 'no-mentor') {
    return res.status(404).json({ error: 'We couldn’t find that mentor. Please try again.' })
  }
  if (status === 'duplicate') {
    return res.status(409).json({ error: 'You’ve already asked this mentor for an intro.' })
  }

  // Not awaited: the mentee shouldn't wait on the email, and a failed email is only logged.
  sendNewRequestEmail(getMentorContact(request.mentorId), getMentee(request.menteeId).name)

  res.status(201).json({ ok: true })
})

// ---- Signing in and accounts ----

// Sign in with the emailed code. There are no passwords. Only emails that already have an account
// can sign in, and this is only revealed to someone who proved they own the email.
app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }), (req, res) => {
  const { email, code } = req.body ?? {}
  if (!isEmail(email) || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Please enter the 6-digit code from your email.' })
  }
  const normalized = email.trim().toLowerCase()

  const result = confirmCode(normalized, code)
  if (result.error) return res.status(400).json({ error: CONFIRM_ERRORS[result.error] })

  if (!hasAccount(normalized)) {
    return res.status(404).json({
      error: 'We couldn’t find an account for that email. Please sign up as a mentor or mentee first.',
    })
  }

  startSession(res, normalized)
  res.json({ ok: true })
})

app.post('/api/auth/logout', (req, res) => {
  deleteSession(req.sessionToken)
  res.clearCookie(SESSION_COOKIE)
  res.json({ ok: true })
})

// Who is signed in (or { user: null }), and which roles they have.
app.get('/api/me', (req, res) => {
  if (!req.userEmail) return res.json({ user: null })

  const mentor = getMentorByEmail(req.userEmail)
  const mentee = getLatestMentee(req.userEmail)
  res.json({
    user: {
      email: req.userEmail,
      mentor: mentor ? { name: mentor.name } : null,
      mentee: mentee ? { name: mentee.name } : null,
    },
  })
})

// Permanently deletes the signed-in person's data.
app.delete('/api/me', requireUser, (req, res) => {
  deleteAccount(req.userEmail)
  res.clearCookie(SESSION_COOKIE)
  res.json({ ok: true })
})

// ---- A mentor's requests (signed in) ----

app.get('/api/me/requests', requireUser, (req, res) => {
  const mentor = getMentorByEmail(req.userEmail)
  res.json({ requests: mentor ? listRequestsForMentor(mentor.id) : [] })
})

app.post('/api/me/requests/seen', requireUser, (req, res) => {
  const mentor = getMentorByEmail(req.userEmail)
  if (mentor) markRequestsSeen(mentor.id)
  res.json({ ok: true })
})

// A mentor accepts or declines a request. The mentee is emailed. Accepting shares the mentor's email.
app.post('/api/me/requests/:id/respond', requireUser, (req, res) => {
  const status = req.body?.status
  const requestId = Number(req.params.id)
  if (!['accepted', 'declined'].includes(status) || !Number.isInteger(requestId)) {
    return res.status(400).json({ error: 'Something went wrong. Please try again.' })
  }

  const mentor = getMentorByEmail(req.userEmail)
  const answered = mentor ? respondToRequest(requestId, mentor.id, status) : null
  if (!answered) {
    return res.status(404).json({ error: 'That request was already answered, or it isn’t yours.' })
  }

  sendRequestResponseEmail({ ...answered, status })
  res.json({ ok: true, status })
})

// ---- A mentee's requests (signed in) ----

app.get('/api/me/sent-requests', requireUser, (req, res) => {
  res.json({ requests: listSentRequests(req.userEmail) })
})

// ---- Safety ----

// Reports the other person in an intro request. Only the mentee or the mentor on it can report.
app.post('/api/reports', requireUser, rateLimit({ windowMs: HOUR, max: 20 }), (req, res) => {
  const { requestId, reason } = req.body ?? {}
  if (!Number.isInteger(requestId) || !isText(reason, 500)) {
    return res.status(400).json({ error: 'Please tell us what happened (up to 500 characters).' })
  }

  const parties = getRequestParties(requestId)
  let reportedEmail = null
  if (parties?.mentorEmail === req.userEmail) reportedEmail = parties.menteeEmail
  else if (parties?.menteeEmail === req.userEmail) reportedEmail = parties.mentorEmail
  if (!reportedEmail) {
    return res.status(404).json({ error: 'We couldn’t find that request.' })
  }

  const report = { reporterEmail: req.userEmail, reportedEmail, requestId, reason: reason.trim() }
  saveReport(report)
  sendReportEmail(report)
  res.status(201).json({ ok: true })
})

// Unknown API paths get a JSON 404 instead of the web page.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// When the frontend has been built (npm run build in frontend/), serve it from here too, so the
// whole app runs as a single service.
const frontendDist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
  if (fs.existsSync(frontendDist)) console.log('Serving the built frontend from frontend/dist')

  if (!process.env.SMTP_HOST) {
    console.warn(
      isProduction
        ? 'WARNING: SMTP_HOST is not set. Verification codes are NOT being emailed, so nobody can sign up. Set the SMTP_* variables.'
        : 'Email is not configured: verification codes are printed here instead of being emailed.',
    )
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('AI features are off (ANTHROPIC_API_KEY is not set). Matching uses rules only.')
  }
})
