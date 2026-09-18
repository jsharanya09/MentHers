import { useEffect, useRef, useState } from 'react'
import { ApiError, login, sendVerificationCode } from '../api'
import VerifyEmail from './VerifyEmail'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Sign in with an emailed code. No password is needed.
function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [sent])

  const normalized = email.trim().toLowerCase()

  const handleSend = async (event) => {
    event.preventDefault()

    if (!EMAIL_PATTERN.test(normalized)) {
      setError('Please enter a valid email address.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await sendVerificationCode(normalized)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <VerifyEmail
        email={normalized}
        busyLabel="Signing you in…"
        confirm={login}
        onVerified={onSignedIn}
        onChangeEmail={() => setSent(false)}
      />
    )
  }

  return (
    <form className="card" onSubmit={handleSend} noValidate>
      <h2 tabIndex={-1} ref={headingRef}>
        Sign in
      </h2>
      <p>Enter the email you signed up with. We’ll send you a 6-digit code, so there’s no password to remember.</p>

      <div className="field">
        <label htmlFor="signin-email">Email address</label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          aria-invalid={error ? true : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send me a code'}
        </button>
      </div>

      <p className="resend">
        New here? <a href="#/find">Find a mentor</a> or <a href="#/mentor">become a mentor</a>.
      </p>
    </form>
  )
}

export default SignIn
