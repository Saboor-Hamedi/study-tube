import { useState, useRef, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, X,
  Download, FolderOpen, ChevronDown, CheckCircle,
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
function VideoPlayer({ src, thumbnail, title, onClose, seekTo }) {
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
      timeupdate: () => setCur(v.currentTime),
      loadedmetadata: () => { 
        setDur(v.duration)
        setLoading(false)
        // Seek on initial load if seekTo is provided
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
  const chatEndRef = useRef(null)

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
        {streamUrl && (
          <VideoPlayer 
            src={streamUrl} 
            thumbnail={video.thumbnail} 
            title={video.title} 
            onClose={() => setStreamUrl(null)} 
            seekTo={seekTo}
          />
        )}
      </AnimatePresence>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-border bg-black/20">
          <button 
            onClick={() => setActiveTab('download')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'download' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-muted hover:text-white'}`}
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'learn' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-muted hover:text-white'}`}
          >
            <BookOpen className="h-4 w-4" /> Study
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-muted hover:text-white'}`}
          >
            <MessageCircle className="h-4 w-4" /> AI Tutor
          </button>
        </div>

        <div className="md:grid md:grid-cols-[5fr_6fr]">

          {/* Thumbnail / Video Area */}
          <div className="relative overflow-hidden bg-black group h-[480px]">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&auto=format&fit=crop' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Play button */}
            {!downloading && (
              <button onClick={handlePlay} disabled={loadingStream}
                className="absolute inset-0 flex items-center justify-center">
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  className="h-14 w-14 rounded-full bg-white/20 hover:bg-accent/80 border border-white/30 flex items-center justify-center backdrop-blur-sm transition-colors">
                  {loadingStream
                    ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                    : <Play className="h-6 w-6 text-white fill-white ml-0.5" />}
                </motion.div>
              </button>
            )}


            {/* Download progress overlay */}
            {downloading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                {/* Circle progress */}
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                    <motion.circle
                      cx="48" cy="48" r="40" stroke="#3b82f6" strokeWidth="8" fill="none"
                      strokeLinecap="round" strokeDasharray={251.2}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * percent) / 100 }}
                      transition={{ ease: 'linear', duration: 0.3 }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">{percent}%</span>
                </div>
                <p className="text-sm text-slate-300 text-center px-4 select-text">{statusMsg}</p>
              </div>
            )}
          </div>

          {/* Info & Learning Panel */}
          <div className="p-5 flex flex-col gap-4 overflow-hidden h-[480px]">
            
            {activeTab === 'download' && (
              <div className="flex flex-col h-full gap-4">
                {/* Title & meta */}
                <div>
                  <h2 className="text-base font-semibold text-white leading-snug select-text line-clamp-3">{video.title}</h2>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                    {video.author && <span className="flex items-center gap-1 select-text"><User className="h-3 w-3" />{video.author}</span>}
                    {video.duration > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(video.duration)}</span>}
                    {video.views > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Number(video.views).toLocaleString()} views</span>}
                  </div>
                </div>

                {/* Quality selector */}
                <div>
                  <label className="text-[10px] font-semibold text-muted uppercase tracking-widest block mb-1">Quality</label>
                  <div className="relative">
                    <select value={quality} onChange={e => onQualityChange(e.target.value)} disabled={downloading}
                      className="w-full appearance-none bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent transition disabled:opacity-50 cursor-pointer">
                      {(video.qualityOptions || []).map(o => (
                        <option key={o.value} value={o.value} className="bg-[#1a1a1a]">{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  </div>
                </div>

                {/* Save path */}
                <div>
                  <label className="text-[10px] font-semibold text-muted uppercase tracking-widest block mb-1">Save to</label>
                  <button onClick={onPickPath} disabled={downloading}
                    className="w-full flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-left hover:border-accent/50 transition disabled:opacity-50">
                    <FolderOpen className="h-4 w-4 text-muted shrink-0" />
                    <span className="truncate text-slate-300">{savePath ? savePath.split(/[\\\\/]/).pop() || savePath : 'Choose save folder…'}</span>
                    {savePath && <CheckCircle className="h-4 w-4 text-success ml-auto shrink-0" />}
                  </button>
                </div>

                <div className="flex-1" />

                <div className="space-y-2">
                  {downloading ? (
                    <button onClick={onCancel}
                      className="w-full flex items-center justify-center gap-2 rounded-xl h-10 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium transition">
                      <StopCircle className="h-4 w-4" /> Cancel Download
                    </button>
                  ) : (
                    <button onClick={onDownload}
                      className="w-full flex items-center justify-center gap-2 rounded-xl h-10 bg-accent hover:bg-accent-hover text-white text-sm font-medium transition">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  )}
                  {lastFile && (
                    <button onClick={() => api?.openFilePath?.(lastFile)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl h-9 border border-border text-xs text-muted hover:text-white hover:border-white/20 transition">
                      <ExternalLink className="h-3.5 w-3.5" /> Open saved file
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'learn' && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted uppercase tracking-widest">Transcript</span>
                  <button onClick={handleAnalyzeAI} disabled={isAnalyzing || !transcript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-[11px] font-bold transition disabled:opacity-30">
                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Quick Summary
                  </button>
                </div>

                {aiAnalysis && (
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-slate-200 leading-relaxed overflow-y-auto max-h-[140px] scrollbar-thin">
                    <div className="flex items-center gap-2 mb-2 text-accent font-bold"><MessageCircle className="h-3.5 w-3.5" /> AI Insights</div>
                    {aiAnalysis}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-2">
                  {transcript ? (
                    transcript.map((line, i) => (
                      <div key={i} className="group relative flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                        <button onClick={() => handlePlayLine(line.start / 1000)}
                          className="text-[10px] text-muted font-mono bg-white/5 px-1.5 py-0.5 rounded group-hover:bg-accent group-hover:text-white transition-colors"
                        >
                          {fmtTime(line.start / 1000)}
                        </button>
                        <p className="text-sm text-slate-300 leading-relaxed flex-1 select-text">{line.text}</p>
                        <button onClick={() => onAddVocab({ text: line.text, videoTitle: video.title })}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-accent/20 text-accent transition-all">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted gap-2 text-xs">
                      <Loader2 className="h-5 w-5 animate-spin" /> Fetching script…
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-4 p-1">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-accent text-white rounded-tr-none shadow-accent/10' 
                          : m.isError 
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 rounded-tl-none italic'
                            : 'bg-surface-2 border border-border text-slate-200 rounded-tl-none'
                      }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="pl-1">{children}</li>,
                            code: ({children}) => <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs text-accent-hover">{children}</code>,
                            pre: ({children}) => <pre className="bg-black/40 p-2 rounded-lg my-2 overflow-x-auto scrollbar-thin">{children}</pre>,
                            strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                            a: ({children, href}) => <a href={href} target="_blank" className="text-accent hover:underline decoration-2">{children}</a>
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-surface-2 border border-border px-4 py-2 rounded-2xl rounded-tl-none flex gap-1 items-center">
                        <div className="h-1 w-1 bg-accent rounded-full animate-bounce" />
                        <div className="h-1 w-1 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="h-1 w-1 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {['Explain grammar', 'Quiz me!', 'Main topics'].map(hint => (
                      <button key={hint} onClick={() => sendMessage(hint)}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted hover:text-white hover:border-accent/40 transition-colors">
                        {hint}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-end gap-2 bg-surface-2 border border-border rounded-xl px-2 py-1.5 focus-within:border-accent transition-colors shadow-inner">
                    <textarea 
                      rows="1"
                      value={chatInp}
                      onChange={e => setChatInp(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Ask your tutor…"
                      className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-white placeholder:text-muted resize-none max-h-32 scrollbar-thin"
                    />
                    <button 
                      onClick={() => isTyping ? handleStop() : sendMessage()} 
                      disabled={!isTyping && !chatInp.trim()}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all mb-0.5 shadow-lg ${
                        isTyping 
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/40 animate-pulse' 
                          : 'bg-accent hover:bg-accent-hover text-white shadow-accent/20 disabled:opacity-30 disabled:grayscale'
                      }`}
                      title={isTyping ? 'Stop Tutor' : 'Send Message'}
                    >
                      {isTyping ? <StopCircle className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
