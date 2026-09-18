import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createMentor, listMentors } from './db.js'
import { matchMentors } from './matching.js'
import { parseMentorSignup } from './mentorSignup.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Takes a mentee's questionnaire answers and returns ranked mentor matches.
app.post('/api/matches', (req, res) => {
  const answers = req.body ?? {}
  const listsValid = ['fields', 'skills', 'format'].every((key) => Array.isArray(answers[key]))

  if (answers.role !== 'mentee' || !listsValid) {
    return res.status(400).json({ error: 'Send a completed mentee questionnaire.' })
  }

  res.json({ matches: matchMentors(answers, listMentors()) })
})

// Saves a new mentor from the mentor questionnaire.
app.post('/api/mentors', (req, res) => {
  const { mentor, error } = parseMentorSignup(req.body)
  if (error) return res.status(400).json({ error })

  const id = createMentor(mentor)
  if (id === null) {
    return res.status(409).json({ error: 'A mentor with that email address is already signed up.' })
  }

  res.status(201).json({ id })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
