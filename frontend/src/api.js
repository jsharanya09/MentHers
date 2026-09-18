// An error whose message came from the backend and is safe to show to the user.
export class ApiError extends Error {}

async function request(method, url, body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(data.error || `Request failed with status ${response.status}`)
  }

  return response.json()
}

// Mentees get back { menteeId, matches }, a ranked list of mentors.
// Mentors are saved and get back { token } for their private inbox link.
export async function submitAnswers(answers) {
  if (answers.role === 'mentor') {
    const { token } = await request('POST', '/api/mentors', answers)
    return { matches: [], token }
  }

  return request('POST', '/api/matches', answers)
}

export function requestIntro({ menteeId, mentorId, message }) {
  return request('POST', '/api/intro-requests', { menteeId, mentorId, message })
}

export function fetchMentorRequests(token) {
  return request('GET', '/api/mentor-requests', undefined, { 'X-Mentor-Token': token })
}

export function markRequestsSeen(token) {
  return request('POST', '/api/mentor-requests/seen', undefined, { 'X-Mentor-Token': token })
}
