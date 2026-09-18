import { isEmail, isList, isOptionalText, isText } from './validation.js'

// Checks the mentor questionnaire answers sent by the frontend.
// Returns { error } if something is wrong, otherwise { mentor } in the shape the database expects.
export function parseMentorSignup(body) {
  const a = body ?? {}

  const valid =
    a.role === 'mentor' &&
    isText(a.name, 100) &&
    isEmail(a.email) &&
    isText(a.jobTitle, 100) &&
    isText(a.company, 100) &&
    isText(a.bio, 1000) &&
    isText(a.stage, 30) &&
    isList(a.fields) &&
    isList(a.skills) &&
    isList(a.format) &&
    isText(a.frequency, 30) &&
    isText(a.approach, 30) &&
    isOptionalText(a.timezone, 100) &&
    isOptionalText(a.goals, 1000)

  if (!valid) return { error: 'Please complete every required question with a valid answer.' }

  return {
    mentor: {
      name: a.name.trim(),
      email: a.email.trim().toLowerCase(),
      title: a.jobTitle.trim(),
      company: a.company.trim(),
      bio: a.bio.trim(),
      stage: a.stage,
      fields: a.fields,
      skills: a.skills,
      formats: a.format,
      frequencies: [a.frequency],
      approach: a.approach,
      timezone: a.timezone?.trim() || null,
      motivation: a.goals?.trim() || null,
    },
  }
}
