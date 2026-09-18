import { isEmail, isList, isOptionalText, isText } from './validation.js'

// Checks the mentee questionnaire answers sent by the frontend.
// Returns { error } if something is wrong, otherwise { mentee }.
// Keys `fields`, `skills`, `format`, `frequency` and `approach` are what matching reads.
export function parseMenteeAnswers(body) {
  const a = body ?? {}

  const valid =
    a.role === 'mentee' &&
    isText(a.name, 100) &&
    isEmail(a.email) &&
    isText(a.stage, 30) &&
    isList(a.fields) &&
    isList(a.skills) &&
    isList(a.format) &&
    isText(a.frequency, 30) &&
    isText(a.approach, 30) &&
    isText(a.goals, 1000) &&
    isOptionalText(a.timezone, 100)

  if (!valid) return { error: 'Please complete every required question with a valid answer.' }

  return {
    mentee: {
      name: a.name.trim(),
      email: a.email.trim().toLowerCase(),
      stage: a.stage,
      fields: a.fields,
      skills: a.skills,
      format: a.format,
      frequency: a.frequency,
      approach: a.approach,
      goals: a.goals.trim(),
      timezone: a.timezone?.trim() || null,
    },
  }
}

// Checks a request from a mentee to be introduced to a mentor.
export function parseIntroRequest(body) {
  const a = body ?? {}

  const valid =
    isText(a.menteeId, 64) && Number.isInteger(a.mentorId) && isText(a.message, 500)

  if (!valid) return { error: 'Please write a short message (up to 500 characters).' }

  return { request: { menteeId: a.menteeId, mentorId: a.mentorId, message: a.message.trim() } }
}
