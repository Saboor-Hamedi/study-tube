import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Sparkles, MessageCircle, Clock, X, Loader2, 
  MessageSquare, Library, StopCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api as bridgeApi } from '../../utils/api-bridge'

export default function VideoPreviewCard({ 
  video, 
  onClose, 
  transcript, 
  loadingTranscript, 
  onAddVocab, 
  showToast,
  api: passedApi
}) {
  const api = passedApi || bridgeApi
  const [activeTab, setActiveTab] = useState('learn')
  const [curTime, setCurTime] = useState(0)
  const [seekTo, setSeekTo] = useState(null)
  const [scriptMode, setScriptMode] = useState('raw')
  const [refinedTranscript, setRefinedTranscript] = useState(null)
  const [isRefining, setIsRefining] = useState(false)
  const [chatInp, setChatInp] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreamStarted, setIsStreamStarted] = useState(false)

  // Polling for current time from YouTube Player
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const intervalRef = useRef(null)
  const transcriptRef = useRef(null)

  useEffect(() => {
    if (!video) return
    setMessages([
      { role: 'assistant', content: `Neural Research Active. Analyzing "${video.title}". Ask me anything about this session.` }
    ])
    setIsStreamStarted(false)
    setCurTime(0)
  }, [video])

  useEffect(() => {
    if (isStreamStarted && !window.YT) {
      const tag = document.createElement('script')
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    if (isStreamStarted && window.YT) {
      initPlayer()
    }

    window.onYouTubeIframeAPIReady = () => {
      if (isStreamStarted) initPlayer()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (playerRef.current) playerRef.current.destroy()
    }
  }, [isStreamStarted, video.id])

  const initPlayer = () => {
    playerRef.current = new window.YT.Player('yt-player-container', {
      videoId: video.id,
      playerVars: { autoplay: 1, enablejsapi: 1, rel: 0 },
      events: {
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            intervalRef.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                setCurTime(playerRef.current.getCurrentTime())
              }
            }, 500)
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        }
      }
    })
  }

  useEffect(() => {
    if (seekTo !== null && playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seekTo, true)
      setSeekTo(null)
    }
  }, [seekTo])

  // Auto-scroll transcript
  useEffect(() => {
    if (activeTab === 'learn' && transcriptRef.current) {
      const activeEl = transcriptRef.current.querySelector('.bg-white\\/10')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [curTime, activeTab])

  const handleRefine = async () => {
    if (!transcript || transcript.length === 0) return
    setIsRefining(true)
    try {
      const raw = transcript.map(t => t.text).join(' ')
      const result = await api.reconstructTranscript(raw)
      setRefinedTranscript(result)
      setScriptMode('neural')
    } catch (e) {
      showToast('Neural synthesis failed', 'error')
    } finally {
      setIsRefining(false)
    }
  }

  const sendMessage = async () => {
    if (!chatInp.trim() || isTyping) return
    const userMsg = chatInp.trim()
    setChatInp('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsTyping(true)
    
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await api.chatWithAI({
        messages: [...history, { role: 'user', content: userMsg }],
        videoId: video.id,
        videoTitle: video.title,
        transcript: transcript.map(t => t.text).join(' ')
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res }])
    } catch (e) {
      showToast('AI response failed', 'error')
    } finally {
      setIsTyping(false)
    }
  }

  const handleStop = () => {
    api.stopAI()
    setIsTyping(false)
  }

  const fmtTime = (s) => {
    if (!s) return '0:00'
    const m = Math.floor(s / 60)
    const rs = Math.floor(s % 60)
    return `${m}:${rs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-border bg-surface-2/30">
        <div className="flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Neural Forensic Intelligence Active</span>
        </div>
        <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-surface-3 flex items-center justify-center transition-all opacity-40 hover:opacity-100">
           <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 md:overflow-hidden overflow-y-auto md:flex-row flex-col max-w-[1700px] w-full mx-auto p-2 lg:p-3 gap-3 custom-scroll">
        {/* Left Side: Video & Transcript */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 md:overflow-y-auto custom-scroll">
          <div className="w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-border/10 relative group">
            {isStreamStarted ? (
              <div className="relative w-full h-full bg-black">
                <div id="yt-player-container" className="w-full h-full" />
                <button onClick={() => setIsStreamStarted(false)} className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all z-10">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button 
                    onClick={() => setIsStreamStarted(true)} 
                    className="h-16 w-16 bg-red-600/90 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                  >
                    <Play className="h-6 w-6 fill-white ml-1" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
             <div className="space-y-2 select-text cursor-text">
                <h1 className="text-xl lg:text-2xl font-bold text-text leading-snug tracking-tight">{video.title}</h1>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center border border-border/50 text-[10px] font-black uppercase">
                        {video.author?.slice(0, 2)}
                      </div>
                      <span className="text-[14px] font-bold text-text">{video.author}</span>
                   </div>
                   <span className="text-muted/20">•</span>
                   <span className="text-sm text-muted">{video.views} views</span>
                   <span className="text-muted/20">•</span>
                   <span className="text-xs text-muted flex items-center gap-1 font-bold"><Clock className="h-3.5 w-3.5"/> {fmtTime(video.durationSec || video.duration)}</span>
                </div>
             </div>
             
             {video.description && (
                <div className="p-4 bg-surface-2/50 rounded-xl border border-border/10 select-text cursor-text">
                   <p className="text-xs text-muted leading-relaxed line-clamp-3">{video.description}</p>
                </div>
             )}
          </div>
        </div>

        {/* Right Side: 2 Tabs - Youtube Sidebar Style */}
        <div className="w-full md:w-[400px] lg:w-[480px] min-h-[500px] md:min-h-0 shrink-0 flex flex-col bg-surface rounded-xl border border-border/50 overflow-hidden transition-all duration-500 shadow-xl">
          <div className="flex border-b border-border bg-surface-2">
            {[
              { id: 'learn', label: 'AI Tutor', icon: Sparkles },
              { id: 'chat', label: 'Research', icon: MessageCircle }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all relative ${activeTab === tab.id ? 'text-accent bg-surface-3' : 'text-muted/40 hover:text-text hover:bg-surface-3'}`}>
                <tab.icon className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
              </button>
            ))}
          </div>

          <div className="flex-1 relative overflow-hidden">
            {activeTab === 'learn' && (
              <div className="absolute inset-0 flex flex-col bg-background">
                <div className="h-12 shrink-0 border-b border-border/40 px-4 flex items-center justify-between bg-surface-2/30">
                  <div className="flex items-center gap-2">
                     <div className={`px-2 py-1 rounded-md border text-[8px] font-black uppercase tracking-widest transition-all ${scriptMode === 'neural' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-surface border-border text-muted'}`}>
                        {scriptMode === 'neural' ? 'Neural' : 'Raw'}
                     </div>
                     {transcript?.length > 0 && (
                        <button 
                          onClick={refinedTranscript ? () => setScriptMode(scriptMode === 'raw' ? 'neural' : 'raw') : handleRefine}
                          disabled={isRefining}
                          className="p-1.5 rounded-md border border-border bg-surface hover:text-accent transition-all"
                        >
                           {isRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        </button>
                     )}
                  </div>
                  <button 
                    onClick={() => {
                       const content = scriptMode === 'neural' ? refinedTranscript : (Array.isArray(transcript) ? transcript : []).map(t => t.text).join('\n\n')
                       onAddVocab({ text: video.title, definition: content, type: 'Collection', videoTitle: video.title, date: new Date().toISOString(), skipAI: true })
                       showToast(`Collection "${video.title}" saved!`)
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all rounded-full"
                  >
                    Save
                  </button>
                </div>
                
                <div ref={transcriptRef} className="flex-1 overflow-y-auto scrollbar-thin select-text cursor-text bg-background text-text custom-scroll">
                  <div className="p-4 space-y-1">
                    {loadingTranscript ? (
                      <div className="h-full flex flex-col items-center justify-center pt-20 text-accent gap-4">
                         <Loader2 className="h-10 w-10 animate-spin opacity-40" />
                         <p className="text-[10px] uppercase font-black tracking-[0.2em] animate-pulse text-accent">Synthesizing Script...</p>
                      </div>
                    ) : (transcript && transcript.length > 0) ? (
                      <div className="space-y-0.5">
                         {scriptMode === 'neural' && refinedTranscript ? (
                            <div className="p-6 prose prose-sm max-w-none select-text leading-relaxed text-text">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{refinedTranscript}</ReactMarkdown>
                            </div>
                         ) : (
                            transcript.map((line, i) => {
                              const cleanText = line.text.replace(/>>/g, '').trim();
                              if (!cleanText) return null;
                              
                              // Handle both seconds and milliseconds (YouTube API vs some scrapers)
                              const start = line.start > 10000 ? line.start / 1000 : line.start;
                              const duration = line.duration > 1000 ? line.duration / 1000 : (line.duration || 5);
                              const isActive = curTime >= start && curTime < (start + duration);
                              
                              return (
                                <div 
                                  key={i} 
                                  onClick={() => setSeekTo(start)}
                                  className={`flex gap-4 p-3 rounded-lg transition-all cursor-pointer group ${isActive ? 'bg-accent/10' : 'hover:bg-surface-2'}`}
                                >
                                  <span className={`text-[11px] font-mono shrink-0 pt-0.5 ${isActive ? 'text-accent font-bold' : 'text-accent/40'}`}>
                                    {fmtTime(start)}
                                  </span>
                                  <p className={`text-[13px] leading-relaxed transition-all ${isActive ? 'text-text font-medium' : 'text-muted'}`}>
                                    {cleanText}
                                  </p>
                                </div>
                              )
                            })
                         )}
                      </div>
                    ) : transcript === null ? (
                      <div className="h-full flex flex-col items-center justify-center pt-20 text-accent gap-4">
                         <Loader2 className="h-10 w-10 animate-spin opacity-40" />
                         <p className="text-[10px] uppercase font-black tracking-[0.2em] animate-pulse text-accent">Establishing Neural Link...</p>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center pt-20 text-muted/40 gap-4">
                         <Library className="h-12 w-12 opacity-10" />
                         <p className="text-sm italic text-muted">No script data available for this session.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="absolute inset-0 flex flex-col p-6 bg-background">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin select-text cursor-text custom-scroll">
                   {messages.map((m, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3.5 text-[13px] leading-relaxed transition-all rounded-2xl select-text cursor-text ${
                        m.role === 'user' 
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-surface-3 border border-border/40 text-text rounded-tl-none shadow-sm'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-4 text-accent animate-pulse px-2 py-4">
                       <div className="p-2 bg-accent/10 border border-accent/20">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-[0.3em]">Synthesizing Neural Response...</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border/40 mt-4">
                  <div className="relative group">
                    <input value={chatInp} onChange={e => setChatInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask about this video..." className="w-full bg-surface-2 border border-border/10 rounded-xl px-4 py-3.5 pr-14 text-sm text-text outline-none focus:border-accent/30 transition-all" disabled={isTyping} />
                    {isTyping ? (
                      <button onClick={handleStop} className="absolute right-1.5 top-1.5 bottom-1.5 w-11 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0">
                        <StopCircle className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={sendMessage} className="absolute right-1.5 top-1.5 bottom-1.5 w-11 bg-accent text-white rounded-lg flex items-center justify-center hover:scale-105 transition-all shrink-0 shadow-lg shadow-accent/20">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
