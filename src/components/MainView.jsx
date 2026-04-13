import { useEffect, useState, useMemo } from 'react'
import { Search, Link2, Loader2, AlertCircle, CheckCircle, Tv2, ArrowRight, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import VideoPreviewCard from './VideoPreviewCard'

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i
function fmtViews(n) {
  if (!n) return ''
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B views'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M views'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K views'
  return n + ' views'
}

export default function MainView({ savePath, setSavePath, onAddVocab }) {
  const api = window.youtubeAPI
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState([])
  const [preview, setPreview] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [quality, setQuality] = useState('')
  const [progress, setProgress] = useState({})
  const [taskId, setTaskId] = useState(null)
  const [lastFile, setLastFile] = useState(null)

  const isUrl = useMemo(() => YT_REGEX.test(query.trim()), [query])
  const isDownloading = taskId ? (progress[taskId]?.percent ?? 0) < 100 : false

  // Load save path once
  useEffect(() => {
    if (!api) return
    api.getSavePath().then(p => { if (p) setSavePath(p) }).catch(() => {})
    const unP = api.onProgress(d => setProgress(p => ({ ...p, [d.taskId]: d })))
    const unD = api.onDone(d => {
      setProgress(p => ({ ...p, [d.taskId]: { percent: 100 } }))
      setTaskId(null)
      setLastFile(d.filePath)
    })
    return () => { unP(); unD() }
  }, [api])

  // Auto-fetch when URL is pasted
  useEffect(() => {
    if (!api || !isUrl || !query.trim()) return
    const t = setTimeout(() => loadUrl(query.trim()), 600)
    return () => clearTimeout(t)
  }, [query, isUrl])

  async function loadUrl(url) {
    setBusy(true)
    setTranscript(null)
    try {
      const meta = await api.metadata(url)
      setPreview(meta)
      setResults([])
      setQuality(meta.qualityOptions?.[0]?.value || '')
      
      // Fetch transcript in background
      api.getTranscript(meta.id).then(t => setTranscript(t)).catch(() => {})
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  async function search() {
    if (!api || !query.trim() || isUrl) return
    setBusy(true)
    try {
      const vids = await api.search(query.trim())
      setResults(vids)
      setPreview(null)
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  function onEnter(e) { if (e.key === 'Enter') isUrl ? loadUrl(query.trim()) : search() }

  async function pickPath() {
    if (!api) return
    const p = await api.pickSavePath()
    if (p) { setSavePath(p) }
  }

  async function download() {
    if (!api || !preview || !quality) return
    let dest = savePath
    if (!dest) {
      const p = await api.pickSavePath()
      if (!p) return
      setSavePath(p); dest = p
    }
    const id = crypto.randomUUID()
    setTaskId(id)
    try {
      await api.startDownload({ taskId: id, url: preview.url, format: quality, savePath: dest, title: preview.title })
    } catch (e) {
      setTaskId(null)
      console.error(e)
    }
  }

  async function cancelDownload() {
    if (!api || !taskId) return
    await api.cancelDownload(taskId)
    setTaskId(null)
    setProgress({})
  }

  async function selectResult(v) {
    await loadUrl(v.url)
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* YouTube Style Top Header */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-border py-2 mb-6">
        <div className="flex items-center justify-between px-4 gap-4">
          
          {/* Brand - Left */}
          <div className="flex items-center gap-4 shrink-0 min-w-[160px]">
            <div className="flex items-center gap-1.5 cursor-default">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <Tv2 className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tighter">StudyTube</h2>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-[720px] flex items-center gap-4">
            <div className="flex-1 flex items-stretch h-10 border border-border rounded-full bg-black/40 overflow-hidden focus-within:border-blue-500/50 transition-all">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onEnter}
                placeholder="Search"
                className="flex-1 bg-transparent text-base text-white placeholder:text-muted outline-none px-5 py-1"
                spellCheck={false}
              />
              {query && (
                <button 
                  onClick={() => { setQuery(''); setPreview(null); setResults([]) }}
                  className="text-muted hover:text-white px-3 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => isUrl ? loadUrl(query.trim()) : search()}
                disabled={busy || !query.trim()}
                className="flex items-center justify-center px-5 bg-white/5 border-l border-border hover:bg-white/10 transition disabled:opacity-40"
              >
                <Search className="h-[18px] w-[18px] text-white" />
              </button>
            </div>
          </div>

          {/* User Icons - Right */}
          <div className="flex items-center justify-end gap-3 min-w-[160px]">
             <div className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer hidden md:flex">
               <Plus className="h-5 w-5 text-white" />
             </div>
             <div className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer relative">
               <div className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full border-2 border-[#0f0f0f]" />
               <Search className="h-5 w-5 text-white" /> {/* Dummy notification icon placeholder */}
             </div>
             <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white cursor-pointer ml-1">
               S
             </div>
          </div>
        </div>
      </header>




      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-10 scrollbar-thin">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Preview card */}
            {preview && (
              <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <VideoPreviewCard
                  video={preview}
                  transcript={transcript}
                  onAddVocab={onAddVocab}
                  quality={quality}
                  onQualityChange={setQuality}
                  savePath={savePath}
                  onPickPath={pickPath}
                  onDownload={download}
                  onCancel={cancelDownload}
                  progress={taskId ? progress[taskId] : null}
                  downloading={isDownloading}
                  lastFile={lastFile}
                />
              </motion.div>
            )}

            {/* Search results */}
            {!preview && results.length > 0 && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-col gap-3 group cursor-pointer"
                    onClick={() => selectResult(item)}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-2 border border-border/40 transition-all duration-300 group-hover:rounded-none">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&auto=format&fit=crop' }}
                      />
                      {item.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium font-mono">
                          {item.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 px-1">
                      {/* Dummy Avatar */}
                      <div className="h-9 w-9 shrink-0 rounded-full bg-surface-3 flex items-center justify-center text-[10px] text-muted border border-border">
                        {item.author[0]}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                          {item.title}
                        </p>
                        <div className="text-[12px] text-muted -space-y-0.5">
                          <p className="hover:text-white transition-colors">{item.author}</p>
                          <p>{fmtViews(item.views)} · {item.ago}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Empty state */}
            {!preview && !results.length && !busy && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
                  <Tv2 className="h-8 w-8 text-muted" />
                </div>
                <div>
                  <p className="font-medium text-white">No video loaded</p>
                  <p className="text-sm text-muted mt-1">Paste a YouTube link or search above to get started.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
