import Questionnaire from './components/Questionnaire'

function App() {
  return (
    <>
      <header className="site-header">
        <h1>MentHers</h1>
        <p>Answer a few questions and we’ll help you find your match.</p>
      </header>
      <main>
        <Questionnaire />
      </main>
    </>
  )
}

export default App
