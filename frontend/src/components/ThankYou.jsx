import { useEffect, useRef, useState } from 'react'

// Shown to mentors after signing up. The private link opens their inbox of intro requests.
function ThankYou({ answers, token, onRestart }) {
  const headingRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const firstName = answers.name?.trim().split(' ')[0]
  const inboxUrl = `${window.location.origin}/#/requests/${token}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inboxUrl)
      setCopied(true)
    } catch {
      // Clipboard can be blocked; the link is still shown so it can be copied by hand.
    }
  }

  return (
    <section className="card thank-you">
      <h2 tabIndex={-1} ref={headingRef}>
        Thank you{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p>
        You’re signed up as a mentor. Mentees whose goals fit your experience will now see your
        profile in their matches.
      </p>

      <div className="inbox-box">
        <h3>Your private inbox link</h3>
        <p className="field-hint">
          When a mentee asks to connect, we’ll email {answers.email} and show the request here.
          Save this link. Anyone who has it can see your requests, so keep it private.
        </p>
        <a className="inbox-link" href={`#/requests/${token}`}>
          {inboxUrl}
        </a>
        <div className="actions actions-center">
          <button type="button" className="btn btn-secondary btn-small" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a className="btn btn-primary btn-small" href={`#/requests/${token}`}>
            Open my inbox
          </a>
        </div>
      </div>

      <button type="button" className="btn btn-secondary" onClick={onRestart}>
        Start over
      </button>
    </section>
  )
}

export default ThankYou
