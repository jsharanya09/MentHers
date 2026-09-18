// A mentor is only considered if they share at least one field with the mentee AND
// at least one meeting format (otherwise they couldn't actually work together).
// Mentors that pass are scored out of 100 using the weights below.
const WEIGHTS = {
  skills: 40,
  fields: 25,
  approach: 15,
  frequency: 10,
  format: 10,
}

const overlap = (a = [], b = []) => a.filter((value) => b.includes(value))

// Share of the mentee's choices that the mentor covers (0 to 1).
const coverage = (shared, wanted = []) => (wanted.length === 0 ? 0 : shared.length / wanted.length)

export function matchMentors(mentee, mentors, limit = 5) {
  const matches = []

  for (const mentor of mentors) {
    const fields = overlap(mentee.fields, mentor.fields)
    const formats = overlap(mentee.format, mentor.formats)
    if (fields.length === 0 || formats.length === 0) continue

    const skills = overlap(mentee.skills, mentor.skills)
    const approach = mentee.approach === mentor.approach
    const frequency = mentor.frequencies.includes(mentee.frequency)

    const score = Math.round(
      WEIGHTS.skills * coverage(skills, mentee.skills) +
        WEIGHTS.fields * coverage(fields, mentee.fields) +
        WEIGHTS.format * coverage(formats, mentee.format) +
        (approach ? WEIGHTS.approach : 0) +
        (frequency ? WEIGHTS.frequency : 0),
    )

    matches.push({
      mentor: {
        id: mentor.id,
        name: mentor.name,
        title: mentor.title,
        company: mentor.company,
        bio: mentor.bio,
        sample: mentor.sample,
      },
      score,
      // What the mentee and mentor have in common, so the UI can explain the match.
      matched: {
        fields,
        skills,
        formats,
        approach: approach ? mentor.approach : null,
        frequency: frequency ? mentee.frequency : null,
      },
    })
  }

  return matches
    .sort((a, b) => b.score - a.score || a.mentor.name.localeCompare(b.mentor.name))
    .slice(0, limit)
}

// Blends the rule-based score with the AI's judgement of how well a mentor fits what the mentee
// wrote (60% rules, 40% AI), attaches the AI's one-line reason, and returns the top results.
// With no assessments (AI off or failed) it just returns the rule-based order.
export function blendWithAi(candidates, assessments, limit = 5) {
  const blended = candidates.map((candidate) => {
    const assessment = assessments?.get(candidate.mentor.id)
    if (!assessments) return candidate

    // A mentor the AI didn't rate keeps their rule score as a neutral AI score.
    const fit = assessment?.fit ?? candidate.score
    return {
      ...candidate,
      score: Math.round(0.6 * candidate.score + 0.4 * fit),
      ...(assessment && { insight: assessment.why }),
    }
  })

  return blended
    .sort((a, b) => b.score - a.score || a.mentor.name.localeCompare(b.mentor.name))
    .slice(0, limit)
}
