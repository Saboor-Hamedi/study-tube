import { useState, useRef, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, X,
  Download, FolderOpen, CheckCircle, ChevronLeft,
  Clock, Plus, Sparkles, MessageCircle, StopCircle, Library, Loader2
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

function VideoPlayer({ videoId, onClose, seekTo }) {
  const [isReady, setIsReady] = useState(false)
  const playerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Load YT API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          start: Math.floor(seekTo || 0),
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            setIsReady(true)
            if (seekTo) event.target.seekTo(seekTo, true)
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [videoId])

  useEffect(() => {
    if (isReady && playerRef.current?.seekTo && typeof seekTo === 'number') {
      playerRef.current.seekTo(seekTo, true)
      playerRef.current.playVideo()
    }
  }, [seekTo, isReady])

  return (
    <div className="absolute inset-0 bg-black flex flex-col pointer-events-auto z-10 shadow-2xl overflow-hidden">
      <div className="relative flex-1 bg-black group/player">
        <div ref={containerRef} className="w-full h-full" />
        
        <AnimatePresence>
          {!isReady && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-4 z-20"
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                 <Loader2 className="h-6 w-6 text-accent animate-spin absolute" />
                 <div className="w-full h-full border border-accent/10 rounded-full animate-ping" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/50">Initializing Neural Link...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-surface-2 px-6 py-2 flex items-center justify-between border-t border-border/40 select-none transition-all duration-500 hover:bg-surface-3">
        <div className="flex items-center gap-3">
           <div className={`h-1 w-1 rounded-full ${isReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
           <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted/50">
             {isReady ? 'Neural Analysis Stream Active' : 'Establishing Secure Link...'}
           </span>
        </div>
        <button onClick={onClose} className="text-[8px] font-black uppercase tracking-widest text-muted/40 hover:text-red-400 transition-all flex items-center gap-2 group outline-none">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Disconnect</span>
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

import { api as bridgeApi } from "../../utils/api-bridge";

export default function VideoPreviewCard({ 
  video, 
  onClose, 
  transcript, 
  loadingTranscript, 
  onAddVocab, 
  quality, 
  onQualityChange, 
  savePath, 
  onPickPath, 
  onDownload, 
  onCancel, 
  progress, 
  downloading, 
  showToast,
  api: passedApi
}) {
  const api = passedApi || bridgeApi
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

  const [refinedTranscript, setRefinedTranscript] = useState(null)
  const [isRefining, setIsRefining] = useState(false)
  const [scriptMode, setScriptMode] = useState('raw') // 'raw' | 'neural'

  const [isStreamStarted, setIsStreamStarted] = useState(false)

  const handlePlay = () => {
    setIsStreamStarted(true)
  }

  const handleRefine = async () => {
    if (!transcript || transcript.length === 0 || isRefining) return
    setIsRefining(true)
    try {
      const rawText = transcript.map(t => t.text.replace(/>>/g, '')).join(' ')
      const refined = await api.reconstructTranscript(rawText)
      setRefinedTranscript(refined)
      setScriptMode('neural')
      showToast('Neural Script Synthesized', 'success')
    } catch (err) {
      showToast('Reconstruction Anomaly', 'error')
    } finally {
      setIsRefining(false)
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
      const tr = (Array.isArray(transcript) ? transcript : []).map(t => t.text).join(' ').slice(0, 5000)
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
    <div className="flex-1 flex flex-col w-full bg-background transition-colors duration-500" onMouseUp={captureSelection} onDoubleClick={captureSelection}>
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
              className="px-3 py-1.5 bg-accent text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-2 hover:bg-white hover:text-black transition-all border border-accent/20"
            >
              <Sparkles className="h-3 w-3" /> {selection.text.split(' ').length > 4 ? 'Capture Data' : 'Log Word'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      <div className="flex flex-1 md:overflow-hidden overflow-y-auto md:flex-row flex-col max-w-[1700px] w-full mx-auto p-2 lg:p-3 gap-3 custom-scroll">
        {/* Left Side: Video & Transcript */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 md:overflow-y-auto custom-scroll">
          <div className="w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-border/10 relative group transition-colors duration-500">
            {isStreamStarted ? (
              <VideoPlayer videoId={video.id} onClose={() => setIsStreamStarted(false)} seekTo={seekTo} />
            ) : (
              <>
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                  <button 
                    onClick={handlePlay} 
                    className="h-16 w-16 bg-red-600/90 text-white rounded-full flex items-center justify-center hover:scale-105 hover:bg-red-600 transition-all shadow-lg group/btn"
                  >
                    <Play className="h-6 w-6 fill-white ml-1" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <h1 className="text-xl lg:text-2xl font-bold text-text leading-snug tracking-tight selection:bg-accent/30 select-text cursor-text">{video.title}</h1>
                <div className="flex items-center gap-3 select-text cursor-text">
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
                <div className="p-4 bg-surface-2/50 rounded-xl border border-border/10 select-text cursor-text hover:bg-surface-2 transition-colors duration-300">
                   <p className="text-xs text-muted leading-relaxed line-clamp-3">{video.description}</p>
                </div>
             )}
          </div>
        </div>

        {/* Right Side: 3 Tabs (Cards) - COMPACTED */}
        <div className="w-full md:w-[400px] lg:w-[480px] min-h-[500px] md:min-h-0 shrink-0 flex flex-col bg-surface rounded-xl border border-border/50 overflow-hidden transition-all duration-500">
          <div className="flex border-b border-border bg-surface-2 transition-colors duration-500">
            {[
              { id: 'learn', label: 'AI Tutor', icon: Sparkles },
              { id: 'chat', label: 'Research', icon: MessageCircle },
              { id: 'download', label: 'Download', icon: Download }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 transition-all relative ${activeTab === tab.id ? 'text-accent bg-surface-3' : 'text-muted/40 hover:text-text hover:bg-surface-3'}`}>
                <tab.icon className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'learn' && (
              <div className="absolute inset-0 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2">
                    <div className="flex items-center gap-4">
                       <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{scriptMode === 'neural' ? 'Neural Mode' : 'Raw Mode'}</p>
                       {transcript?.length > 0 && (
                          <button 
                            onClick={refinedTranscript ? () => setScriptMode(scriptMode === 'raw' ? 'neural' : 'raw') : handleRefine}
                            disabled={isRefining}
                            className={`p-1.5  transition-all border ${scriptMode === 'neural' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-surface border-border text-muted hover:text-text'}`}
                            title={refinedTranscript ? "Toggle Script Mode" : "Synthesize Neural Script"}
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
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent  text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                    >
                      <Library className="h-3.5 w-3.5" />
                      Save as Collection
                    </button>
                  </div>
                 
                 <div className="flex-1 overflow-y-auto p-8 scrollbar-thin bg-background">
                    <div className="max-w-prose mx-auto">
                      {loadingTranscript ? (
                        <div className="h-full flex flex-col items-center justify-center pt-20 text-accent gap-4">
                           <Loader2 className="h-10 w-10 animate-spin opacity-40" />
                           <p className="text-[10px] uppercase font-black tracking-[0.2em] animate-pulse">Generating Script...</p>
                        </div>
                      ) : transcript?.length ? (
                        <div className="text-[13px] text-text leading-[1.8] text-justify select-text space-y-4">
                           {scriptMode === 'neural' && refinedTranscript ? (
                              <div className="prose prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-6 select-text">
                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{refinedTranscript}</ReactMarkdown>
                              </div>
                           ) : (
                              <p>
                                {transcript.map((line, i) => {
                                  const isActive = curTime >= line.start && curTime < (line.start + (line.duration || 3000));
                                  const cleanText = line.text.replace(/>>/g, '').trim();
                                  if (!cleanText) return null;
                                  const isSentenceEnd = /[.!?]$/.test(cleanText);
                                  return (
                                    <span key={i}>
                                      <span 
                                        className={`inline mr-1.5 transition-all cursor-text rounded-sm ${isActive ? 'bg-accent/40 text-text font-bold px-0.5 shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]' : 'hover:bg-accent/10 hover:text-text'}`}
                                        onClick={() => setSeekTo(line.start / 1000)}
                                      >
                                        {cleanText}
                                      </span>
                                      {isSentenceEnd && <><br /><br /></>}
                                    </span>
                                  )
                                })}
                              </p>
                           )}
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
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3.5 text-[13px] leading-relaxed transition-all select-text cursor-text rounded-2xl ${
                        m.role === 'user' 
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-surface-3 border border-border/40 text-text rounded-tl-none'
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
                <div className="pt-4 border-t border-border/40 mt-4 flex gap-2">
                  <input value={chatInp} onChange={e => setChatInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about this video..." className="flex-1 bg-surface-2 border border-border/10 rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-accent/30 transition-all" disabled={isTyping} />
                  {isTyping ? (
                    <button onClick={handleStop} className="h-11 w-11 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0">
                      <StopCircle className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={sendMessage} className="h-11 w-11 bg-accent text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shrink-0 shadow-lg shadow-accent/20">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'download' && (
              <div className="absolute inset-0 overflow-y-auto p-6 space-y-6 text-text">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-[9px] text-muted font-black uppercase tracking-[0.2em]">Quality Profile</h3>
                    <div className="relative group">
                      <select 
                        value={quality} 
                        onChange={(e) => onQualityChange(e.target.value)}
                        className="w-full bg-surface-3 border border-border px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text outline-none appearance-none cursor-pointer focus:border-accent/40"
                      >
                        <option value="" disabled>Select Resolution</option>
                        {video.qualityOptions?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                         <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-text" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-[9px] text-muted font-black uppercase tracking-[0.2em]">Destination</h3>
                    <button onClick={onPickPath} className="text-[8px] text-accent uppercase font-black tracking-widest hover:text-text transition-colors">Change</button>
                  </div>
                  <div className="p-3 bg-surface-3 border border-border flex items-center justify-between text-[10px] text-muted ">
                    <span className="truncate pr-4">{savePath || 'Select Folder'}</span>
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted/40" />
                  </div>
                </div>

                <div className="pt-2">
                  {downloading ? (
                    <div className="space-y-3 bg-surface-2 p-4 border border-border ">
                      <div className="flex justify-between text-[9px] font-black text-accent uppercase tracking-[0.2em]">
                        <span>System Acquisition</span>
                        <span>{Math.round(progress?.percent || 0)}%</span>
                      </div>
                      <div className="h-1 bg-surface-3  overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress?.percent || 0}%` }} className="h-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                      </div>
                      <button onClick={onCancel} className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all ">Abort Acquisition</button>
                    </div>
                  ) : (
                    <button onClick={onDownload} disabled={!quality || !savePath}
                      className="w-full py-3.5 bg-accent text-white font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl disabled:opacity-30 ">
                      <Download className="h-3 w-3 inline mr-2" /> Initialize Download
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
