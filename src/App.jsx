import Activitybar from './components/Activitybar'
import VideoView from './components/VideoView'
import LibraryView from './components/vocabulary/LibraryView'
import SettingsView from './components/SettingsView'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function App() {
  const [savePath, setSavePath] = useState('')
  const [view, setView] = useState('search') // 'search' | 'vocab' | 'settings'
  const [vocab, setVocab] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [displayLimit, setDisplayLimit] = useState(10)
  const [videoQuery, setVideoQuery] = useState('')
  const [videoResults, setVideoResults] = useState([])
  const [videoPreview, setVideoPreview] = useState(null)
  const [videoTranscript, setVideoTranscript] = useState(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [toast, setToast] = useState(null)
  const api = window.youtubeAPI

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (api) api.loadVocab().then(list => setVocab(list || [])).catch(() => {})
  }, [api])

  const addVocab = async (item) => {
    const basicItem = { ...item, date: new Date().toISOString(), loading: !item.skipAI }
    setVocab(prev => {
      const newList = [basicItem, ...prev]
      api.saveVocab(newList)
      showToast(`Saved "${item.text}"`)
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
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              sortBy={sortBy} setSortBy={setSortBy}
              displayLimit={displayLimit} setDisplayLimit={setDisplayLimit}
              api={api}
              showToast={showToast}
            />
          </div>
        )}

        {view === 'settings' && <SettingsView api={api} />}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[1000] px-6 py-3 bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            <span className="text-xs font-bold uppercase tracking-widest text-white">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/5 rounded">
              <X className="h-3 w-3 text-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
