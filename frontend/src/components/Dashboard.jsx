import { useEffect, useRef, useState } from 'react'
import {
  ApiError,
  deleteMyAccount,
  fetchMyRequests,
  fetchSentRequests,
  logout,
  markMyRequestsSeen,
  respondToRequest,
} from '../api'
import { optionLabel } from '../utils/labels'
import ReportButton from './ReportButton'

const STATUS_LABELS = { pending: 'Waiting', accepted: 'Accepted', declined: 'Declined' }

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const messageFor = (error) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'

function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{STATUS_LABELS[status]}</span>
}

// A request a mentee sent to this person (shown to mentors).
function IncomingRequest({ request, onRespond }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const answer = async (status) => {
    setBusy(true)
    setError('')
    try {
      await onRespond(request.id, status)
    } catch (err) {
      setError(messageFor(err))
      setBusy(false)
    }
  }

  return (
    <li className="card match">
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
        <StatusBadge status={request.status} />
      </div>
      <p className="match-bio">“{request.message}”</p>
      {request.goals && (
        <p className="field-hint">
          <strong>Their goal:</strong> {request.goals}
        </p>
      )}

      {request.status === 'pending' ? (
        <>
          <p className="field-hint">
            Accepting shares your email address with {request.name.split(' ')[0]} so you can talk.
          </p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions actions-start">
            <button
              type="button"
              className="btn btn-primary btn-small"
              disabled={busy}
              onClick={() => answer('accepted')}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              disabled={busy}
              onClick={() => answer('declined')}
            >
              Decline
            </button>
          </div>
        </>
      ) : request.status === 'accepted' ? (
        <p className="request-contact">
          Reach out at <a href={`mailto:${encodeURIComponent(request.email)}`}>{request.email}</a>
        </p>
      ) : null}

      <ReportButton requestId={request.id} />
    </li>
  )
}

// A request this person sent to a mentor (shown to mentees).
function SentRequest({ request }) {
  return (
    <li className="card match">
      <div className="match-head">
        <div className="match-who">
          <h3>{request.mentorName}</h3>
          <p>
            {request.mentorTitle}, {request.mentorCompany} · {formatDate(request.createdAt)}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>
      <p className="match-bio">“{request.message}”</p>

      {request.status === 'accepted' &&
        (request.mentorEmail ? (
          <p className="request-contact">
            🎉 {request.mentorName.split(' ')[0]} accepted! Reach out at{' '}
            <a href={`mailto:${encodeURIComponent(request.mentorEmail)}`}>{request.mentorEmail}</a>
          </p>
        ) : (
          <p className="request-contact">🎉 Accepted! Demo mentors don’t have a real inbox.</p>
        ))}
      {request.status === 'declined' && (
        <p className="field-hint">
          They can’t take on a new mentee right now. <a href="#/find">Try another mentor</a>.
        </p>
      )}
      {request.status === 'pending' && (
        <p className="field-hint">We’ll email you as soon as they answer.</p>
      )}

      <ReportButton requestId={request.id} />
    </li>
  )
}

// The signed-in person's home: requests they've received (mentors) and sent (mentees).
function Dashboard({ user, onSignedOut }) {
  const [incoming, setIncoming] = useState(null)
  const [sent, setSent] = useState(null)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const headingRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    if (user.mentor) {
      fetchMyRequests()
        .then((data) => {
          if (cancelled) return
          setIncoming(data.requests)
          if (data.requests.some((request) => request.isNew)) markMyRequestsSeen().catch(() => {})
        })
        .catch((err) => !cancelled && setError(messageFor(err)))
    }
    if (user.mentee) {
      fetchSentRequests()
        .then((data) => !cancelled && setSent(data.requests))
        .catch((err) => !cancelled && setError(messageFor(err)))
    }

    return () => {
      cancelled = true
    }
  }, [user.mentor, user.mentee])

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const handleRespond = async (requestId, status) => {
    await respondToRequest(requestId, status)
    setIncoming((list) =>
      list.map((request) => (request.id === requestId ? { ...request, status, isNew: false } : request)),
    )
  }

  const handleSignOut = async () => {
    setBusy(true)
    await logout().catch(() => {})
    onSignedOut()
  }

  const handleDelete = async () => {
    setBusy(true)
    setError('')
    try {
      await deleteMyAccount()
      onSignedOut()
    } catch (err) {
      setError(messageFor(err))
      setBusy(false)
    }
  }

  const name = (user.mentor ?? user.mentee)?.name.split(' ')[0]
  const waiting = incoming?.filter((request) => request.status === 'pending').length ?? 0
  const newCount = incoming?.filter((request) => request.isNew).length ?? 0

  return (
    <div>
      <h1 className="page-title" tabIndex={-1} ref={headingRef}>
        Hi {name}
      </h1>
      <p className="page-sub">Signed in as {user.email}</p>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {user.mentor && (
        <section aria-labelledby="incoming-heading">
          <h2 id="incoming-heading" className="section-title">
            Requests for you
          </h2>
          {newCount > 0 && (
            <p className="notice" role="status">
              🔔 You have {newCount} new intro {newCount === 1 ? 'request' : 'requests'}.
            </p>
          )}
          {incoming === null ? (
            <p className="page-sub">Loading…</p>
          ) : incoming.length === 0 ? (
            <div className="card">
              <p>No requests yet. When a mentee asks to connect, it will show up here and we’ll email you.</p>
            </div>
          ) : (
            <>
              {waiting > 0 && newCount === 0 && (
                <p className="field-hint">
                  {waiting} {waiting === 1 ? 'request is' : 'requests are'} waiting for your answer.
                </p>
              )}
              <ul className="match-list">
                {incoming.map((request) => (
                  <IncomingRequest key={request.id} request={request} onRespond={handleRespond} />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {user.mentee && (
        <section aria-labelledby="sent-heading">
          <h2 id="sent-heading" className="section-title">
            Your intro requests
          </h2>
          {sent === null ? (
            <p className="page-sub">Loading…</p>
          ) : sent.length === 0 ? (
            <div className="card">
              <p>You haven’t asked any mentors for an intro yet.</p>
              <a className="btn btn-primary" href="#/find">
                Find a mentor
              </a>
            </div>
          ) : (
            <>
              <ul className="match-list">
                {sent.map((request) => (
                  <SentRequest key={request.id} request={request} />
                ))}
              </ul>
              <p className="dashboard-cta">
                <a className="btn btn-secondary" href="#/find">
                  Find more mentors
                </a>
              </p>
            </>
          )}
        </section>
      )}

      <section className="card account-box" aria-labelledby="account-heading">
        <h2 id="account-heading" className="section-title">
          Your account
        </h2>
        <div className="actions actions-start">
          <button type="button" className="btn btn-secondary" onClick={handleSignOut} disabled={busy}>
            Sign out
          </button>
          {!confirmingDelete && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              Delete my account
            </button>
          )}
        </div>

        {confirmingDelete && (
          <div className="danger-box" role="alert">
            <p>
              <strong>This permanently deletes your profile, your requests and your data.</strong> It can’t be
              undone.
            </p>
            <div className="actions actions-start">
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="field-hint">
          Read how we handle your information on our <a href="#/safety">privacy and safety page</a>.
        </p>
      </section>
    </div>
  )
}

export default Dashboard
