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
// Mentors are saved (and signed in) and get back an empty list of matches.
export async function submitAnswers(answers, verificationToken) {
  const body = { ...answers, verificationToken }

  if (answers.role === 'mentor') {
    await request('POST', '/api/mentors', body)
    return { matches: [] }
  }

  return request('POST', '/api/matches', body)
}

export function requestIntro({ menteeId, mentorId, message }) {
  return request('POST', '/api/intro-requests', { menteeId, mentorId, message })
}

// Asks the backend for an AI-written first draft of the intro message.
export function draftIntro({ menteeId, mentorId }) {
  return request('POST', '/api/intro-drafts', { menteeId, mentorId })
}

// ---- Accounts ----

export async function fetchMe() {
  const { user } = await request('GET', '/api/me')
  return user
}

export function login(email, code) {
  return request('POST', '/api/auth/login', { email, code })
}

export function logout() {
  return request('POST', '/api/auth/logout', {})
}

export function deleteMyAccount() {
  return request('DELETE', '/api/me')
}

export function fetchMyRequests() {
  return request('GET', '/api/me/requests')
}

export function markMyRequestsSeen() {
  return request('POST', '/api/me/requests/seen', {})
}

export function respondToRequest(requestId, status) {
  return request('POST', `/api/me/requests/${requestId}/respond`, { status })
}

export function fetchSentRequests() {
  return request('GET', '/api/me/sent-requests')
}

export function sendReport(requestId, reason) {
  return request('POST', '/api/reports', { requestId, reason })
}
