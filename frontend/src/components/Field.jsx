import { resolveText } from '../utils/validation'

// Renders one question. Choice questions use a fieldset/legend so screen readers
// announce the question with its options; text inputs use a regular label.
function Field({ question, value, role, error, onChange }) {
  const label = resolveText(question.label, role)
  const hint = resolveText(question.hint, role)
  const placeholder = resolveText(question.placeholder, role)
  const hintId = hint ? `${question.id}-hint` : undefined
  const errorId = error ? `${question.id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const meta = (
    <>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </>
  )

  const requiredMark = question.required ? <span className="required" aria-hidden="true"> *</span> : null

  if (question.type === 'single') {
    return (
      <fieldset className="field" aria-describedby={describedBy} data-question={question.id}>
        <legend>
          {label}
          {requiredMark}
        </legend>
        {meta}
        <div className="options">
          {question.options.map((option) => (
            <label
              key={option.value}
              className={`option ${value === option.value ? 'is-selected' : ''}`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(question.id, option.value)}
              />
              <span className="option-label">{option.label}</span>
              {option.description && <span className="option-desc">{option.description}</span>}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (question.type === 'multi') {
    const selected = value ?? []
    const limitReached = question.max !== undefined && selected.length >= question.max

    const toggle = (optionValue) => {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue]
      onChange(question.id, next)
    }

    return (
      <fieldset className="field" aria-describedby={describedBy} data-question={question.id}>
        <legend>
          {label}
          {requiredMark}
        </legend>
        {meta}
        <div className="options options-compact">
          {question.options.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <label
                key={option.value}
                className={`option ${checked ? 'is-selected' : ''} ${
                  limitReached && !checked ? 'is-disabled' : ''
                }`}
              >
                <input
                  type="checkbox"
                  name={question.id}
                  value={option.value}
                  checked={checked}
                  disabled={limitReached && !checked}
                  onChange={() => toggle(option.value)}
                />
                <span className="option-label">{option.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  const inputProps = {
    id: question.id,
    name: question.id,
    value: value ?? '',
    placeholder,
    required: question.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    onChange: (event) => onChange(question.id, event.target.value),
  }

  return (
    <div className="field" data-question={question.id}>
      <label htmlFor={question.id}>
        {label}
        {requiredMark}
      </label>
      {meta}
      {question.type === 'textarea' ? (
        <>
          <textarea {...inputProps} rows={5} maxLength={question.maxLength} />
          {question.maxLength && (
            <p className="char-count" aria-hidden="true">
              {(value ?? '').length}/{question.maxLength}
            </p>
          )}
        </>
      ) : (
        <input
          {...inputProps}
          type={question.type === 'email' ? 'email' : 'text'}
          maxLength={question.maxLength}
          autoComplete={question.autoComplete}
        />
      )}
    </div>
  )
}

export default Field
