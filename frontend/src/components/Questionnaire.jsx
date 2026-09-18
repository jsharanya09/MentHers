import { useEffect, useRef, useState } from 'react'
import { STEPS } from '../data/questions'
import { validateStep } from '../utils/validation'
import { ApiError, sendVerificationCode, submitAnswers } from '../api'
import Field from './Field'
import MatchResults from './MatchResults'
import ThankYou from './ThankYou'
import VerifyEmail from './VerifyEmail'

function Questionnaire({ initialRole }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({ role: initialRole })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  // 'questions' while answering, then 'verify' to confirm the email address before saving.
  const [stage, setStage] = useState('questions')
  // Set once the emailed code is accepted: { email, token }.
  const [verification, setVerification] = useState(null)
  const headingRef = useRef(null)
  const formRef = useRef(null)

  // Some steps are only for one role (e.g. mentors are asked about their work).
  const steps = STEPS.filter((s) => !s.roles || s.roles.includes(answers.role))
  const step = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)

  // Move focus to the step heading so keyboard and screen reader users land at the top.
  useEffect(() => {
    headingRef.current?.focus()
  }, [stepIndex])

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) {
      setErrors((prev) => {
        const { [id]: _removed, ...rest } = prev
        return rest
      })
    }
  }

  const email = (answers.email ?? '').trim().toLowerCase()

  const showSubmitError = (error) => {
    // The backend says 403 when the verification is missing or has expired, so ask again next time.
    if (error instanceof ApiError && error.status === 403) setVerification(null)

    setSubmitError(
      error instanceof ApiError
        ? error.message
        : 'Something went wrong sending your answers. Please try again.',
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const stepErrors = validateStep(step, answers)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      const firstId = step.questions.find((q) => stepErrors[q.id]).id
      formRef.current
        ?.querySelector(`[data-question="${firstId}"] input, [data-question="${firstId}"] textarea`)
        ?.focus()
      return
    }

    if (!isLastStep) {
      setStepIndex((index) => index + 1)
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      if (verification?.email === email) {
        setResult(await submitAnswers(answers, verification.token))
      } else {
        // Not verified yet: email a code and ask for it before saving anything.
        await sendVerificationCode(email)
        setStage('verify')
      }
    } catch (error) {
      showSubmitError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // Runs once the emailed code was accepted. Saves the answers with the proof of verification.
  const handleVerified = async (token) => {
    setVerification({ email, token })
    try {
      setResult(await submitAnswers(answers, token))
    } catch (error) {
      showSubmitError(error)
    } finally {
      // Either way, go back to the questions so "Change my answers" and error messages show there.
      setStage('questions')
    }
  }

  const handleChangeEmail = () => {
    setStage('questions')
    setStepIndex(0)
  }

  const handleBack = () => {
    setErrors({})
    setStepIndex((index) => Math.max(0, index - 1))
  }

  // Go back to the first step but keep the answers so they can be tweaked.
  const handleEdit = () => {
    setStepIndex(0)
    setResult(null)
  }

  const handleRestart = () => {
    setAnswers({ role: initialRole })
    setErrors({})
    setStepIndex(0)
    setResult(null)
  }

  if (result) {
    return answers.role === 'mentee' ? (
      <MatchResults
        answers={answers}
        menteeId={result.menteeId}
        matches={result.matches}
        onEdit={handleEdit}
        onRestart={handleRestart}
      />
    ) : (
      <ThankYou answers={answers} token={result.token} onRestart={handleRestart} />
    )
  }

  if (stage === 'verify') {
    return <VerifyEmail email={email} onVerified={handleVerified} onChangeEmail={handleChangeEmail} />
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate ref={formRef}>
      <div className="progress" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <p className="step-count">
        Step {stepIndex + 1} of {steps.length}
      </p>

      <h2 tabIndex={-1} ref={headingRef}>
        {step.title}
      </h2>

      {step.questions.map((question) => (
        <Field
          key={question.id}
          question={question}
          value={answers[question.id]}
          role={answers.role}
          error={errors[question.id]}
          onChange={handleChange}
        />
      ))}

      {submitError && (
        <p className="field-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="actions">
        {stepIndex > 0 && (
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            Back
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {isLastStep ? (submitting ? 'Submitting…' : 'Submit') : 'Next'}
        </button>
      </div>
    </form>
  )
}

export default Questionnaire
