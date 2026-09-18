import { useState } from 'react'
import { ApiError, sendReport } from '../api'

// A small "Report" link that opens a form. Reports go to the MentHers team.
function ReportButton({ requestId }) {
  const [status, setStatus] = useState('idle') // idle | open | sending | sent
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (reason.trim() === '') {
      setError('Please tell us what happened.')
      return
    }

    setStatus('sending')
    setError('')
    try {
      await sendReport(requestId, reason)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setStatus('open')
    }
  }

  if (status === 'sent') {
    return (
      <p className="field-hint" role="status">
        Thank you. We’ve received your report and will look into it.
      </p>
    )
  }

  if (status === 'idle') {
    return (
      <button type="button" className="link-button report-link" onClick={() => setStatus('open')}>
        Report a problem
      </button>
    )
  }

  return (
    <form className="report-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={`report-${requestId}`}>What happened?</label>
      <textarea
        id={`report-${requestId}`}
        rows={3}
        maxLength={500}
        value={reason}
        aria-invalid={error ? true : undefined}
        onChange={(event) => setReason(event.target.value)}
      />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions actions-start">
        <button type="submit" className="btn btn-primary btn-small" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send report'}
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

export default ReportButton
