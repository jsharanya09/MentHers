import { useEffect, useRef, useState } from 'react'
import { STEPS } from '../data/questions'
import { validateStep } from '../utils/validation'
import { submitAnswers } from '../api'
import Field from './Field'
import MatchResults from './MatchResults'
import ThankYou from './ThankYou'

function Questionnaire() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const headingRef = useRef(null)
  const formRef = useRef(null)

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100)

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
      setResult(await submitAnswers(answers))
    } catch {
      setSubmitError('Something went wrong sending your answers. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
    setAnswers({})
    setErrors({})
    setStepIndex(0)
    setResult(null)
  }

  if (result) {
    return answers.role === 'mentee' ? (
      <MatchResults
        answers={answers}
        matches={result.matches}
        onEdit={handleEdit}
        onRestart={handleRestart}
      />
    ) : (
      <ThankYou answers={answers} onRestart={handleRestart} />
    )
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate ref={formRef}>
      <div className="progress" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <p className="step-count">
        Step {stepIndex + 1} of {STEPS.length}
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
