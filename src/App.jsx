import Activitybar from './components/Activitybar'
import VideoView from './components/VideoView'
import LibraryView from './components/vocabulary/LibraryView'
import { useState, useEffect } from 'react'

export default function App() {
  const [savePath, setSavePath] = useState('')
  const [view, setView] = useState('search') // 'search' | 'vocab' | 'settings'
  const [vocab, setVocab] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'az'
  const [displayLimit, setDisplayLimit] = useState(10)
  const api = window.youtubeAPI

  useEffect(() => {
    if (api) api.loadVocab().then(list => setVocab(list || [])).catch(() => {})
  }, [api])

  const addVocab = async (item) => {
    const basicItem = { ...item, date: new Date().toISOString(), loading: !item.skipAI }
    setVocab(prev => {
      const newList = [basicItem, ...prev]
      api.saveVocab(newList)
      return newList
    })

    if (item.skipAI) return

    try {
      const entry = await api.explainWord({ text: item.text, videoTitle: item.videoTitle })
      setVocab(prev => {
        const newList = prev.map(v => v.text === item.text && v.loading ? { ...v, ...entry, loading: false } : v)
        api.saveVocab(newList)
        return newList
      })
    } catch (e) {
      console.error('AI Enrichment failed', e)
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-[#e2e2e2] overflow-hidden font-sans">
      <Activitybar view={view} setView={setView} />
      
      <main className="flex-1 relative overflow-hidden">
        {view === 'search' && (
          <div className="absolute inset-0">
            <VideoView savePath={savePath} setSavePath={setSavePath} onAddVocab={addVocab} />
          </div>
        )}

        {view === 'vocab' && (
          <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
            <LibraryView 
              vocab={vocab} setVocab={setVocab}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              sortBy={sortBy} setSortBy={setSortBy}
              displayLimit={displayLimit} setDisplayLimit={setDisplayLimit}
              api={api}
            />
          </div>
        )}

        {view === 'settings' && (
          <div className="absolute inset-0 overflow-y-auto scrollbar-thin p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-4 text-white">Settings</h1>
            <p className="text-muted">Configuration coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}
