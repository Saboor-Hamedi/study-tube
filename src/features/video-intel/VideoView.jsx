import { useEffect, useState, useMemo, useRef } from 'react'
import { Search, Loader2, Tv2, Play, X, ChevronLeft, Library, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import VideoPreviewCard from './VideoPreviewCard'
import { api as bridgeApi } from "../../utils/api-bridge";

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i
function fmtViews(n) {
  if (!n) return ''
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B views'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M views'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K views'
  return n + ' views'
}

export default function VideoView({ 
  onAddVocab, 
  query, setQuery, 
  results, setResults, 
  preview, setPreview, 
  transcript, setTranscript,
  loadingTranscript, setLoadingTranscript,
  showToast,
  searchInputRef,
  busy, setBusy,
  api: passedApi
}) {
  const api = passedApi || bridgeApi

  const [quality, setQuality] = useState('')

  const isUrl = useMemo(() => YT_REGEX.test(query.trim()), [query])

  // Trigger search from Global Header
  useEffect(() => {
    const handleTrigger = () => {
      isUrl ? loadUrl(query.trim()) : search()
    }
    window.addEventListener('video-search-trigger', handleTrigger)
    return () => window.removeEventListener('video-search-trigger', handleTrigger)
  }, [query, isUrl])

  // Tactical Keymap Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + F: Focus Matrix
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchInputRef])

  useEffect(() => {
    if (!api) return
    // api.getSavePath().then(p => { if (p) setSavePath(p) }).catch(() => {})
  }, [api])

  useEffect(() => {
    if (!api || !isUrl || !query.trim()) return
    const t = setTimeout(() => loadUrl(query.trim()), 600)
    return () => clearTimeout(t)
  }, [query, isUrl])

  async function loadUrl(url) {
    setBusy(true)
    setTranscript(null)
    setLoadingTranscript(true)
    try {
      const meta = await api.metadata(url)
      setPreview(meta)
      setResults([])
      setQuality(meta.qualityOptions?.[0]?.value || '')
      api.getTranscript(meta.id)
        .then(t => {
          setTranscript(t)
          setLoadingTranscript(false)
        })
        .catch(() => {
          setLoadingTranscript(false)
        })
    } catch (e) {
      console.error(e)
      setLoadingTranscript(false)
    } finally {
      setBusy(false)
    }
  }

  async function search(overrideQuery = null) {
    const activeQuery = (overrideQuery || query).trim()
    if (!api || !activeQuery || isUrl) return
    setBusy(true)
    try {
      const vids = await api.search(activeQuery)
      setResults(vids)
      setPreview(null)
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  function handleReset() {
    setResults([])
    setPreview(null)
    setQuery('')
  }

  async function selectResult(v) {
    const optimisticMeta = { 
      id: v.id, 
      title: v.title, 
      thumbnail: v.thumbnail, 
      author: v.author, 
      duration: v.durationSec || 0,
      qualityOptions: [] 
    }
    setPreview(optimisticMeta)
    setQuality('')
    setTranscript(null)
    setLoadingTranscript(true)
    
    try {
      const fullMeta = await api.metadata(v.url)
      
      if (!fullMeta) {
        setLoadingTranscript(false)
        showToast('Failed to retrieve video intelligence', 'error')
        return
      }

      const isGeneric = (t) => !t || t.toLowerCase() === 'youtube video'
      const finalTitle = isGeneric(fullMeta.title) ? v.title : fullMeta.title

      setPreview({
        ...fullMeta,
        title: finalTitle
      })
      setQuality(fullMeta.qualityOptions?.[0]?.value || '')
      api.getTranscript(fullMeta.id)
        .then(t => {
          setTranscript(t)
          setLoadingTranscript(false)
        })
        .catch(() => {
          setLoadingTranscript(false)
        })
    } catch (e) {
      console.error(e)
      setLoadingTranscript(false)
      showToast('Neural link failed', 'error')
    }
  }


  return (
    <div className="flex flex-col h-full bg-background overflow-hidden text-text">
      {/* Main Content Area */}
      {preview ? (
        <div className="flex-1 flex overflow-hidden">
          <VideoPreviewCard
            video={preview}
            onClose={() => setPreview(null)}
            transcript={transcript}
            loadingTranscript={loadingTranscript}
            onAddVocab={onAddVocab}
            showToast={showToast}
            quality={quality}
            onQualityChange={setQuality}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-20 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {results.length > 0 ? (
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between border-b border-border/5 pb-4">
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 text-muted hover:text-accent transition-colors group"
                  >
                    <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Discovery</span>
                  </button>
                  <div className="flex items-center gap-2 opacity-30">
                    <div className="h-1.5 w-1.5 bg-accent rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted italic">Discovery Log: {results.length} Nodes</span>
                  </div>
                </div>

                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.map((item, i) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.4 }}
                      className="flex flex-col gap-3 group cursor-pointer"
                      onClick={() => selectResult(item)}
                    >
                      <div className="relative aspect-video overflow-hidden bg-surface-2 border border-border/10 transition-all rounded-xl">
                        <img src={`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`} className="w-full h-full object-cover transition-transform duration-500" />
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[10px] font-bold text-white tracking-widest rounded-sm">{item.duration}</div>
                        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors" />
                      </div>
                      <div className="space-y-1 px-1">
                        <h3 className="text-[14px] font-bold text-text line-clamp-2 leading-snug group-hover:text-accent transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-2 text-[11px] text-muted font-bold uppercase tracking-wider opacity-60">
                           <span>{item.author}</span>
                           <span className="w-1 h-1 bg-muted/20 rounded-full" />
                           <span>Analysis Ready</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : !busy && (
              <div className="flex flex-col items-center justify-center py-40 text-center gap-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-surface-2 border border-border flex items-center justify-center shadow-2xl">
                    <Tv2 className="h-6 w-6 text-accent animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black text-text uppercase tracking-[0.4em]">Neural Discovery active</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-40">Paste a URL or select a discovery prompt below</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                  {[
                    "Luke's English Podcast",
                    "English Grammar Masterclass",
                    "How to write academic essays",
                    "IELTS Speaking Practice",
                    "BBC Learning English"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        search(suggestion);
                      }}
                      className="px-4 py-2 bg-surface-2 border border-border/10 text-[10px] font-bold text-muted uppercase tracking-widest hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all rounded-[5px]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
