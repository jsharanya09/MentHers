// An error whose message came from the backend and is safe to show to the user.
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(method, url, body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(data.error || `Request failed with status ${response.status}`, response.status)
  }

  return response.json()
}

// Emails a 6-digit code to the address.
export function sendVerificationCode(email) {
  return request('POST', '/api/verify-email/send', { email })
}

// Checks the code. Resolves to { verificationToken }, which proves the email is verified.
export function confirmVerificationCode(email, code) {
  return request('POST', '/api/verify-email/confirm', { email, code })
}

// Mentees get back { menteeId, matches }, a ranked list of mentors.
// Mentors are saved and get back { token } for their private inbox link.
export async function submitAnswers(answers, verificationToken) {
  const body = { ...answers, verificationToken }

  if (answers.role === 'mentor') {
    const { token } = await request('POST', '/api/mentors', body)
    return { matches: [], token }
  }

  return request('POST', '/api/matches', body)
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
