import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { mentors } from './data/mentors.js'
import { matchMentors } from './matching.js'

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

  res.json({ matches: matchMentors(answers, mentors) })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
