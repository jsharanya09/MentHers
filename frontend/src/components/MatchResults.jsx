import { useEffect, useRef } from 'react'
import { optionLabel } from '../utils/labels'
import IntroRequest from './IntroRequest'

const initials = (name) =>
  name
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

// Turns what the mentee and mentor have in common into short, readable lines.
function buildReasons(matched) {
  const list = (id, values) => values.map((value) => optionLabel(id, value)).join(', ')
  const reasons = []

  if (matched.fields.length) reasons.push(`Shared areas: ${list('fields', matched.fields)}`)
  if (matched.skills.length) reasons.push(`Can help with: ${list('skills', matched.skills)}`)
  if (matched.approach) {
    reasons.push(`Prefers ${optionLabel('approach', matched.approach).toLowerCase()} conversations`)
  }
  if (matched.frequency) {
    reasons.push(`Meets ${optionLabel('frequency', matched.frequency).toLowerCase()}`)
  }
  return reasons
}

function MatchResults({ answers, menteeId, aiDrafting, matches, onEdit, onRestart }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const firstName = answers.name?.trim().split(' ')[0]

  return (
    <section className="results" aria-labelledby="results-heading">
      <div className="card">
        <h2 id="results-heading" tabIndex={-1} ref={headingRef}>
          {matches.length > 0
            ? `${firstName ? `${firstName}, we` : 'We'} found ${matches.length} ${
                matches.length === 1 ? 'mentor' : 'mentors'
              } for you`
            : 'No mentors match yet'}
        </h2>
        <p className="field-hint">
          {matches.length > 0
            ? 'Ranked by how well they fit your goals, interests and schedule.'
            : 'Try choosing more areas of interest or meeting formats to see more mentors.'}
        </p>
        <div className="actions actions-start">
          <button type="button" className="btn btn-secondary" onClick={onEdit}>
            Change my answers
          </button>
          <button type="button" className="btn btn-secondary" onClick={onRestart}>
            Start over
          </button>
          <a className="btn btn-secondary" href="#/account">
            My requests
          </a>
        </div>
      </div>

      <ul className="match-list">
        {matches.map(({ mentor, score, matched, requested, insight }) => (
          <li key={mentor.id} className="card match">
            <div className="match-head">
              <div className="avatar" aria-hidden="true">
                {initials(mentor.name)}
              </div>
              <div className="match-who">
                <h3>
                  {mentor.name}
                  {mentor.sample && <span className="sample-badge">Demo</span>}
                </h3>
                <p>
                  {mentor.title}, {mentor.company}
                </p>
              </div>
              <div className="score" aria-label={`${score} percent match`}>
                {score}%
                <span>match</span>
              </div>
            </div>
            {insight && (
              <p className="insight">
                <span className="insight-label">Why you two might click</span>
                {insight}
              </p>
            )}
            <p className="match-bio">{mentor.bio}</p>
            <ul className="reasons">
              {buildReasons(matched).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="match-action">
              <IntroRequest
                mentor={mentor}
                menteeId={menteeId}
                alreadyRequested={requested}
                canDraft={aiDrafting}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MatchResults
