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
  listMentors,
  listRequestsForMentor,
  markRequestsSeen,
  requestedMentorIds,
} from './db.js'
import { matchMentors } from './matching.js'
import { sendNewRequestEmail } from './mailer.js'
import { parseIntroRequest, parseMenteeAnswers } from './menteeSignup.js'
import { parseMentorSignup } from './mentorSignup.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Saves a mentee's questionnaire answers and returns ranked mentor matches.
// `menteeId` is private to that mentee and is needed to send intro requests.
app.post('/api/matches', (req, res) => {
  const { mentee, error } = parseMenteeAnswers(req.body)
  if (error) return res.status(400).json({ error })

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
