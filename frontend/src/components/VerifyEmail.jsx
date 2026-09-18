import { useEffect, useRef, useState } from 'react'
import { ApiError, confirmVerificationCode, sendVerificationCode } from '../api'

const RESEND_SECONDS = 60

// Asks for the 6-digit code that was emailed, to prove the address belongs to the person.
// `onVerified(token)` runs after the code is accepted and may return a promise.
function VerifyEmail({ email, onVerified, onChangeEmail }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  const messageFor = (err, fallback) => (err instanceof ApiError ? err.message : fallback)

  const handleVerify = async (event) => {
    event.preventDefault()

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { verificationToken } = await confirmVerificationCode(email, code)
      await onVerified(verificationToken)
    } catch (err) {
      setError(messageFor(err, 'Something went wrong. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    try {
      await sendVerificationCode(email)
      setCode('')
      setSecondsLeft(RESEND_SECONDS)
      setNotice('We sent you a new code.')
    } catch (err) {
      setError(messageFor(err, 'We couldn’t send a new code. Please try again.'))
    }
  }

  return (
    <form className="card" onSubmit={handleVerify} noValidate>
      <h2 tabIndex={-1} ref={headingRef}>
        Verify your email
      </h2>
      <p>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue. It expires in
        10 minutes.
      </p>

      <div className="field">
        <label htmlFor="verification-code">Verification code</label>
        <input
          id="verification-code"
          className="code-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          aria-invalid={error ? true : undefined}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        />
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="field-hint" role="status">
            {notice}
          </p>
        )}
      </div>

      <div className="actions actions-between">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onChangeEmail}
          disabled={busy}
        >
          Use a different email
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify and continue'}
        </button>
      </div>

      <p className="resend">
        Didn’t get it? Check your spam folder or{' '}
        <button
          type="button"
          className="link-button"
          onClick={handleResend}
          disabled={busy || secondsLeft > 0}
        >
          {secondsLeft > 0 ? `resend in ${secondsLeft}s` : 'send a new code'}
        </button>
        .
      </p>
    </form>
  )
}

export default VerifyEmail
