import { useState, useRef, useMemo, memo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Library, FileText, Sparkles, Brain, ListChecks, Loader2, Star, RefreshCcw, Maximize2, Minimize2, X, Pencil, Quote, Copy, AlertCircle, ExternalLink } from 'lucide-react'
import ModalCommandHeader from './ModalCommandHeader'
import AnalyticalSidebar from './AnalyticalSidebar'
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
const ContentArea = memo(({ item, isEditing, titleEditVal, setTitleEditVal, editVal, setEditVal, highlights, renderContentWithHeatmap, isMaximized, summary, stats }) => {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-surface transition-all duration-500 ${isMaximized ? 'rounded-none' : 'rounded-l-[5px]'}`}>
      
      {/* Locked Title Hub (Aligned with Sidebar Header) */}
      <div className={`w-full h-[72px] shrink-0 border-b border-border/10 flex items-center px-6 lg:px-12 justify-between`}>
        <div className="flex flex-col gap-0.5">
          {isEditing ? (
            <input 
              value={titleEditVal}
              onChange={e => setTitleEditVal(e.target.value)}
              className="w-full bg-transparent text-[18px] font-black tracking-normal text-text outline-none py-0 transition-all "
              placeholder="Subject name..."
              autoFocus
            />
          ) : (
            <h1 className="text-[18px] font-black text-text tracking-normal leading-tight select-text">{titleEditVal}</h1>
          )}
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-muted/40 font-mono tracking-tighter uppercase">{new Date(item.date).toLocaleDateString()}</span>
             <span className="text-[9px] text-accent/40 font-black uppercase tracking-[0.2em]">{stats.charCount} chars • {stats.readTime}m read</span>
          </div>
        </div>
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
               {highlights.length > 0 ? renderContentWithHeatmap(editVal) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={neuralComponents}
                  >
                    {editVal?.includes('\n') || /^(\d+\.|\s*[-*•])\s/m.test(editVal || '')
                      ? editVal 
                      : (editVal || '')
                         .split(/(?<=[.!?])\s+(?=[A-Z])/)
                         .join('\n\n')}
                  </ReactMarkdown>
               )}
            </div>
          )}
          
          {/* Synthesis Abstract (Positioned at bottom of scroll stream) */}
          {summary && !isEditing && (
            <div className="mt-12 p-8 bg-accent/5 border border-border space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 select-text cursor-text rounded-[5px]">
               <div className="flex items-center gap-2 text-accent select-none">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">Final Neural Synthesis</span>
               </div>
               <div className="text-[15px] text-muted leading-relaxed font-light space-y-3 prose-p:mb-2 select-text cursor-text">
                  {summary.split('\n').map((l, i) => (
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

const CardReaderModal = ({ isOpen, item, onClose, showToast, api, onUpdate, collections = [], onExpand }) => {
  const [summary, setSummary] = useState(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const [titleEditVal, setTitleEditVal] = useState('')
  const [isMaximized, setIsMaximized] = useState(() => {
    return localStorage.getItem('writella_reader_maximized') !== 'false' // Default to true as before
  })

  const stats = useMemo(() => {
    const text = editVal || item?.definition || "";
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    return { charCount, wordCount, readTime };
  }, [editVal, item?.definition]);

  const [isHydrated, setIsHydrated] = useState(false)

  // Persistence Protocol
  useEffect(() => {
    localStorage.setItem('writella_reader_maximized', isMaximized)
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
  const handleSaveEdit = () => {
    const updated = { ...item, text: titleEditVal, definition: editVal, summary };
    onUpdate(updated);
    setIsEditing(false);
    showToast('Archive Permanently Updated');
  }
  }
  
  /**
   * Synthesis Abstract: Generates an AI-powered summary of the research content.
   */
  const handleGenerateSummary = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    
    // Shield Logic: Timeout Promise
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timed Out')), 45000));

    try {
      const chatPromise = api.chatWithAI({ 
        messages: [{ role: 'user', content: `Summarize in 5 bullet points (No markdown/bold): ${editVal.slice(0, 8000)}` }] 
      });
      
      const response = await Promise.race([chatPromise, timeout]);
      const cleaned = response.replace(/[#*`~_]/g, '').replace(/^(Sure|Of course|Here is).+?(:|\.)/i, '').trim();
      
      setSummary(cleaned);
      onUpdate({ ...item, text: titleEditVal, definition: editVal, summary: cleaned }); // Auto-sync to persistence
      showToast('Synthesis Synchronized');
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
                summary={summary} stats={stats}
              />

              <AnalyticalSidebar 
                mode="modal"
                item={item}
                isEditing={isEditing}
                isSummarizing={isSummarizing}
                isHighlighting={isHighlighting}
                highlights={highlights}
                setHighlights={setHighlights}
                handleSaveEdit={handleSaveEdit}
                setIsEditing={setIsEditing}
                handleGenerateSummary={handleGenerateSummary}
                handleIdentifyVocab={handleIdentifyVocab}
                showToast={showToast}
                onExpand={onExpand}
                onClose={onClose}
                isMaximized={isMaximized}
                onMaximize={() => setIsMaximized(!isMaximized)}
              />
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default memo(CardReaderModal)
