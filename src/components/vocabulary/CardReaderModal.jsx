import { useState, useRef, useMemo, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Library, FileText, Sparkles, Brain, ListChecks, Loader2, Quote, Star, RefreshCcw, Pencil, Maximize2, Minimize2, Copy, AlertCircle } from 'lucide-react'
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
    <div className={`flex-1 overflow-y-auto scrollbar-thin bg-surface transition-all duration-500 ${isMaximized ? 'p-10 lg:p-20' : 'p-6 lg:p-12'}`}>
      <div className={`mx-auto space-y-10 transition-all ${isMaximized ? 'max-w-4xl' : 'max-w-2xl'}`}>
        
        {/* Title Hub */}
        <div className="pb-8 border-b border-border group/title">
          {isEditing ? (
            <input 
              value={titleEditVal}
              onChange={e => setTitleEditVal(e.target.value)}
              className="w-full bg-accent/5 border-b-2 border-accent text-[18px] font-black text-text outline-none py-2 transition-all "
              placeholder="Designate research title..."
              autoFocus
            />
          ) : (
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/40 opacity-0 group-hover/title:opacity-100 transition-opacity">Record ID: {item.date?.slice(0,8)}</span>
              <h1 className="text-[18px] font-black text-text tracking-tight leading-none select-text">{item.text}</h1>
            </div>
          )}
        </div>

        {/* Neural Content Stream */}
        <div className="space-y-10">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                 <FileText className="h-3 w-3" /> Analysis Stream
              </p>
              {isEditing && <span className="text-[9px] font-bold text-muted/30 uppercase tracking-widest">Markdown Supported</span>}
            </div>

            {isEditing ? (
              <textarea
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                className="w-full bg-surface-2 border border-border p-8 lg:p-12 text-[16px] text-text leading-[1.8] font-extralight tracking-wide focus:border-accent/40 outline-none min-h-[600px] scrollbar-thin resize-none shadow-inner transition-all selection:bg-accent/40 "
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
          </div>

          {/* Synthesis Abstract (Positioned at bottom) */}
          {item.summary && (
            <div className="p-8 bg-accent/5 border border-border space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 select-text cursor-text ">
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
  const [isMaximized, setIsMaximized] = useState(true)

  useEffect(() => {
    if (isOpen && item) {
      setEditVal(item.definition || '')
      setTitleEditVal(item.text || '')
      setSummary(item.summary || null)
      setHighlights([])
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

  const startEditing = () => {
    setEditVal(item.definition || '')
    setTitleEditVal(item.text || '')
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    onUpdate({ ...item, text: titleEditVal, definition: editVal })
    setIsEditing(false)
    showToast('Archive Permanently Updated')
  }
  
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

  const renderContentWithHeatmap = (text) => {
    if (!highlights.length) return <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>{text}</ReactMarkdown>
    
    // Hardened Regex: Escape special characters in highlights
    const safeHighlights = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`\\b(${safeHighlights.join('|')})\\b`, 'gi')
    
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>
        {text.split(regex).map(p => highlights.includes(p.toLowerCase()) ? `**${p}**` : p).join('')}
      </ReactMarkdown>
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.98, y: 40 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.98, y: 40 }} 
          className={`relative h-full bg-surface border border-border shadow-2xl shadow-black/80 overflow-hidden flex flex-row transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMaximized ? 'w-full max-w-full rounded-none' : 'w-full max-w-7xl '}`}
        >
          
          <ContentArea 
             item={item} isEditing={isEditing} isMaximized={isMaximized}
             titleEditVal={titleEditVal} setTitleEditVal={setTitleEditVal}
             editVal={editVal} setEditVal={setEditVal}
             highlights={highlights} renderContentWithHeatmap={renderContentWithHeatmap}
          />

          {/* Industrial Command Sidebar */}
          <div className="w-[280px] shrink-0 border-l border-border bg-surface-2 flex flex-col p-6 space-y-8 relative z-50 shadow-[ -20px_0_40px_rgba(0,0,0,0.4)] overflow-y-auto scrollbar-thin">
             
             {/* Master Controls (Compact) */}
             <div className="flex items-center justify-between pb-5 border-b border-border">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-accent/10 border border-accent/20 ">
                      <Library className="h-4 w-4 text-accent" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text">Hub-Zero</span>
                      <span className="text-[7px] font-bold uppercase tracking-widest text-muted/30">Archive</span>
                   </div>
                </div>
                <div className="flex items-center gap-1.5">
                   <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 bg-surface-2 hover:bg-accent hover:text-white text-muted transition-all border border-border ">
                    {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                   </button>
                   <button onClick={onClose} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/10 ">
                    <X className="h-3.5 w-3.5" />
                   </button>
                </div>
             </div>

             {/* Action Interface */}
             <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/30 px-1 flex items-center gap-2">
                   <Star className="h-3 w-3" /> Actions
                </p>
                <div className="flex flex-col gap-2">
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button onClick={handleSaveEdit} className="flex-1 py-3 bg-accent text-white  text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 border border-blue-400/20">Commit</button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-3 bg-surface-2 text-muted hover:bg-surface-3 hover:text-text  text-[10px] font-black uppercase tracking-widest transition-all">Abort</button>
                      </div>
                    ) : (
                      <button onClick={startEditing} className="w-full py-3 bg-surface-2 border border-border text-text text-[10px] font-black uppercase tracking-widest hover:bg-text hover:text-background transition-all flex items-center justify-center gap-2 group ">
                        <Pencil className="h-3.5 w-3.5 text-accent group-hover:text-background" /> Edit
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${item.text}\n\n${item.definition}`)
                        showToast('Copied')
                      }}
                      className="w-full py-3 bg-surface-2 border border-border text-muted/50 text-[10px] font-black uppercase tracking-widest hover:bg-surface-3 hover:text-text transition-all flex items-center justify-center gap-2 "
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                </div>
             </div>

             {/* Logic Core */}
             <div className="space-y-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/30 px-1 flex items-center gap-2">
                   <Brain className="h-3 w-3" /> Logic
                </p>
                <div className="space-y-3">
                   <button onClick={handleGenerateSummary} disabled={isSummarizing} className="w-full p-4 bg-accent/5 border border-accent/20 flex items-center gap-4 group hover:bg-accent transition-all disabled:opacity-50 text-left relative ">
                     {isSummarizing ? <Loader2 className="h-4 w-4 text-accent animate-spin" /> : <Sparkles className="h-4 w-4 text-accent group-hover:text-white" />}
                     <div>
                       <p className="text-[10px] font-black text-text uppercase tracking-widest group-hover:text-white">Synthesis</p>
                       <p className="text-[8px] text-accent group-hover:text-white/60 uppercase">Deep Insight</p>
                     </div>
                   </button>

                   <button onClick={handleIdentifyVocab} disabled={isHighlighting} className="w-full p-4 bg-surface-2 border border-border flex items-center gap-4 group hover:bg-surface-3 transition-all disabled:opacity-50 text-left ">
                     {isHighlighting ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : <ListChecks className="h-4 w-4 text-text" />}
                     <div>
                       <p className="text-[10px] font-black text-text uppercase tracking-widest">Heatmap</p>
                       <p className="text-[9px] text-muted uppercase">Identify</p>
                     </div>
                   </button>
                </div>
             </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CardReaderModal
