import Activitybar from './components/Activitybar'
import VideoView from './features/video-intel/VideoView'
import LibraryView from './features/research-vault/LibraryView'
import CopilotView from './features/neural-chat/CopilotView'
import SettingsView from './features/settings/SettingsView'
import EditorView from './features/editor/EditorView'
import InsightDetailView from './features/research-vault/InsightDetailView'
import Header from './components/Header'
import InsightCaptureModal from './features/research-vault/InsightCaptureModal'
import GlobalNeuralMenu from './features/neural-chat/GlobalNeuralMenu'
import { motion, AnimatePresence } from 'framer-motion'
import Notification from './components/Notification'
import { useStore } from './store/useStore'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function App() {
  const {
    vocabStats, setVocabStats,
    savePath, setSavePath,
    view, setView,
    selectedResearchNode, setSelectedResearchNode,
    vocab, setVocab,
    collections, setCollections,
    selectedCollection, setSelectedCollection,
    chatHistory, setChatHistory,
    sortBy, setSortBy,
    displayLimit, setDisplayLimit,
    isCopilotOpen, setIsCopilotOpen,
    isCaptureOpen, setIsCaptureOpen,
    copilotContext, setCopilotContext,
    videoQuery, setVideoQuery,
    videoResults, setVideoResults,
    videoPreview, setVideoPreview,
    videoTranscript, setVideoTranscript,
    loadingTranscript, setLoadingTranscript,
    toast, setToast,
    theme, setTheme,
    libQuery, setLibQuery,
    libResults, setLibResults,
    isLibSearching, setIsLibSearching,
    libHistory, setLibHistory,
    isLibHistoryOpen, setIsLibHistoryOpen,
    libSelectedIndex, setLibSelectedIndex,
    showToast
  } = useStore()
  
  const searchInputRef = useRef(null)
  const libHistoryRef = useRef(null)
  const api = window.youtubeAPI

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
      date: item.date || new Date().toISOString(), 
      loading: !item.skipAI && !item.definition 
    }
    
    // Initial Save Bridge
    await api.saveVocabItem(basicItem)
    syncStats()
    setVocab(prev => [basicItem, ...prev])
    showToast(`Saved "${item.text.length > 30 ? item.text.slice(0, 30) + '...' : item.text}"`)
    
    // If we have a manual definition or skipAI is locked, we exit early
    if (item.skipAI || item.definition) return

    // Background Neural Enrichment
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

  const videoProps = {
    savePath, setSavePath, 
    onAddVocab: addVocab, 
    query: videoQuery, setQuery: setVideoQuery, 
    results: videoResults, setResults: setVideoResults, 
    preview: videoPreview, setPreview: setVideoPreview, 
    transcript: videoTranscript, setTranscript: setVideoTranscript, 
    loadingTranscript, setLoadingTranscript, 
    showToast, searchInputRef 
  }

  const libraryProps = {
    vocab, setVocab, 
    collections, setCollections, 
    selectedCollection, setSelectedCollection, 
    sortBy, setSortBy, 
    displayLimit, setDisplayLimit, 
    api, showToast, syncStats, stats: vocabStats, 
    searchQuery: libQuery, setSearchQuery: setLibQuery, 
    searchResults: libResults, setSearchResults: setLibResults, 
    isSearching: isLibSearching, setIsSearching: setIsLibSearching, 
    searchHistory: libHistory, setSearchHistory: setLibHistory, 
    isHistoryOpen: isLibHistoryOpen, setIsHistoryOpen: setIsLibHistoryOpen, 
    searchInputRef, historyRef: libHistoryRef, 
    onExpand: (item) => { setSelectedResearchNode(item); setView('research-detail'); }
  }

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans transition-colors duration-500 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex w-full h-full">
        <Activitybar view={view} setView={setView} onExport={handleGlobalExport} theme={theme} onToggleTheme={toggleTheme} stats={vocabStats} />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header 
            view={view} setView={setView} item={selectedResearchNode}
            videoSearch={view === 'search' ? { ...videoProps, onSearch: () => window.dispatchEvent(new CustomEvent('video-search-trigger')) } : null}
            librarySearch={(view === 'vocab' || view === 'research-detail') ? {
              ...libraryProps,
              query: libQuery,
              setQuery: setLibQuery,
              history: libHistory,
              results: libResults,
              isSearching: isLibSearching,
              onSelect: (item) => { setSelectedResearchNode(item); setView('research-detail'); commitToHistory(item.text); setIsLibHistoryOpen(false); setLibSelectedIndex(-1); },
              syncHistory, removeFromHistory, clearHistory,
              selectedIndex: libSelectedIndex, setSelectedIndex: setLibSelectedIndex
            } : null}
          />
          
          <main className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {view === 'search' && (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <VideoView {...videoProps} />
                </motion.div>
              )}
              {view === 'vocab' && (
                <motion.div key="vocab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto scrollbar-thin">
                  <LibraryView {...libraryProps} />
                </motion.div>
              )}
              {view === 'research-detail' && (
                <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <InsightDetailView 
                    item={selectedResearchNode} 
                    setView={setView} 
                    showToast={showToast} 
                    api={api} 
                    onOpenCopilot={(ctx) => { setCopilotContext(ctx); setIsCopilotOpen(true); }}
                    collections={collections}
                    selectedCollection={selectedCollection}
                    setSelectedCollection={setSelectedCollection}
                    onUpdate={async (updated) => { await api.saveVocabItem(updated); setSelectedResearchNode(updated); syncStats(); }} 
                  />
                </motion.div>
              )}
              {view === 'editor' && (
                <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <EditorView api={api} showToast={showToast} />
                </motion.div>
              )}
              {view === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <SettingsView api={api} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <CopilotView 
        isOpen={isCopilotOpen} 
        onClose={() => { setIsCopilotOpen(false); setCopilotContext(null); }}
        vocab={vocab} setVocab={setVocab}
        collections={collections} setCollections={setCollections}
        selectedCollection={selectedCollection}
        setSelectedCollection={setSelectedCollection}
        messages={chatHistory} setMessages={setChatHistory}
        contextItem={copilotContext}
        api={api} showToast={showToast}
      />

      <InsightCaptureModal 
        isOpen={isCaptureOpen} 
        onClose={() => setIsCaptureOpen(false)}
        onInsert={addVocab}
        showToast={showToast}
        api={api}
      />

      {view !== 'settings' && (
        <GlobalNeuralMenu 
          onOpenCapture={() => setIsCaptureOpen(true)}
          onOpenCopilot={() => { setCopilotContext(null); setIsCopilotOpen(true); }}
          stats={vocabStats}
          isShifted={isCopilotOpen || isCaptureOpen}
        />
      )}

      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
