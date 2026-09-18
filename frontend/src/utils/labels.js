import { STEPS } from '../data/questions'

// Look up the readable label for a stored answer, e.g. ('fields', 'data-ai') -> 'Data & AI'
const labels = {}
for (const step of STEPS) {
  for (const question of step.questions) {
    for (const option of question.options ?? []) {
      labels[`${question.id}:${option.value}`] = option.label
    }
  }
}

export function optionLabel(questionId, value) {
  return labels[`${questionId}:${value}`] ?? value
}
