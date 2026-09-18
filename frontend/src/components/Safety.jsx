// Plain-language privacy and safety information. It describes what the app actually does,
// so update it whenever the app's handling of data changes.
function Safety() {
  return (
    <article className="prose">
      <h1 className="page-title">Privacy and safety</h1>
      <p className="page-sub">
        MentHers is a mentoring community for women and girls. Here is how we look after you.
      </p>

      <section className="card">
        <h2>What we collect</h2>
        <p>
          Your name, email address and the answers you give in the questionnaire (career stage, interests,
          goals and, for mentors, job title, company and a short bio). We also keep the messages in intro
          requests and the requests themselves.
        </p>
      </section>

      <section className="card">
        <h2>Who sees what</h2>
        <ul>
          <li>
            <strong>Mentor profiles</strong> (name, job title, company, bio and areas of experience) are
            shown to mentees who match with them.
          </li>
          <li>
            <strong>Your name, email, goal and message</strong> are shared with a mentor only when you send
            that mentor an intro request. Other mentors never see them.
          </li>
          <li>
            <strong>A mentor’s email address</strong> is shared with a mentee only after the mentor accepts
            their request.
          </li>
          <li>We don’t sell your information.</li>
        </ul>
      </section>

      <section className="card">
        <h2>AI features</h2>
        <p>
          When AI features are turned on, we send a mentee’s career stage, interests and written goal, plus
          mentors’ job titles and bios, to Claude, an AI model from Anthropic. It is used to rank mentors,
          explain why they might be a good fit, and suggest a first draft of your intro message. Email
          addresses are never sent, and drafts only use first names. AI-written text is always labelled and
          you can edit it before anything is sent.
        </p>
      </section>

      <section className="card">
        <h2>Staying safe</h2>
        <ul>
          <li>Everyone verifies their email address with a code before joining.</li>
          <li>
            We rely on members to join in good faith. We don’t check identity documents, so use your own
            judgement with anyone you meet online.
          </li>
          <li>If you’re under 18, talk to a parent or guardian before you chat with a mentor.</li>
          <li>Keep early conversations on email or a well-known video platform.</li>
          <li>
            Never send money, passwords or financial details to anyone you meet here. A real mentor will
            never ask for them.
          </li>
          <li>You can decline any request, and you can stop talking to anyone at any time.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Report a problem</h2>
        <p>
          If someone makes you uncomfortable, or something doesn’t seem right, sign in, open your account and
          use <strong>Report a problem</strong> on that person’s request. The MentHers team receives the
          report and can remove accounts.
        </p>
        <a className="btn btn-secondary" href="#/account">
          Go to my account
        </a>
      </section>

      <section className="card">
        <h2>Your control</h2>
        <p>
          You can delete your account at any time from your account page. That permanently removes your
          profile, your requests and your data. Safety reports are kept so we can still act on them.
        </p>
      </section>
    </article>
  )
}

export default Safety
