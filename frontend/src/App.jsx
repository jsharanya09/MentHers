import { useEffect, useState } from 'react'
import Home from './components/Home'
import Questionnaire from './components/Questionnaire'

// Tiny hash router: '#/find' and '#/mentor' open the questionnaire, anything else is the home page.
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

const PAGES = {
  '#/find': { role: 'mentee', title: 'Find your mentor' },
  '#/mentor': { role: 'mentor', title: 'Become a mentor' },
}

function App() {
  const hash = useHash()
  const page = PAGES[hash]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [hash])

  return (
    <>
      <header className="site-header container">
        <a className="brand" href="#/">
          MentHers
        </a>
      </header>
      <main className="container">
        {page ? (
          <div className="narrow">
            <h1 className="page-title">{page.title}</h1>
            <p className="page-sub">Answer a few questions and we’ll help you find your match.</p>
            <Questionnaire key={page.role} initialRole={page.role} />
          </div>
        ) : (
          <Home />
        )}
      </main>
    </>
  )
}

export default App
