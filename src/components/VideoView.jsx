import { useEffect, useState, useMemo } from 'react'
import { Search, Loader2, Tv2, Play, X, ChevronLeft } from 'lucide-react'
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

export default function VideoView({ 
  savePath, setSavePath, onAddVocab, 
  query, setQuery, 
  results, setResults, 
  preview, setPreview, 
  transcript, setTranscript,
  loadingTranscript, setLoadingTranscript,
  showToast
}) {
  const api = window.youtubeAPI
  const [busy, setBusy] = useState(false)
  const [quality, setQuality] = useState('')
  const [progress, setProgress] = useState({})
  const [taskId, setTaskId] = useState(null)
  const [lastFile, setLastFile] = useState(null)

  const isUrl = useMemo(() => YT_REGEX.test(query.trim()), [query])
  const isDownloading = taskId ? (progress[taskId]?.percent ?? 0) < 100 : false

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
    
    try {
      const fullMeta = await api.metadata(v.url)
      
      // Strict title selection: prioritise fullMeta if it's substantial, 
      // otherwise stick with search result title (v.title)
      const isGeneric = (t) => !t || t.toLowerCase() === 'youtube video'
      const finalTitle = isGeneric(fullMeta.title) ? v.title : fullMeta.title

      setPreview({
        ...fullMeta,
        title: finalTitle
      })
      setQuality(fullMeta.qualityOptions?.[0]?.value || '')
      api.getTranscript(fullMeta.id).then(t => setTranscript(t)).catch(() => {})
    } catch (e) {
      console.error(e)
    }
  }

  // Handle exiting preview and doing the search
  function doExternalSearch(e) {
    const val = e.target.value;
    setQuery(val);
  }

  const videoViewSubtext = preview ? `Analyzing Content...` : (busy ? 'Scanning YouTube...' : 'Ready for deep search')


  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Universal Standardized Header (Always Visible) */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => preview && setPreview(null)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${preview ? 'bg-accent/10 text-accent hover:bg-accent hover:text-white' : (busy ? 'bg-accent/20 text-accent animate-pulse' : 'bg-white/5 text-muted')}`}
          >
            {preview ? <ChevronLeft className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{preview ? 'Video Analysis' : 'Research Discovery'}</h2>
            <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
              {preview ? videoViewSubtext : (busy ? 'Scanning YouTube...' : 'Ready for deep search')}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-xl px-8">
          <div className="relative group">
            <input 
              type="text"
              value={query}
              onChange={doExternalSearch}
              onKeyDown={onEnter}
              placeholder={preview ? "Search for another video..." : "Paste URL or keyword to begin discovery..."}
              className="w-full bg-white/5 border border-white/5 rounded-full py-2.5 pl-6 pr-12 text-[13px] text-white outline-none focus:border-accent/40 focus:bg-white/[0.07] transition-all lowercase"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
               {busy ? <Loader2 className="h-4 w-4 text-accent animate-spin" /> : <Search className="h-4 w-4 text-muted group-focus-within:text-accent" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setPreview(null)} 
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${!preview ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white'}`}
            >
              Discovery
            </button>
            <button 
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${preview ? 'bg-white/10 text-white shadow-lg' : 'text-muted/10 cursor-not-allowed'}`}
            >
              Analysis
            </button>
          </div>
        </div>
      </div>

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
            savePath={savePath}
            onPickPath={pickPath}
            onDownload={download}
            onCancel={cancelDownload}
            progress={taskId ? progress[taskId] : null}
            downloading={isDownloading}
            lastFile={lastFile}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-20 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {results.length > 0 ? (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="flex flex-col gap-3 group cursor-pointer"
                    onClick={() => selectResult(item)}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/5 transition-all group-hover:border-accent/40">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                      {item.duration && <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{item.duration}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200 line-clamp-2 leading-tight group-hover:text-accent transition-colors">{item.title}</p>
                      <p className="text-xs text-muted mt-1">{item.author}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : !busy && (
              <div className="flex flex-col items-center justify-center py-40 text-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted/30" />
                </div>
                <p className="text-sm text-muted/50 max-w-sm">Search for a video or paste a URL to begin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
