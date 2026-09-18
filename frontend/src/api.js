// TODO: replace with a POST to /api/questionnaire once the backend route exists.
// For now the answers are only logged so the UI can be built and tested on its own.
export async function submitAnswers(answers) {
  console.log('Questionnaire submitted:', answers)
  return { ok: true }
}
