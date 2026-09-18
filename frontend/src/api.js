// Mentees get back a ranked list of matching mentors.
// TODO: mentor answers are only logged for now. Save them once a mentor sign-up route exists.
export async function submitAnswers(answers) {
  if (answers.role !== 'mentee') {
    console.log('Mentor questionnaire submitted:', answers)
    return { matches: [] }
  }

  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
