import { useState } from 'react'
import { ApiError, requestIntro } from '../api'

// The "Request intro" button on a match card. It opens a small form for a short message.
function IntroRequest({ mentor, menteeId, alreadyRequested }) {
  const [status, setStatus] = useState(alreadyRequested ? 'sent' : 'idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const inputId = `intro-${mentor.id}`

  const handleSend = async (event) => {
    event.preventDefault()

    if (message.trim() === '') {
      setError('Please write a short message.')
      return
    }

    setStatus('sending')
    setError('')
    try {
      await requestIntro({ menteeId, mentorId: mentor.id, message })
      setStatus('sent')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      )
      setStatus('open')
    }
  }

  if (status === 'sent') {
    return (
      <p className="intro-sent" role="status">
        ✓ Intro request sent to {mentor.name}
      </p>
    )
  }

  if (status === 'idle') {
    return (
      <button type="button" className="btn btn-primary btn-small" onClick={() => setStatus('open')}>
        Request intro
      </button>
    )
  }

  return (
    <form className="intro-form" onSubmit={handleSend} noValidate>
      <label htmlFor={inputId}>Message for {mentor.name}</label>
      <p className="field-hint">
        {mentor.name} will see your name, email and this message.
      </p>
      <textarea
        id={inputId}
        rows={3}
        maxLength={500}
        value={message}
        placeholder="Introduce yourself and say what you’d like help with."
        aria-invalid={error ? true : undefined}
        onChange={(event) => setMessage(event.target.value)}
      />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions actions-start">
        <button type="submit" className="btn btn-primary btn-small" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send request'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => setStatus('idle')}
          disabled={status === 'sending'}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default IntroRequest
