import { useEffect, useRef } from 'react'

function ThankYou({ answers, onRestart }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const firstName = answers.name?.trim().split(' ')[0]
  const message =
    answers.role === 'mentor'
      ? 'We’ll look for mentees who could use your experience and get in touch when we find a match.'
      : 'We’ll look for mentors who fit your goals and get in touch when we find a match.'

  return (
    <section className="card thank-you">
      <h2 tabIndex={-1} ref={headingRef}>
        Thank you{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p>{message}</p>
      <p className="field-hint">We’ll email you at {answers.email}.</p>
      <button type="button" className="btn btn-secondary" onClick={onRestart}>
        Start over
      </button>
    </section>
  )
}

export default ThankYou
