import { useState, useRef, useMemo, memo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Library, FileText, Sparkles, Brain, ListChecks, Loader2, Star, RefreshCcw, Maximize2, Minimize2, X, Pencil, Quote, Copy, AlertCircle } from 'lucide-react'
import ModalCommandHeader from './ModalCommandHeader'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const neuralComponents = {
  ol: ({node, ...props}) => <ol className="list-decimal pl-10 space-y-4 my-8 text-accent marker:text-accent marker:font-black" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc pl-10 space-y-4 my-8 text-accent marker:text-accent" {...props} />,
  li: ({node, ...props}) => <li className="text-text leading-[1.8] pl-2 font-extralight" {...props} />,
  p: ({node, ...props}) => <p className="mb-6 last:mb-0 text-text leading-[1.8] font-extralight" {...props} />,
  strong: ({node, ...props}) => <strong className="text-accent font-bold tracking-tight px-0.5 border-b border-accent/20 drop-shadow-[0_0_2px_rgba(var(--accent-rgb),0.4)]" {...props} />,
  em: ({node, ...props}) => <em className="text-muted italic" {...props} />
}

// Memoized Content Area for high-precision performance
const ContentArea = memo(({ item, isEditing, titleEditVal, setTitleEditVal, editVal, setEditVal, highlights, renderContentWithHeatmap, isMaximized }) => {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-surface transition-all duration-500 ${isMaximized ? 'rounded-none' : 'rounded-l-[5px]'}`}>
      
      {/* Locked Title Hub (Aligned with Sidebar Header) */}
      <div className={`w-full h-[72px] shrink-0 border-b border-border/10 flex items-center px-6 lg:px-12`}>
        {isEditing ? (
          <input 
            value={titleEditVal}
            onChange={e => setTitleEditVal(e.target.value)}
            className="w-full bg-transparent text-[20px] font-black tracking-normal text-text outline-none py-0 transition-all "
            placeholder="Subject name..."
            autoFocus
          />
        ) : (
          <h1 className="text-[20px] font-black text-text tracking-normal leading-tight select-text">{item.text}</h1>
        )}
      </div>

      {/* Independent Scroll Content Stream */}
      <div className={`flex-1 overflow-y-auto scrollbar-thin px-6 lg:px-12 py-8`}>
        <div className="mx-auto w-full">
          {isEditing ? (
            <textarea
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              className="w-full h-full min-h-[400px] bg-transparent border-none text-[16px] text-text leading-[1.8] font-extralight tracking-wide outline-none resize-none transition-all selection:bg-accent/40 "
              placeholder="Initialize neural drafting..."
            />
          ) : (
            <div className="prose max-w-none 
                prose-h1:text-2xl prose-h1:font-black prose-h1:text-text prose-h1:mb-6 prose-h1:tracking-tight
                prose-h2:text-xl prose-h2:font-black prose-h2:text-text prose-h2:mb-4 prose-h2:border-l-2 prose-h2:border-accent prose-h2:pl-4
                prose-h3:text-lg prose-h3:font-bold prose-h3:text-accent prose-h3:mb-3 prose-h3:uppercase prose-h3:tracking-widest
                prose-p:text-[16px] prose-p:leading-[1.8] prose-p:text-text prose-p:mb-6
                prose-strong:text-accent prose-strong:font-black prose-strong:bg-accent/5 prose-strong:px-1
                prose-ol:list-decimal prose-ol:pl-8 prose-ol:space-y-4 prose-ol:text-accent
                prose-ul:list-disc prose-ul:pl-8 prose-ul:space-y-4 prose-ul:text-accent
                prose-li:text-text prose-li:leading-relaxed prose-li:pl-2
                selection:bg-accent/40 select-text font-extralight tracking-wide color-[var(--text)]">
               {highlights.length > 0 ? renderContentWithHeatmap(item.definition) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={neuralComponents}
                  >
                    {item.definition?.includes('\n') || /^(\d+\.|\s*[-*•])\s/m.test(item.definition || '')
                      ? item.definition 
                      : (item.definition || '')
                         .split(/(?<=[.!?])\s+(?=[A-Z])/)
                         .join('\n\n')}
                  </ReactMarkdown>
               )}
            </div>
          )}
          
          {/* Synthesis Abstract (Positioned at bottom of scroll stream) */}
          {item.summary && !isEditing && (
            <div className="mt-12 p-8 bg-accent/5 border border-border space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 select-text cursor-text ">
               <div className="flex items-center gap-2 text-accent select-none">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">Final Neural Synthesis</span>
               </div>
               <div className="text-[15px] text-muted leading-relaxed font-light space-y-3 prose-p:mb-2 select-text cursor-text">
                  {item.summary.split('\n').map((l, i) => (
                    <p key={i} className="flex gap-4 select-text cursor-text text-text">
                      <span className="text-accent/30 font-black flex-shrink-0 select-none">/</span>
                      {l.replace(/^[•\-\d\.]+\s*/, '')}
                    </p>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

const CardReaderModal = ({ isOpen, item, onClose, showToast, api, onUpdate, collections = [] }) => {
  const [summary, setSummary] = useState(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const [titleEditVal, setTitleEditVal] = useState('')
  const [isMaximized, setIsMaximized] = useState(() => {
    return localStorage.getItem('studytube_reader_maximized') !== 'false' // Default to true as before
  })

  const [isHydrated, setIsHydrated] = useState(false)

  // Persistence Protocol
  useEffect(() => {
    localStorage.setItem('studytube_reader_maximized', isMaximized)
  }, [isMaximized])

  // Hydration Protocol: Prevents main-thread freeze on mount
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsHydrated(true), 150)
      return () => clearTimeout(timer)
    } else {
      setIsHydrated(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && item) {
      setEditVal(item.definition || '')
      setTitleEditVal(item.text || '')
      setSummary(item.summary || null)
      setHighlights([])
    }
  }, [isOpen, item])

  // Escape Protocol
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen || !item) return null

  /**
   * Buffer Transition: Initializes the research node for manual editing.
   */
  const startEditing = () => {
    setEditVal(item.definition || '')
    setTitleEditVal(item.text || '')
    setIsEditing(true)
  }

  /**
   * Archive Modification: Persists manual edits back to the neural stack.
   */
  const handleSaveEdit = async () => {
    await onUpdate({ ...item, text: titleEditVal, definition: editVal })
    setIsEditing(false)
    showToast('Archive Permanently Updated')
  }
  
  /**
   * Synthesis Abstract: Generates an AI-powered summary of the research content.
   */
  const handleGenerateSummary = async () => {
    if (isSummarizing) return
    setIsSummarizing(true)
    
    // Shield Logic: Timeout Promise
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timed Out')), 45000))

    try {
      const chatPromise = api.chatWithAI({ 
        messages: [{ role: 'user', content: `Summarize in 5 bullet points (No markdown/bold): ${editVal.slice(0, 8000)}` }] 
      })
      
      const response = await Promise.race([chatPromise, timeout])
      const cleaned = response.replace(/[#*`~_]/g, '').replace(/^(Sure|Of course|Here is).+?(:|\.)/i, '').trim()
      
      setSummary(cleaned)
      onUpdate({ ...item, summary: cleaned }) // Auto-sync to persistence
    } catch (e) {
      showToast(e.message === 'AI Request Timed Out' ? 'Synthesis Time Out' : 'Synthesis Interrupted', 'error')
    } finally {
      setIsSummarizing(false)
    }
  }

  /**
   * Heatmap Construction: Identifies high-level vocabulary through neural analysis.
   */
  const handleIdentifyVocab = async () => {
    if (isHighlighting) return
    setIsHighlighting(true)
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Heatmap Timed Out')), 30000))

    try {
      const respPromise = api.chatWithAI({ messages: [{ role: 'user', content: `List 8 high-level words from text (comma separated): ${editVal.slice(0, 5000)}` }] })
      const resp = await Promise.race([respPromise, timeout])
      
      const words = resp.split(',').map(w => w.trim().toLowerCase()).filter(w => w && w.length > 2)
      setHighlights(words)
      showToast('Heatmap construction complete')
    } catch (e) {
      showToast('Heatmap Construction Interrupted', 'error')
    } finally {
      setIsHighlighting(false)
    }
  }

  /**
   * Lexical Visualization: Dynamically wraps identified terminology in the research content.
   */
  const renderContentWithHeatmap = useCallback((text) => {
    if (!highlights.length) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>
          {text}
        </ReactMarkdown>
      )
    }
    
    // Hardened Regex: Escape special characters in highlights
    const safeHighlights = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`\\b(${safeHighlights.join('|')})\\b`, 'gi')
    
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>
        {text.split(regex).map(p => highlights.includes(p.toLowerCase()) ? `**${p}**` : p).join('')}
      </ReactMarkdown>
    )
  }, [highlights]);

  const industrialTransition = { type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-500 ${isMaximized ? 'p-0' : 'p-0 lg:p-8'}`}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md px-4" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 1, y: 0 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 1, y: 0 }} 
          transition={{ duration: 0.08, ease: "linear" }}
          style={{ borderRadius: isMaximized ? 0 : 5 }}
          className={`relative h-[88vh] bg-surface border border-border shadow-2xl shadow-black/80 overflow-hidden flex flex-row ${isMaximized ? 'h-full w-full max-w-full' : 'w-[92vw] max-w-7xl'}`}
        >
          {!isHydrated ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-surface transition-all duration-500">
               <div className="flex items-center gap-3 opacity-20">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Synchronizing Neural Workspace...</span>
               </div>
            </div>
          ) : (
            <>
              <ContentArea 
                item={item} isEditing={isEditing} isMaximized={isMaximized}
                titleEditVal={titleEditVal} setTitleEditVal={setTitleEditVal}
                editVal={editVal} setEditVal={setEditVal}
                highlights={highlights} renderContentWithHeatmap={renderContentWithHeatmap}
              />

              {/* Industrial Command Sidebar */}
              <div className={`w-[280px] shrink-0 border-l border-border bg-surface-2 flex flex-col relative z-50 overflow-y-auto scrollbar-thin ${isMaximized ? 'rounded-none' : 'rounded-r-[5px]'}`}>
                
                <ModalCommandHeader 
                  title="Hub-Zero" 
                  subtitle="Archive" 
                  Icon={Library} 
                  onClose={onClose} 
                  onMaximize={() => setIsMaximized(!isMaximized)}
                  isMaximized={isMaximized}
                />
                
                <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pt-8 pb-10 space-y-10">
                  {/* Action Interface */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted/40 px-1 flex items-center gap-2">
                       <Star className="h-3.5 w-3.5" /> Document Actions
                    </p>
                    <div className="flex flex-col gap-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <button onClick={handleSaveEdit} className="w-full py-4 bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 border border-blue-400/20 rounded-[5px]">Commit Changes</button>
                            <button onClick={() => setIsEditing(false)} className="w-full py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all rounded-[5px] border border-red-500/20">Abort Edit</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={startEditing} className="flex-1 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group rounded-[5px] shadow-lg shadow-accent/10">
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${item.text}\n\n${item.definition}`)
                                showToast('Copied')
                              }}
                              className="flex-1 py-3 bg-surface-3 border border-border text-text text-[10px] font-black uppercase tracking-widest hover:bg-text hover:text-background transition-all flex items-center justify-center gap-2 rounded-[5px]"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </button>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="h-px bg-border/50 mx-2" />

                  {/* Logic Core */}
                  <div className="space-y-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/30 px-1 flex items-center gap-2">
                        <Brain className="h-3 w-3" /> Logic
                    </p>
                    <div className="space-y-3">
                        <button onClick={handleGenerateSummary} disabled={isSummarizing} className="w-full p-4 bg-accent/5 border border-accent/20 flex items-center gap-4 group hover:bg-accent transition-all disabled:opacity-50 text-left relative rounded-[5px]">
                          {isSummarizing ? <Loader2 className="h-4 w-4 text-accent animate-spin" /> : <Sparkles className="h-4 w-4 text-accent group-hover:text-white" />}
                          <div>
                            <p className="text-[10px] font-black text-text uppercase tracking-widest group-hover:text-white">Synthesis</p>
                            <p className="text-[8px] text-accent group-hover:text-white/60 uppercase">Deep Insight</p>
                          </div>
                        </button>

                        <div className="flex gap-2">
                          <button onClick={handleIdentifyVocab} disabled={isHighlighting} className="flex-1 p-4 bg-surface-2 border border-border flex items-center gap-4 group hover:bg-surface-3 transition-all disabled:opacity-50 text-left rounded-[5px]">
                            {isHighlighting ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : <ListChecks className="h-4 w-4 text-text" />}
                            <div>
                              <p className="text-[10px] font-black text-text uppercase tracking-widest">Heatmap</p>
                              <p className="text-[9px] text-muted uppercase">Identify</p>
                            </div>
                          </button>
                          {highlights.length > 0 && (
                            <button 
                              onClick={() => { setHighlights([]); showToast('Heatmap Deactivated') }}
                              className="px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/10 rounded-[5px]"
                              title="Clear Highlights"
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default memo(CardReaderModal)
