import { useCallback, useEffect, useState } from 'react'
import { fetchMe } from './api'
import Dashboard from './components/Dashboard'
import Home from './components/Home'
import Questionnaire from './components/Questionnaire'
import Safety from './components/Safety'
import SignIn from './components/SignIn'

// Tiny hash router: '#/find', '#/account' and so on pick the page, and anything else is the home page.
// Using the hash keeps the browser back button working without adding a routing library.
function useHash() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return hash
}

// Who is signed in, according to the backend's session cookie.
function useSession() {
  const [state, setState] = useState({ loading: true, user: null })

  const refresh = useCallback(async () => {
    try {
      setState({ loading: false, user: await fetchMe() })
    } catch {
      setState({ loading: false, user: null })
    }
  }, [])

  const clear = useCallback(() => setState({ loading: false, user: null }), [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh, clear }
}

const QUESTIONNAIRES = {
  '#/find': { role: 'mentee', title: 'Find your mentor' },
  '#/mentor': { role: 'mentor', title: 'Become a mentor' },
}

function App() {
  const hash = useHash()
  const session = useSession()
  const questionnaire = QUESTIONNAIRES[hash]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [hash])

  const goToAccount = async () => {
    await session.refresh()
    window.location.hash = '#/account'
  }

  const handleSignedOut = () => {
    session.clear()
    window.location.hash = '#/'
  }

  let page
  if (questionnaire) {
    page = (
      <div className="narrow">
        <h1 className="page-title">{questionnaire.title}</h1>
        <p className="page-sub">
          MentHers is a mentoring community for women and girls. Answer a few questions and we’ll help you
          find your match.
        </p>
        <Questionnaire
          key={questionnaire.role}
          initialRole={questionnaire.role}
          onSignedIn={session.refresh}
        />
      </div>
    )
  } else if (hash === '#/account' || hash === '#/signin') {
    page = (
      <div className="narrow">
        {session.loading ? (
          <p className="page-sub">Loading…</p>
        ) : session.user ? (
          <Dashboard user={session.user} onSignedOut={handleSignedOut} />
        ) : (
          <SignIn onSignedIn={goToAccount} />
        )}
      </div>
    )
  } else if (hash === '#/safety') {
    page = (
      <div className="narrow">
        <Safety />
      </div>
    )
  } else {
    page = <Home />
  }

  return (
    <>
      <header className="site-header container">
        <a className="brand" href="#/">
          MentHers
        </a>
        {!session.loading && (
          <nav aria-label="Account">
            {session.user ? (
              <a href="#/account">My account</a>
            ) : (
              <a href="#/signin">Sign in</a>
            )}
          </nav>
        )}
      </header>
      <main className="container">{page}</main>
      <footer className="site-footer container">
        <a href="#/safety">Privacy and safety</a>
      </footer>
    </>
  )
}

export default App
