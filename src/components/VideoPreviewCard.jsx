import { useState, useRef, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, X,
  Download, FolderOpen, ChevronDown, CheckCircle, ChevronLeft,
  Clock, Eye, User, ExternalLink, Loader2, AlertCircle, StopCircle,
  Plus, BookOpen, Sparkles, MessageCircle, Languages, Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function fmtTime(sec) {
  const s = Math.floor(Number(sec) || 0)
  const m = Math.floor(s / 60)
  const ss = (s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

// ─── Inline Video Player ──────────────────────────────────────────────────────
// ─── Word Explorer Modal ─────────────────────────────────────────────────────
function WordExplorerModal({ text, videoTitle, onClose, onAddVocab, cache }) {
  const api = window.youtubeAPI
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)
  
  useEffect(() => {
    if (text) {
      if (cache?.has(text)) {
        setEntry(cache.get(text))
        setLoading(false)
        return
      }
      setLoading(true)
      api.explainWord({ text, videoTitle }).then(res => {
        setEntry(res)
        setLoading(false)
      })
    }
  }, [text])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 transition-all"
      onMouseUp={e => e.stopPropagation()}
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl h-[650px] bg-gradient-to-b from-[#141414] to-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col"
      >
        
        <button onClick={onClose} className="absolute top-8 right-8 text-muted hover:text-white transition-all z-20 bg-white/5 p-2 rounded-full border border-white/5">
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scroll p-12 space-y-10">
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
               <span className="text-accent font-black text-[10px] uppercase tracking-[0.4em]">Language Lab</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-none tracking-tighter">"{text}"</h2>
          </div>

          {loading ? (
            <div className="space-y-10">
              <div className="flex gap-3">
                <div className="h-6 w-20 bg-white/5 rounded-full" />
                <div className="h-6 w-24 bg-white/5 rounded-full" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-white/5 rounded-full" />
                <div className="h-4 w-[90%] bg-white/5 rounded-full" />
                <div className="h-4 w-[40%] bg-white/10 rounded-full" />
              </div>
              <div className="h-40 bg-white/[0.03] rounded-3xl border border-dashed border-white/10" />
              <div className="h-32 bg-white/[0.02] rounded-3xl" />
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex gap-2">
                   {entry?.type && (
                     <span className="px-4 py-1.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl shadow-accent/40">
                       {entry.type}
                     </span>
                   )}
                   {entry?.pronunciation && (
                     <span className="px-4 py-1.5 bg-white/5 text-accent text-[10px] font-bold tracking-[0.2em] rounded-full border border-accent/20 italic">
                       {entry.pronunciation}
                     </span>
                   )}
                 </div>
                 <span className="px-4 py-1.5 bg-white/[0.02] text-muted text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5 backdrop-blur-md">
                   {videoTitle?.slice(0, 30)}...
                 </span>
              </div>

              <div className="grid gap-10">
                <div className="space-y-3">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-40">Definition & Intellectual Scope</p>
                  <p className="text-xl text-slate-200 leading-relaxed font-light select-text">{entry?.definition}</p>
                </div>

                {entry?.synonyms && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-40">Semantic Alternatives</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.synonyms.split(',').map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-accent/10 hover:border-accent/40 transition-all cursor-default">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry?.grammar && (
                  <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-[2rem] space-y-3 shadow-inner">
                    <p className="text-[11px] text-accent font-black uppercase tracking-widest">Structural Audit</p>
                    <p className="text-base text-slate-300 leading-relaxed">{entry.grammar}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">Usage Protocol</p>
                  <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-4">{entry?.usage}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50 px-1">Contextual Examples</p>
                  <div className="space-y-3">
                    {(entry?.examples || []).map((ex, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl text-sm text-slate-300 italic flex gap-3 leading-relaxed">
                        <span className="text-accent opacity-50">•</span> {ex}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4 sticky bottom-0 bg-[#0c0c0c] py-4 border-t border-white/5">
                <button onClick={() => { onAddVocab(entry); onClose() }}
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-2xl">
                  <Plus className="h-4 w-4 inline mr-2" /> Add to Study Library
                </button>
                <button onClick={onClose}
                  className="px-8 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function VideoPlayer({ src, thumbnail, title, onClose, seekTo, onTimeUpdate }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const handlers = {
      timeupdate: () => {
        setCur(v.currentTime)
        onTimeUpdate?.(v.currentTime * 1000) // back to ms for sync
      },
      loadedmetadata: () => { 
        setDur(v.duration)
        setLoading(false)
        if (typeof seekTo === 'number') {
          v.currentTime = seekTo
          v.play().catch(() => {})
        }
      },
      canplay: () => setLoading(false),
      error: () => { setErr('Playback failed — stream may have expired.'); setLoading(false) },
      ended: () => setPlaying(false),
    }
    Object.entries(handlers).forEach(([e, fn]) => v.addEventListener(e, fn))
    return () => Object.entries(handlers).forEach(([e, fn]) => v.removeEventListener(e, fn))
  }, [seekTo])

  useEffect(() => {
    if (ref.current && typeof seekTo === 'number' && !loading) {
      ref.current.currentTime = seekTo
      if (ref.current.paused) ref.current.play().catch(() => {})
    }
  }, [seekTo, loading])

  const toggle = () => {
    const v = ref.current; if (!v) return
    v.paused ? v.play().then(() => setPlaying(true)) : (v.pause(), setPlaying(false))
  }
  const toggleMute = () => { const v = ref.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted) }
  const seek = e => {
    const v = ref.current; if (!v || !dur) return
    const r = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - r.left) / r.width) * dur
  }
  const fullscreen = () => ref.current?.requestFullscreen?.()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black border border-border">
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-white/20 text-white transition">
          <X className="h-4 w-4" />
        </button>

        {/* Video area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading && !err && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
          )}
          {err && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-danger" />
              <p className="text-sm select-text">{err}</p>
              <p className="text-xs text-muted">Try downloading the video instead.</p>
            </div>
          )}
          <video ref={ref} src={src} poster={thumbnail}
            className="w-full h-full" onClick={toggle}
            style={{ cursor: 'pointer', display: err ? 'none' : 'block' }} preload="auto" />

          {/* Play overlay */}
          {!playing && !loading && !err && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="h-7 w-7 text-white fill-white ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-[#111] px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-white truncate select-text">{title}</p>

          {/* Seekbar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full cursor-pointer" onClick={seek}>
            <div className="h-full bg-accent rounded-full" style={{ width: dur ? `${(cur / dur) * 100}%` : '0%' }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={toggle} className="text-white hover:text-accent transition">
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={toggleMute} className="text-muted hover:text-white transition">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span className="text-xs text-muted font-mono select-text">{fmtTime(cur)} / {fmtTime(dur)}</span>
            </div>
            <button onClick={fullscreen} className="text-muted hover:text-white transition">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Preview Card ─────────────────────────────────────────────────────────────
export default function VideoPreviewCard({ video, transcript, onAddVocab, quality, onQualityChange, savePath, onPickPath, onDownload, onCancel, progress, downloading, lastFile }) {
  const api = window.youtubeAPI
  const [activeTab, setActiveTab] = useState('learn') // 'download' | 'learn' | 'chat'
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [seekTo, setSeekTo] = useState(null)
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI English Tutor. I've read the transcript for this video. Ask me anything about the words, concepts, or story!" }
  ])
  const [chatInp, setChatInp] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [curTime, setCurTime] = useState(0)
  const [savedLines, setSavedLines] = useState(new Set())
  const [selection, setSelection] = useState({ text: '', x: 0, y: 0 })
  const [exploringWord, setExploringWord] = useState(null)
  const wordCache = useRef(new Map())
  const chatEndRef = useRef(null)
  const transcriptRefs = useRef([])

  useEffect(() => {
    if (!transcript) return
    const activeIdx = transcript.findIndex(l => curTime >= l.start && curTime < (l.start + (l.duration || 3000)))
    if (activeIdx !== -1 && transcriptRefs.current[activeIdx]) {
      transcriptRefs.current[activeIdx].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  }, [curTime, transcript])

  const handleSelection = (e) => {
    const s = window.getSelection()
    const text = s.toString().trim()
    if (text && text.length < 100) {
      setSelection({ text, x: e.clientX, y: e.clientY })
      // Predictive Pre-fetch: Start explaining in background
      if (!wordCache.current.has(text)) {
        api.explainWord({ text, videoTitle: video.title }).then(res => {
          wordCache.current.set(text, res)
        })
      }
    } else {
      setSelection({ text: '', x: 0, y: 0 })
    }
  }

  const handleAddVocab = (line, index) => {
    const uniqueId = `${index}-${line.text.slice(0, 10)}`
    setSavedLines(prev => new Set([...prev, uniqueId]))
    onAddVocab({ text: line.text, videoTitle: video.title })
  }

  const scrollDown = () => {
    if (chatEndRef.current) {
      const container = chatEndRef.current.closest('.overflow-y-auto')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollDown()
  }, [messages])

  const percent = progress?.percent ?? 0
  const statusMsg = progress?.status || 'Preparing…'
  const [streamUrl, setStreamUrl] = useState(null)
  const [loadingStream, setLoadingStream] = useState(false)
  const [streamErr, setStreamErr] = useState(null)

  const handleStop = async () => {
    if (api) {
      await api.stopAI()
      setIsTyping(false)
    }
  }

  const sendMessage = async (overrideInp) => {
    const text = overrideInp || chatInp
    if (!text.trim() || !api) return
    
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setChatInp('')
    setIsTyping(true)

    try {
      const transcriptText = transcript?.map(t => t.text).join(' ').slice(0, 8000) || 'No transcript available.'
      const context = `Video Title: ${video.title}\n\nTranscript: ${transcriptText}`
      const reply = await api.chatWithAI({ 
        messages: [...messages, { role: 'user', content: text }],
        context 
      })
      if (reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ tutor Error: ${e.message}`, isError: true }])
    } finally {
      setIsTyping(false)
    }
  }

  const handlePlayLine = async (seconds) => {
    if (!streamUrl) {
      await handlePlay()
    }
    setSeekTo(seconds)
  }

  const handlePlay = async () => {
    if (!api) return
    setStreamErr(null)
    setLoadingStream(true)
    try {
      const url = await api.getStreamUrl(video.url)
      if (!url) throw new Error('No stream URL — try downloading instead.')
      setStreamUrl(url)
    } catch (e) {
      setStreamErr(e.message)
    } finally {
      setLoadingStream(false)
    }
  }

  const handleAnalyzeAI = async () => {
    if (!api || !transcript) return
    setIsAnalyzing(true)
    try {
      const fullText = transcript.map(t => t.text).join(' ')
      const result = await api.processTranscript({ text: fullText.slice(0, 5000), prompt: 'Summarize this for an English learner and extract key vocabulary with definitions.' })
      setAiAnalysis(result)
    } catch (e) {
      setStreamErr(e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {exploringWord && (
          <WordExplorerModal 
            text={exploringWord} 
            videoTitle={video.title} 
            onClose={() => setExploringWord(null)} 
            onAddVocab={onAddVocab}
            cache={wordCache.current}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 bg-black/60 backdrop-blur-3xl transition-all duration-1000"
           onMouseUp={handleSelection}>
        <motion.div 
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="w-full max-w-7xl h-[90vh] bg-black border border-white/10 shadow-[0_50px_150px_rgba(0,0,0,0.9)] rounded-[3.5rem] overflow-hidden flex flex-col lg:flex-row relative glass-panel"
        >
          {/* Navigation */}
          <button onClick={onClose} 
            className="absolute top-10 left-10 z-[60] p-4 bg-white/5 hover:bg-accent rounded-full border border-white/10 text-white transition-all shadow-2xl">
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Left Side: Media Canvas */}
          <div className="flex-1 min-w-0 bg-black relative flex flex-col">
            <div className="aspect-video w-full bg-[#050505] overflow-hidden group shadow-2xl relative">
              <VideoPlayer src={streamUrl} thumbnail={video.thumbnail} title={video.title} onClose={() => setStreamUrl(null)} seekTo={seekTo} onTimeUpdate={setCurTime} />
              
              {!streamUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                   <img src={video.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                   <button onClick={handlePlay} disabled={loadingStream}
                      className="relative z-10 h-20 w-20 rounded-full bg-white/10 hover:bg-accent border border-white/20 flex items-center justify-center backdrop-blur-xl transition-all group/play">
                     {loadingStream ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Play className="h-8 w-8 text-white fill-white ml-1 group-hover/play:scale-110 transition-transform" />}
                   </button>
                </div>
              )}
            </div>
            
            <div className="p-12 flex-1 flex flex-col justify-center max-w-3xl mx-auto text-center space-y-6">
               <div className="flex items-center justify-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  <span className="text-accent font-black text-[11px] uppercase tracking-[0.5em]">Research Studio</span>
               </div>
               <h1 className="text-5xl font-black text-white tracking-widest leading-tight select-text text-gradient">{video.title}</h1>
               <p className="text-muted/60 text-[11px] font-black tracking-[0.3em] uppercase">{video.author} • {fmtTime(video.duration)}</p>
            </div>
          </div>

          {/* Right Side: Scientific Panel */}
          <div className="w-full lg:w-[520px] bg-black border-l border-white/10 flex flex-col overflow-hidden relative shadow-[20px_0_100px_rgba(0,0,0,0.8)]">
            {/* Tab Controller */}
            <div className="flex items-center justify-around border-b border-white/10 p-6 bg-[#0c0c0c]">
              {['learn', 'chat', 'download'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative px-8 py-2 text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 ${
                    activeTab === tab ? 'text-accent font-black' : 'text-muted/40 hover:text-white'
                  }`}>
                  {tab}
                  {activeTab === tab && <motion.div layoutId="tab-bar" className="absolute -bottom-6 left-0 right-0 h-1 bg-accent shadow-[0_0_20px_rgba(59,130,246,0.8)]" />}
                </button>
              ))}
            </div>

            <div className="p-8 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full gap-8">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Transcription Stream</span>
                      <button onClick={handleAnalyzeAI} disabled={isAnalyzing || !transcript}
                        className="px-6 py-2 rounded-full bg-white text-black hover:bg-accent hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                        {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Digest
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scroll space-y-2">
                       {transcript?.map((line, i) => {
                         const isActive = curTime >= line.start && curTime < (line.start + (line.duration || 3000))
                         return (
                           <div key={i} 
                             ref={el => transcriptRefs.current[i] = el}
                             className={`group relative flex flex-col gap-3 p-5 rounded-[2rem] transition-all duration-700 ${
                               isActive ? 'bg-white/10 shadow-2xl ring-1 ring-accent/30 scale-[1.02]' : 'hover:bg-white/[0.04]'
                             }`}
                           >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-muted/40">{fmtTime(line.start / 1000)}</span>
                                <button onClick={() => handleAddVocab(line, i)} 
                                  className={`p-2 rounded-lg transition-all ${savedLines.has(`${i}-${line.text.slice(0,10)}`) ? 'text-green-500 scale-110' : 'text-muted/0 group-hover:text-accent group-hover:bg-accent/10'}`}>
                                  {savedLines.has(`${i}-${line.text.slice(0,10)}`) ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>
                              </div>
                              <p className="text-base text-slate-200 leading-relaxed font-light select-text">{line.text}</p>
                           </div>
                         )
                       })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-6 pb-6 pt-2">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed ${
                            m.role === 'user' ? 'bg-accent text-white shadow-xl rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none select-text'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 p-4 rounded-3xl animate-pulse flex gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" />
                            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce delay-75" />
                            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce delay-150" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative mt-auto pt-4 border-t border-white/5">
                       <input value={chatInp} onChange={e => setChatInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                         placeholder="Consult AI Professor..."
                         className="w-full bg-white/[0.03] border border-white/10 rounded-3xl pl-6 pr-24 py-5 text-sm outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"
                       />
                       <button onClick={() => sendMessage()}
                         className="absolute right-3 top-7 p-3 bg-accent text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20">
                         <Send className="h-4 w-4" />
                       </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'download' && (
                  <motion.div key="download" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full justify-between gap-10">
                    <div className="space-y-10 pt-4">
                       <div className="space-y-4">
                         <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Media Quality</p>
                         <div className="relative group">
                           <select value={quality} onChange={e => onQualityChange(e.target.value)} disabled={downloading}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 text-sm appearance-none focus:border-accent transition-all cursor-pointer">
                             {(video.qualityOptions || []).map(o => (
                               <option key={o.value} value={o.value} className="bg-[#0c0c0c]">{o.label}</option>
                             ))}
                           </select>
                           <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none group-hover:text-accent" />
                         </div>
                       </div>
                       
                       <div className="space-y-4">
                         <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Save Destination</p>
                         <button onClick={onPickPath} className="w-full flex items-center gap-4 p-5 bg-white/[0.03] border border-white/10 rounded-[1.5rem] hover:bg-white/[0.07] transition text-left">
                           <FolderOpen className="h-5 w-5 text-accent" />
                           <span className="text-xs truncate flex-1 text-slate-300 font-bold uppercase tracking-widest">{savePath ? savePath.split(/[\\\\/]/).pop() || savePath : 'Select Folder'}</span>
                         </button>
                       </div>
                    </div>

                    <div className="space-y-6">
                      {downloading ? (
                         <div className="space-y-4">
                            <div className="flex justify-between items-end">
                               <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] animate-pulse">Encryption Phase</p>
                               <p className="text-xl font-black text-white">{percent}%</p>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-accent shadow-[0_0_20px_rgba(59,130,246,1)]" />
                            </div>
                            <button onClick={onCancel} className="w-full text-[10px] font-black uppercase tracking-[0.4em] text-red-500/50 hover:text-red-500 transition-colors">Abort Mission</button>
                         </div>
                      ) : (
                         <button onClick={onDownload} 
                           className="w-full h-20 bg-white text-black rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-accent hover:text-white transition-all shadow-2xl hover:shadow-accent/40 group">
                           <Download className="h-6 w-6 group-hover:scale-110 transition-transform" />
                           <span className="text-base uppercase tracking-[0.2em]">Store Assets Offline</span>
                         </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Floating AI Highlight Trigger */}
        <AnimatePresence>
          {selection.text && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ left: selection.x, top: selection.y - 70 }}
              onClick={() => { setExploringWord(selection.text); setSelection({ text: '', x: 0, y: 0 }) }}
              className="fixed z-[110] flex items-center gap-3 bg-accent text-white px-6 py-3 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-widest ring-8 ring-accent/20 hover:scale-110 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4" /> Analyze Context
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
