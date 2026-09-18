import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('backend not reachable'))
  }, [])

  return (
    <main>
      <h1>MentHers</h1>
      <p>Mentor matching app</p>
      <p>Backend status: {status}</p>
    </main>
  )
}

export default App
