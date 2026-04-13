import { useState, useRef, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, X,
  Download, FolderOpen, CheckCircle, ChevronLeft,
  Clock, Plus, Sparkles, MessageCircle, StopCircle, Library
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

function VideoPlayer({ src, thumbnail, title, onClose, seekTo, onTimeUpdate }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const handlers = {
      timeupdate: () => {
        setCur(v.currentTime)
        onTimeUpdate?.(v.currentTime * 1000)
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
    <div className="absolute inset-0 bg-black flex flex-col pointer-events-auto z-10 shadow-2xl">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video ref={ref} src={src} poster={thumbnail}
          className="w-full h-full" onClick={toggle}
          style={{ cursor: 'pointer' }} preload="auto" />
      </div>

      <div className="bg-[#111] px-5 py-3 space-y-2 select-none border-t border-white/10">
        <div className="h-1.5 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden transition-all hover:h-2" onClick={seek}>
          <div className="h-full bg-accent rounded-full transition-all duration-100" style={{ width: dur ? `${(cur / dur) * 100}%` : '0%' }} />
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
          <div className="flex items-center gap-3">
            <button onClick={fullscreen} className="text-muted hover:text-white transition">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="text-muted hover:text-red-400 transition ml-2 border-l border-white/10 pl-3">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VideoPreviewCard({ video, onClose, transcript, loadingTranscript, onAddVocab, quality, onQualityChange, savePath, onPickPath, onDownload, onCancel, progress, downloading, showToast }) {
  const api = window.youtubeAPI
  const [activeTab, setActiveTab] = useState('learn')
  const [streamUrl, setStreamUrl] = useState(null)
  const [curTime, setCurTime] = useState(0)
  const [seekTo, setSeekTo] = useState(null)
  const [savedLines, setSavedLines] = useState(new Set())
  const [chatInp, setChatInp] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selection, setSelection] = useState(null)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI English Tutor. I've read the transcript for this video. Ask me anything!" }
  ])

  const handlePlay = async () => {
    if (!api) return
    try {
      const url = await api.getStreamUrl(video.url)
      setStreamUrl(url)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddVocab = (line, idx) => {
    const uniqueId = `${idx}-${line.text.slice(0, 10)}`
    setSavedLines(prev => new Set([...prev, uniqueId]))
    onAddVocab({ text: line.text, videoTitle: video.title, timestamp: line.start, skipAI: true, type: 'sentence' })
  }

  const captureSelection = () => {
    setTimeout(() => {
      const s = window.getSelection()
      const text = s?.toString().trim()
      
      if (text && text.length > 0 && text.length < 2000 && s.rangeCount > 0) {
        const range = s.getRangeAt(0)
        const rects = range.getClientRects()
        if (rects.length === 0) return
        
        // Use the first rect to avoid jumping to (0,0)
        const rect = rects[0]
        if (rect.left === 0 && rect.top === 0) return

        setSelection({ 
          text, 
          x: rect.left + rect.width / 2, 
          y: rect.top - 12 
        })
      } else {
        if (selection) setSelection(null)
      }
    }, 60)
  }

  const handleStop = async () => {
    if (api) {
      await api.stopAI?.()
      setIsTyping(false)
    }
  }

  const sendMessage = async () => {
    if (!chatInp.trim() || !api || isTyping) return
    const text = chatInp
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setChatInp('')
    setIsTyping(true)
    
    try {
      const tr = (transcript || []).map(t => t.text).join(' ').slice(0, 5000)
      const context = `Video: ${video.title}\nTranscript: ${tr}`
      const reply = await api.chatWithAI({ messages: [...messages, { role: 'user', content: text }], context })
      if (reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-[#0a0a0a]" onMouseUp={captureSelection} onDoubleClick={captureSelection}>
      <AnimatePresence>
        {selection && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[100] -translate-x-1/2 -translate-y-full"
            style={{ left: selection.x, top: selection.y }}
          >
            <button 
              onClick={() => {
                onAddVocab({ text: selection.text, videoTitle: video.title, timestamp: curTime, skipAI: selection.text.split(' ').length > 8 })
                window.getSelection()?.removeAllRanges()
                setSelection(null)
              }}
              className="px-4 py-2 bg-accent text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-2xl flex items-center gap-2 hover:bg-white hover:text-black transition-all"
            >
              <Sparkles className="h-3 w-3" /> {selection.text.split(' ').length > 4 ? 'Save Selection' : 'Save Word'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      <div className="flex flex-1 overflow-hidden lg:flex-row flex-col max-w-[1400px] w-full mx-auto p-4 lg:p-6 gap-6">
        {/* Left Side: Video & Transcript */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 relative shadow-2xl group">
            {streamUrl ? (
              <VideoPlayer src={streamUrl} thumbnail={video.thumbnail} title={video.title} onClose={() => setStreamUrl(null)} seekTo={seekTo} onTimeUpdate={setCurTime} />
            ) : (
              <>
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center">
                  <button onClick={handlePlay} className="h-20 w-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-accent hover:scale-110 transition-all shadow-xl border border-white/20 group/btn">
                    <Play className="h-8 w-8 text-white fill-white ml-2 transition-transform group-hover/btn:scale-110" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="p-1 px-2 space-y-4">
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-accent px-2 py-1 bg-accent/10 rounded border border-accent/20">Source Material</span>
               <span className="text-[10px] font-bold text-muted/60 flex items-center gap-1"><Clock className="h-3 w-3"/> {fmtTime(video.durationSec)} runtime</span>
             </div>
             <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight selection:bg-accent/30">{video.title}</h1>
          </div>
        </div>

        {/* Right Side: 3 Tabs (Cards) - EXACTLY AS REQUESTED */}
        <div className="w-full lg:w-[480px] shrink-0 flex flex-col bg-[#111] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
          <div className="grid grid-cols-3 border-b border-white/10 bg-[#0a0a0a]">
            {[
              { id: 'learn', label: 'AI Tutor', icon: Sparkles },
              { id: 'chat', label: 'Research', icon: MessageCircle },
              { id: 'download', label: 'Download', icon: Download }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center pt-5 pb-4 transition-all relative ${activeTab === tab.id ? 'text-accent bg-white/[0.02]' : 'text-muted/40 hover:text-white hover:bg-white/[0.01]'}`}>
                <tab.icon className="h-5 w-5 mb-1.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'learn' && (
              <div className="absolute inset-0 flex flex-col overflow-hidden">
                 <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Reader Mode</p>
                   <button 
                     onClick={() => {
                        const fullText = (transcript || []).map(t => t.text).join(' ')
                        onAddVocab({ text: video.title, definition: fullText, type: 'Collection', videoTitle: video.title, date: new Date().toISOString(), skipAI: true })
                        showToast(`Collection "${video.title}" saved!`)
                     }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                   >
                     <Library className="h-3.5 w-3.5" />
                     Save as Collection
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8 scrollbar-thin bg-black/20">
                    <div className="max-w-prose mx-auto">
                      {loadingTranscript ? (
                        <div className="h-full flex flex-col items-center justify-center pt-20 text-accent gap-4">
                           <Loader2 className="h-10 w-10 animate-spin opacity-40" />
                           <p className="text-[10px] uppercase font-black tracking-[0.2em] animate-pulse">Generating Script...</p>
                        </div>
                      ) : transcript?.length ? (
                        <div className="text-[13px] text-white/80 leading-[1.8] text-justify select-text lowercase space-y-4">
                           <p>
                             {transcript.map((line, i) => {
                               const isActive = curTime >= line.start && curTime < (line.start + (line.duration || 3000));
                               return (
                                 <span 
                                   key={i} 
                                   className={`inline mr-1.5 transition-all cursor-pointer rounded-sm ${isActive ? 'bg-accent/40 text-white font-bold px-0.5' : 'hover:bg-white/10 hover:text-white'}`}
                                   onClick={() => setSeekTo(line.start / 1000)}
                                 >
                                   {line.text}
                                 </span>
                               )
                             })}
                           </p>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center pt-20 text-muted/40 gap-4">
                           <Library className="h-12 w-12 opacity-10" />
                           <p className="text-sm italic">No script data found for this video.</p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="absolute inset-0 flex flex-col p-6">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-xl text-[13px] ${m.role === 'user' ? 'bg-accent text-white' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10 mt-4 relative">
                  <input value={chatInp} onChange={e => setChatInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about this video..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none focus:border-accent/50" disabled={isTyping} />
                  {isTyping ? (
                    <button onClick={handleStop} className="absolute right-2 top-6 h-8 w-8 bg-red-500/20 text-red-500 rounded flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <StopCircle className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={sendMessage} className="absolute right-2 top-6 h-8 w-8 bg-accent text-white rounded flex items-center justify-center hover:bg-white hover:text-black transition-all">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'download' && (
              <div className="absolute inset-0 overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] text-muted font-bold uppercase tracking-widest">Quality</h3>
                  <div className="grid gap-2 text-sm">
                    {video.qualityOptions?.map(opt => (
                      <button key={opt.value} onClick={() => onQualityChange(opt.value)}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${quality === opt.value ? 'bg-white/[0.05] border-accent text-white' : 'bg-transparent border-white/10 text-muted hover:border-white/30'}`}>
                        <span>{opt.label}</span>
                        {quality === opt.value && <CheckCircle className="h-4 w-4 text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] text-muted font-bold uppercase tracking-widest">Folder</h3>
                    <button onClick={onPickPath} className="text-[10px] text-accent uppercase font-bold tracking-widest hover:text-white">Change</button>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate pr-4">{savePath || 'No folder selected'}</span>
                    <FolderOpen className="h-4 w-4 shrink-0 text-muted" />
                  </div>
                </div>

                <div className="pt-4">
                  {downloading ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-accent uppercase tracking-widest">
                        <span>Downloading</span>
                        <span>{Math.round(progress?.percent || 0)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress?.percent || 0}%` }} className="h-full bg-accent" />
                      </div>
                      <button onClick={onCancel} className="w-full py-3 mt-4 text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={onDownload} disabled={!quality || !savePath}
                      className="w-full p-4 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white transition-all focus:scale-[0.98] disabled:opacity-50">
                      <Download className="h-4 w-4 inline mr-2" /> Start Download
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
