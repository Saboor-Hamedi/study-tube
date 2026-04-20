import Activitybar from './components/Activitybar'
import VideoView from './components/VideoView'
import LibraryView from './components/vocabulary/LibraryView'
import CopilotView from './components/chat/CopilotView'
import SettingsView from './components/SettingsView'
import EditorView from './components/EditorView'
import InsightDetailView from './components/vocabulary/InsightDetailView'
import Header from './components/Header'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Notification from './components/Notification'

export default function App() {
  const [vocabStats, setVocabStats] = useState(null)
  const [savePath, setSavePath] = useState('')
  const [view, setView] = useState('search') 
  const [selectedResearchNode, setSelectedResearchNode] = useState(null)
  const [vocab, setVocab] = useState([])
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello. I am your studyTube research copilot. I can help you analyze saved words, suggest grammar rules, or create custom research cards. Ask me anything.' }
  ])
  const [sortBy, setSortBy] = useState('newest')
  const [displayLimit, setDisplayLimit] = useState(6)
  
  const [videoQuery, setVideoQuery] = useState('')
  const [videoResults, setVideoResults] = useState([])
  const [videoPreview, setVideoPreview] = useState(null)
  const [videoTranscript, setVideoTranscript] = useState(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState('dark')
  
  const [libQuery, setLibQuery] = useState('')
  const [libResults, setLibResults] = useState([])
  const [isLibSearching, setIsLibSearching] = useState(false)
  const [libHistory, setLibHistory] = useState([])
  const [isLibHistoryOpen, setIsLibHistoryOpen] = useState(false)
  const [libSelectedIndex, setLibSelectedIndex] = useState(-1)
  
  const searchInputRef = useRef(null)
  const libHistoryRef = useRef(null)
  const api = window.youtubeAPI

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const syncHistory = useCallback(async () => {
    if (!api) return
    try {
      const log = await api.getSearchLog()
      setLibHistory(log || [])
    } catch (err) {
      console.error('History Sync Failure', err)
    }
  }, [api])

  const commitToHistory = async (q) => {
    const query = q?.trim()
    if (!query) return
    try {
      await api.addSearchLog(query)
      await syncHistory()
    } catch (err) {
      console.error('Archival Persistence Error', err)
    }
  }

  const removeFromHistory = async (q) => {
    try {
      await api.deleteSearchLog(q)
      await syncHistory()
    } catch (err) {
      console.error('History Eradication Failure', err)
    }
  }

  const clearHistory = async () => {
    if (!window.confirm('Erase all search discovery logs?')) return
    try {
      await api.clearSearchLog()
      setLibHistory([])
      setIsLibHistoryOpen(false)
    } catch (err) {
      console.error('Chronology Purge Failure', err)
    }
  }

  const syncStats = useCallback(async () => {
    if (!api) return
    try {
      const stats = await api.getLibraryStats()
      setVocabStats(stats)
    } catch (err) {
      console.error('Failed to sync neural density', err)
    }
  }, [api])

  useEffect(() => {
    if (!api) return
    
    // Initial Hydration
    if (api.getTheme) api.getTheme().then(setTheme).catch(() => {})
    api.loadVocab().then(list => setVocab(list || [])).catch(() => {})
    api.loadCollections().then(list => setCollections(list || [])).catch(() => {})
    
    syncStats()
    syncHistory()

    const pulse = setInterval(syncStats, 30000)
    return () => clearInterval(pulse)
  }, [api, syncStats, syncHistory])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    api.setTheme(next)
  }

  const addVocab = async (item) => {
    const basicItem = { 
      ...item, 
      id: new Date().toISOString(),
      date: new Date().toISOString(), 
      loading: !item.skipAI 
    }
    await api.saveVocabItem(basicItem)
    syncStats()
    setVocab(prev => [basicItem, ...prev])
    showToast(`Saved "${item.text.length > 30 ? item.text.slice(0, 30) + '...' : item.text}"`)
    if (item.skipAI) return
    try {
      const entry = await api.explainWord({ text: item.text, videoTitle: item.videoTitle })
      const enriched = { ...basicItem, ...entry, loading: false }
      await api.saveVocabItem(enriched)
      syncStats()
      setVocab(prev => prev.map(v => v.id === basicItem.id ? enriched : v))
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
      <Activitybar view={view} setView={setView} onExport={handleGlobalExport} theme={theme} onToggleTheme={toggleTheme} stats={vocabStats} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          view={view} setView={setView} item={selectedResearchNode}
          videoSearch={view === 'search' ? { query: videoQuery, setQuery: setVideoQuery, preview: videoPreview, setPreview: setVideoPreview, inputRef: searchInputRef, onSearch: () => window.dispatchEvent(new CustomEvent('video-search-trigger')) } : null}
          librarySearch={(view === 'vocab' || view === 'research-detail') ? {
            query: libQuery, setQuery: setLibQuery, inputRef: searchInputRef, results: libResults,
            isHistoryOpen: isLibHistoryOpen, setIsHistoryOpen: setIsLibHistoryOpen,
            history: libHistory, historyRef: libHistoryRef, isSearching: isLibSearching,
            selectedIndex: libSelectedIndex, setSelectedIndex: setLibSelectedIndex,
            syncHistory, removeFromHistory, clearHistory,
            onSelect: (item) => { setSelectedResearchNode(item); setView('research-detail'); commitToHistory(item.text); setIsLibHistoryOpen(false); setLibSelectedIndex(-1); }
          } : null}
        />
        <main className="flex-1 relative overflow-hidden">
          {view === 'search' && (
            <div className="absolute inset-0">
              <VideoView savePath={savePath} setSavePath={setSavePath} onAddVocab={addVocab} query={videoQuery} setQuery={setVideoQuery} results={videoResults} setResults={setVideoResults} preview={videoPreview} setPreview={setVideoPreview} transcript={videoTranscript} setTranscript={setVideoTranscript} loadingTranscript={loadingTranscript} setLoadingTranscript={setLoadingTranscript} showToast={showToast} searchInputRef={searchInputRef} />
            </div>
          )}
          {view === 'vocab' && (
            <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
              <LibraryView vocab={vocab} setVocab={setVocab} collections={collections} setCollections={setCollections} selectedCollection={selectedCollection} setSelectedCollection={setSelectedCollection} sortBy={sortBy} setSortBy={setSortBy} displayLimit={displayLimit} setDisplayLimit={setDisplayLimit} api={api} showToast={showToast} syncStats={syncStats} stats={vocabStats} searchQuery={libQuery} setSearchQuery={setLibQuery} searchResults={libResults} setSearchResults={setLibResults} isSearching={isLibSearching} setIsSearching={setIsLibSearching} searchHistory={libHistory} setSearchHistory={setLibHistory} isHistoryOpen={isLibHistoryOpen} setIsHistoryOpen={setIsLibHistoryOpen} searchInputRef={searchInputRef} historyRef={libHistoryRef} onExpand={(item) => { setSelectedResearchNode(item); setView('research-detail'); }} />
            </div>
          )}
          {view === 'research-detail' && (
            <div className="absolute inset-0">
              <InsightDetailView item={selectedResearchNode} setView={setView} showToast={showToast} api={api} onUpdate={async (updated) => { await api.saveVocabItem(updated); setSelectedResearchNode(updated); syncStats(); }} />
            </div>
          )}
          {view === 'copilot' && (
            <div className="absolute inset-0">
              <CopilotView vocab={vocab} setVocab={setVocab} collections={collections} setCollections={setCollections} selectedCollection={selectedCollection} setSelectedCollection={setSelectedCollection} messages={chatHistory} setMessages={setChatHistory} setView={setView} api={api} showToast={showToast} />
            </div>
          )}
          {view === 'editor' && (
            <div className="absolute inset-0">
              <EditorView api={api} showToast={showToast} />
            </div>
          )}
          {view === 'settings' && (
            <div className="absolute inset-0">
              <SettingsView api={api} />
            </div>
          )}
        </main>
      </div>
      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
