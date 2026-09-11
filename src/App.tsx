import { useEffect, useState } from 'react'
import { TabBar } from './components/TabBar'
import { initializeDatabase } from './data'
import { CalendarPage } from './pages/CalendarPage'
import { EntryPage } from './pages/EntryPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { useRoute } from './router'

function App() {
  const route = useRoute()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDatabase()
      .then(() => setReady(true))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  if (error) {
    return (
      <main className="page">
        <p role="alert">データベースを開けませんでした: {error}</p>
      </main>
    )
  }
  if (!ready) return <main className="page" />

  let page
  switch (route.name) {
    case 'home':
      page = <HomePage yearMonth={route.yearMonth} />
      break
    case 'entryNew':
      page = <EntryPage key="new" initialDate={route.date} />
      break
    case 'entryEdit':
      page = <EntryPage key={route.id} entryId={route.id} />
      break
    case 'calendar':
      page = <CalendarPage yearMonth={route.yearMonth} date={route.date} />
      break
    case 'settings':
      page = <SettingsPage />
      break
  }

  return (
    <>
      <main className="page">{page}</main>
      <TabBar current={route.name} />
    </>
  )
}

export default App
