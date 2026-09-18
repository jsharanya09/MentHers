// An error whose message came from the backend and is safe to show to the user.
export class ApiError extends Error {}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(data.error || `Request failed with status ${response.status}`)
  }

  return response.json()
}

// Mentees get back a ranked list of matching mentors.
// Mentors are saved, and get back an empty list of matches.
export async function submitAnswers(answers) {
  if (answers.role === 'mentor') {
    await post('/api/mentors', answers)
    return { matches: [] }
  }

  return post('/api/matches', answers)
}
