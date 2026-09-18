import { useEffect, useRef, useState } from 'react'
import { ApiError, fetchMentorRequests, markRequestsSeen } from '../api'
import { optionLabel } from '../utils/labels'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

// A mentor's private inbox, opened from the link they got when signing up.
function MentorRequests({ token }) {
  const [state, setState] = useState({ status: 'loading' })
  const headingRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetchMentorRequests(token)
      .then((data) => {
        if (cancelled) return
        setState({ status: 'ready', ...data })
        // Only clear the "new" markers once the requests have actually been shown.
        if (data.requests.some((request) => request.isNew)) {
          markRequestsSeen(token).catch(() => {})
        }
      })
      .catch((error) => {
        if (cancelled) return
        setState({
          status: 'error',
          message:
            error instanceof ApiError ? error.message : 'We couldn’t load your requests. Please try again.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (state.status !== 'loading') headingRef.current?.focus()
  }, [state.status])

  if (state.status === 'loading') return <p className="page-sub">Loading your requests…</p>

  if (state.status === 'error') {
    return (
      <section className="card">
        <h1 className="page-title" tabIndex={-1} ref={headingRef}>
          Couldn’t open your inbox
        </h1>
        <p className="field-error" role="alert">
          {state.message}
        </p>
        <a className="btn btn-secondary" href="#/">
          Back to home
        </a>
      </section>
    )
  }

  const newCount = state.requests.filter((request) => request.isNew).length

  return (
    <section>
      <h1 className="page-title" tabIndex={-1} ref={headingRef}>
        Hi {state.mentor.name.split(' ')[0]}, here are your intro requests
      </h1>
      <p className="page-sub">Keep this page’s link private. Anyone who has it can see these requests.</p>

      {newCount > 0 && (
        <p className="notice" role="status">
          🔔 You have {newCount} new intro {newCount === 1 ? 'request' : 'requests'}.
        </p>
      )}

      {state.requests.length === 0 ? (
        <div className="card">
          <p>No requests yet. When a mentee asks to connect, it will show up here.</p>
        </div>
      ) : (
        <ul className="match-list">
          {state.requests.map((request) => (
            <li key={request.id} className="card match">
              <div className="match-head">
                <div className="match-who">
                  <h3>
                    {request.name}
                    {request.isNew && <span className="new-badge">New</span>}
                  </h3>
                  <p>
                    {optionLabel('stage', request.stage)} · {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
              <p className="match-bio">“{request.message}”</p>
              {request.goals && (
                <p className="field-hint">
                  <strong>Their goal:</strong> {request.goals}
                </p>
              )}
              <p className="request-contact">
                Reach out at{' '}
                <a href={`mailto:${encodeURIComponent(request.email)}`}>{request.email}</a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MentorRequests
