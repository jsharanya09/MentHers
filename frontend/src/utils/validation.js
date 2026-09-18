const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Picks the right wording when a label/hint/placeholder differs by role.
export function resolveText(value, role) {
  if (value && typeof value === 'object') return value[role] ?? Object.values(value)[0]
  return value
}

export function isEmpty(value) {
  if (Array.isArray(value)) return value.length === 0
  return value === undefined || value === null || String(value).trim() === ''
}

// Returns { [questionId]: 'error message' } for every invalid question in the step.
export function validateStep(step, answers) {
  const errors = {}

  for (const question of step.questions) {
    const value = answers[question.id]

    if (question.required && isEmpty(value)) {
      errors[question.id] =
        question.type === 'single' || question.type === 'multi'
          ? 'Please choose an option.'
          : 'This field is required.'
      continue
    }

    if (question.type === 'email' && !isEmpty(value) && !EMAIL_PATTERN.test(value.trim())) {
      errors[question.id] = 'Please enter a valid email address.'
    }
  }

  return errors
}
