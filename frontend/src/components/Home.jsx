const HOW_IT_WORKS = [
  {
    title: 'Tell us about you',
    text: 'Answer a few quick questions about your goals, interests and schedule.',
  },
  {
    title: 'Get matched',
    text: 'We rank mentors by how well they fit what you need, and show you why.',
  },
  {
    title: 'Choose your mentor',
    text: 'Look through your matches and pick the person who feels like the right fit.',
  },
]

function Home() {
  return (
    <>
      <section className="hero">
        <h1>Find the mentor who’s been where you want to go.</h1>
        <p className="hero-sub">
          MentHers matches you with mentors based on your goals, your interests and how you like to
          work.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#/find">
            Find a mentor
          </a>
          <a className="btn btn-secondary" href="#/mentor">
            Become a mentor
          </a>
        </div>
      </section>

      <section className="how" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <ol className="how-list">
          {HOW_IT_WORKS.map((item, index) => (
            <li key={item.title} className="card how-step">
              <span className="how-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="cta card">
        <h2>Ready to get started?</h2>
        <p>It takes about two minutes.</p>
        <a className="btn btn-primary" href="#/find">
          Find a mentor
        </a>
      </section>
    </>
  )
}

export default Home
