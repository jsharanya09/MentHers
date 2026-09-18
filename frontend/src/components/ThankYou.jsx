import { useEffect, useRef } from 'react'

// Shown to mentors after signing up.
function ThankYou({ answers, onRestart }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const firstName = answers.name?.trim().split(' ')[0]

  return (
    <section className="card thank-you">
      <h2 tabIndex={-1} ref={headingRef}>
        Thank you{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p>
        You’re signed up as a mentor. Mentees whose goals fit your experience will now see your profile in
        their matches.
      </p>
      <p className="field-hint">
        When a mentee asks to connect, we’ll email {answers.email} and you can accept or decline from your
        account.
      </p>
      <div className="actions actions-center">
        <a className="btn btn-primary" href="#/account">
          Go to my account
        </a>
        <button type="button" className="btn btn-secondary" onClick={onRestart}>
          Start over
        </button>
      </div>
    </section>
  )
}

export default ThankYou
