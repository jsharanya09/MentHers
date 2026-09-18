import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import {
  createIntroRequest,
  createMentee,
  createMentor,
  getMentee,
  getMentorByToken,
  getMentorContact,
  isEmailVerified,
  listMentors,
  listRequestsForMentor,
  markRequestsSeen,
  requestedMentorIds,
} from './db.js'
import { CODE_TTL_MINUTES, confirmCode, createCode } from './emailVerification.js'
import { matchMentors } from './matching.js'
import { sendNewRequestEmail, sendVerificationEmail } from './mailer.js'
import { parseIntroRequest, parseMenteeAnswers } from './menteeSignup.js'
import { parseMentorSignup } from './mentorSignup.js'
import { isEmail } from './validation.js'

const app = express()
const PORT = process.env.PORT || 3001

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
app.post('/api/matches', (req, res) => {
  const { mentee, error } = parseMenteeAnswers(req.body)
  if (error) return res.status(400).json({ error })
  if (!isEmailVerified(mentee.email, req.body.verificationToken)) {
    return res.status(403).json(NOT_VERIFIED)
  }

  const menteeId = createMentee(mentee)
  const alreadyRequested = requestedMentorIds(mentee.email)

  const matches = matchMentors(mentee, listMentors()).map((match) => ({
    ...match,
    requested: alreadyRequested.has(match.mentor.id),
  }))

  res.json({ menteeId, matches })
})

// Saves a new mentor from the mentor questionnaire.
// The returned token opens the mentor's private inbox of intro requests.
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

  res.status(201).json(created)
})

// A mentee asks to be introduced to a mentor. The mentor is notified by email and in their inbox.
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

// The mentor's inbox, opened with the secret token from their private link.
function requireMentor(req, res, next) {
  const mentor = getMentorByToken(req.get('x-mentor-token'))
  if (!mentor) return res.status(401).json({ error: 'This link isn’t valid.' })
  req.mentor = mentor
  next()
}

app.get('/api/mentor-requests', requireMentor, (req, res) => {
  const requests = listRequestsForMentor(req.mentor.id)
  res.json({ mentor: { name: req.mentor.name }, requests })
})

// Called once the mentor has actually seen their requests, which clears the "new" markers.
app.post('/api/mentor-requests/seen', requireMentor, (req, res) => {
  markRequestsSeen(req.mentor.id)
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
