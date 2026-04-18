import Activitybar from './components/Activitybar'
import VideoView from './components/VideoView'
import LibraryView from './components/vocabulary/LibraryView'
import CopilotView from './components/chat/CopilotView'
import SettingsView from './components/SettingsView'
import EditorView from './components/EditorView'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Notification from './components/Notification'

export default function App() {
  const [savePath, setSavePath] = useState('')
  const [view, setView] = useState('search') // 'search' | 'vocab' | 'settings'
  const [vocab, setVocab] = useState([])
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello. I am your studyTube research copilot. I can help you analyze saved words, suggest grammar rules, or create custom research cards. Ask me anything.' }
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [displayLimit, setDisplayLimit] = useState(10)
  const [videoQuery, setVideoQuery] = useState('')
  const [videoResults, setVideoResults] = useState([])
  const [videoPreview, setVideoPreview] = useState(null)
  const [videoTranscript, setVideoTranscript] = useState(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState('dark')
  const api = window.youtubeAPI

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (api) {
      if (api.getTheme) api.getTheme().then(setTheme).catch(() => {})
      api.loadVocab().then(list => setVocab(list || [])).catch(() => {})
      api.loadCollections().then(list => setCollections(list || [])).catch(() => {})
    }
  }, [api])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    api.setTheme(next)
  }

  const addVocab = async (item) => {
    const basicItem = { ...item, date: new Date().toISOString(), loading: !item.skipAI }
    const newList = [basicItem, ...vocab]
    
    setVocab(newList)
    await api.saveVocab(newList)
    
    const displayTitle = item.text.length > 30 ? item.text.slice(0, 30) + '...' : item.text
    showToast(`Saved "${displayTitle}"`)

    if (item.skipAI) return

    try {
      const entry = await api.explainWord({ text: item.text, videoTitle: item.videoTitle })
      setVocab(prev => {
        const enrichedList = prev.map(v => v.text === item.text && v.loading ? { ...v, ...entry, loading: false } : v)
        api.saveVocab(enrichedList) // AI enrichment is a secondary async task, this is safer here but ideally we'd sequence it too
        return enrichedList
      })
    } catch (e) {
      console.error('AI Enrichment failed', e)
    }
  }

  const handleGlobalExport = async () => {
    if (vocab.length === 0) return
    try {
      const result = await api.exportDossier({ name: 'Full_Research_Archive', items: vocab })
      if (result.success) {
        showToast(`Full Dossier Exported: ${result.filePath.split(/[\\\/]/).pop()}`, 'success')
      }
    } catch (err) {
      showToast('Global Export Protocol Failed', 'error')
    }
  }

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans transition-colors duration-500">
      <Activitybar view={view} setView={setView} onExport={handleGlobalExport} theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="flex-1 relative overflow-hidden">
        {view === 'search' && (
          <div className="absolute inset-0">
            <VideoView 
              savePath={savePath} setSavePath={setSavePath} onAddVocab={addVocab}
              query={videoQuery} setQuery={setVideoQuery}
              results={videoResults} setResults={setVideoResults}
              preview={videoPreview} setPreview={setVideoPreview}
              transcript={videoTranscript} setTranscript={setVideoTranscript}
              loadingTranscript={loadingTranscript} setLoadingTranscript={setLoadingTranscript}
              showToast={showToast}
            />
          </div>
        )}

        {view === 'vocab' && (
          <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
            <LibraryView 
              vocab={vocab} setVocab={setVocab}
              collections={collections} setCollections={setCollections}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              sortBy={sortBy} setSortBy={setSortBy}
              displayLimit={displayLimit} setDisplayLimit={setDisplayLimit}
              api={api}
              showToast={showToast}
            />
          </div>
        )}

        {view === 'copilot' && (
          <div className="absolute inset-0">
            <CopilotView 
              vocab={vocab}
              setVocab={setVocab}
              collections={collections}
              setCollections={setCollections}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              messages={chatHistory}
              setMessages={setChatHistory}
              setView={setView}
              api={api}
              showToast={showToast}
            />
          </div>
        )}
      {/* open editor */}
        {view === 'editor' && (
          <div className="absolute inset-0">
            <EditorView api={api} showToast={showToast} />
          </div>
        )}
      {/* open setting  */}
        {view === 'settings' && (
          <div className="absolute inset-0">
            <SettingsView api={api} />
          </div>
        )}
      </main>

      <Notification 
        toast={toast} 
        onClose={() => setToast(null)} 
      />
    </div>
  )
}
