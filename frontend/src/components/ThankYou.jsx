import { useEffect, useRef } from 'react'

function ThankYou({ answers, onRestart }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const firstName = answers.name?.trim().split(' ')[0]
  const message =
    'You’re signed up as a mentor. Mentees whose goals fit your experience will now see your profile in their matches.'

  return (
    <section className="card thank-you">
      <h2 tabIndex={-1} ref={headingRef}>
        Thank you{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p>{message}</p>
      <p className="field-hint">Signed up with {answers.email}.</p>
      <button type="button" className="btn btn-secondary" onClick={onRestart}>
        Start over
      </button>
    </section>
  )
}

export default ThankYou
