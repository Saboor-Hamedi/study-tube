import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Library, FileText, Sparkles, Brain, ListChecks, Loader2, Quote, Languages, Star, RefreshCcw, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const CardReaderModal = ({ isOpen, item, onClose, showToast, api, onUpdate, collections = [] }) => {
  const [summary, setSummary] = useState(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [isHighlighting, setIsHighlighting] = useState(false)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const [titleEditVal, setTitleEditVal] = useState('')

  if (!isOpen || !item) return null

  const isCollection = item.type === 'Collection'
  
  const startEditing = () => {
    setEditVal(item.definition)
    setTitleEditVal(item.text)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    onUpdate({ ...item, text: titleEditVal, definition: editVal })
    setIsEditing(false)
    showToast('Changes saved to archive')
  }
  
  const handleGenerateSummary = async () => {
    if (isSummarizing) return
    setIsSummarizing(true)
    try {
      const content = isCollection ? item.definition : `${item.text}: ${item.definition}. Examples: ${item.examples?.join(', ')}`
      const prompt = `Analyze this vocabulary entry and provide 5 deep academic insights. 
      STRICT RULE: PLAIN TEXT ONLY. NO MARKDOWN. NO BOLDING (**). 
      DO NOT say "Of course", "Here is", or "Based on". Just give the facts.
      Entry: ${content.slice(0, 10000)}` 
      
      let response = await api.chatWithAI({ 
        messages: [{ role: 'user', content: prompt }] 
      })

      // Forced cleanup of markdown and conversational fluff
      response = response.replace(/[#*`~_]/g, '') // Remove #, *, `, ~, _
                         .replace(/^(Of course|Sure|Here is|Based on|I have analyzed|Certainly|Alright|Heres|Here are).+?(:|\.)/i, '')
                         .trim()
      
      setSummary(response)
    } catch (e) {
      showToast('Research analysis failed', 'error')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleIdentifyVocab = async () => {
    if (!isCollection || isHighlighting) return
    setIsHighlighting(true)
    try {
      const prompt = `Identify 5-8 highly advanced, academic, or "native-level" words/phrases from the following script. 
      Return ONLY a list of the words separated by commas. No other text.
      Script: ${item.definition.slice(0, 5000)}`
      
      const response = await api.chatWithAI({ 
        messages: [{ role: 'user', content: prompt }] 
      })
      
      const words = response.split(',').map(w => w.trim().toLowerCase()).filter(Boolean)
      setHighlights(words)
      showToast(`identified ${words.length} advanced concepts`)
    } catch (e) {
      showToast('Vocabulary identification failed', 'error')
    } finally {
      setIsHighlighting(false)
    }
  }

  const toggleHighlight = (word) => {
    const normalized = word.toLowerCase()
    setHighlights(prev => 
      prev.includes(normalized) 
        ? prev.filter(h => h !== normalized) 
        : [...prev, normalized]
    )
  }

  // Highlight words in script text
  const renderScript = (text) => {
    if (!highlights.length) return text
    
    const regex = new RegExp(`\\b(${highlights.join('|')})\\b`, 'gi')
    const parts = text.split(regex)

    return (
      <span>
        {parts.map((part, i) => {
          const isMatch = highlights.some(h => h.toLowerCase() === part.toLowerCase())
          return isMatch ? (
            <span 
              key={i} 
              onClick={() => toggleHighlight(part)}
              className="text-accent font-black cursor-pointer hover:underline decoration-accent/30 transition-all"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        })}
      </span>
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/95 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-6xl h-full bg-[#080808] border border-white/10 rounded-[5px] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-40">
             <div className="flex items-center gap-4">
               <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Library className="h-3.5 w-3.5 text-accent" />
               </div>
               <div className="flex items-baseline gap-3">
                 <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] line-clamp-1">Insight Analysis</h2>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button 
                    onClick={startEditing}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-all shadow-lg"
                    title="Edit Information"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-white/5 text-muted hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button 
                  onClick={() => {
                    const textToCopy = isCollection ? item.definition : `${item.text}\n${item.definition}`
                    navigator.clipboard.writeText(textToCopy)
                    showToast('Copied to clipboard')
                  }}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white hover:text-black transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Copy
                </button>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button onClick={onClose} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted transition-all rounded-lg">
                  <X className="h-4 w-4" />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 overflow-y-auto p-12 lg:p-20 scrollbar-thin bg-black/40">
                 <div className="max-w-2xl mx-auto space-y-12">
                   
                   {!isCollection && (
                      <div className="space-y-8">
                         <div className="space-y-2">
                                                         {isEditing ? (
                               <input 
                                 value={titleEditVal}
                                 onChange={e => setTitleEditVal(e.target.value)}
                                 className="w-full bg-accent/[0.05] border-b-2 border-accent text-3xl font-black text-white outline-none py-2 mb-8"
                                 placeholder="Entry Title"
                               />
                             ) : (
                               <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-8 select-text">{item.text}</h1>
                             )}

                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Definition</p>
                            {isEditing ? (
                              <textarea
                                value={editVal}
                                onChange={e => setEditVal(e.target.value)}
                                className="w-full bg-accent/[0.03] border border-accent/20 rounded-xl p-4 text-xl text-white font-light leading-relaxed focus:border-accent outline-none min-h-[120px] scrollbar-thin resize-none"
                                autoFocus
                              />
                            ) : (
                              <div className="prose prose-invert prose-2xl max-w-none prose-p:leading-relaxed prose-strong:text-accent prose-strong:font-black select-text">
                                <ReactMarkdown>
                                  {item.definition}
                                </ReactMarkdown>
                              </div>
                            )}
                         </div>
                         
                         {item.examples?.length > 0 && !isEditing && (
                           <div className="space-y-4 pt-4 border-t border-white/5">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Example Usage</p>
                             <div className="grid gap-4">
                               {item.examples.map((ex, i) => (
                                 <div key={i} className="flex gap-4 group">
                                   <Quote className="h-4 w-4 text-accent/20 shrink-0 mt-1" />
                                   <p className="text-[16px] text-white/60  leading-relaxed select-text">{ex}</p>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {!isEditing && (
                           <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                              {item.synonyms && (
                                 <div className="space-y-2">
                                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Synonyms</p>
                                   <p className="text-sm text-white/40  select-text">{item.synonyms}</p>
                                 </div>
                              )}
                              {item.grammar && (
                                 <div className="space-y-2">
                                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Grammar</p>
                                   <p className="text-sm text-white/40  select-text">{item.grammar}</p>
                                 </div>
                              )}
                           </div>
                         )}
                      </div>
                   )}

                   {isCollection && (
                     <div className="w-full">
                       {isEditing ? (
                         <textarea
                           value={editVal}
                           onChange={e => setEditVal(e.target.value)}
                           className="w-full bg-accent/[0.03] border border-accent/20 rounded-xl p-8 text-[18px] text-white/80 leading-[2.1] text-justify select-text lowercase font-light tracking-wide focus:border-accent outline-none min-h-[400px] scrollbar-thin resize-none"
                           autoFocus
                         />
                       ) : (
                         <div className="prose prose-invert prose-lg max-w-none prose-p:leading-[2.1] prose-strong:text-accent prose-strong:font-black select-text font-light tracking-wide">
                            <ReactMarkdown>
                              {item.definition}
                            </ReactMarkdown>
                         </div>
                       )}
                     </div>
                   )}

                   {(summary || item.summary) && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-accent/5 border border-accent/20 rounded-[20px] space-y-6 relative group/analysis">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Brain className="h-5 w-5 text-accent" />
                              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">AI Research Analysis</h3>
                           </div>
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(item.summary || summary)
                                  showToast('Analysis copied to clipboard')
                                }}
                                className="px-3 py-1 bg-white/5 text-muted hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                              >
                                Copy
                              </button>
                              {!item.summary && summary && (
                                <button 
                                  onClick={() => {
                                    onUpdate({ ...item, summary: summary })
                                    showToast('Analysis saved to archive')
                                  }}
                                  className="px-3 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-black transition-all"
                                >
                                  Save Archive
                                </button>
                              )}
                           </div>
                        </div>
                        <div className="text-[14px] text-white/80 leading-relaxed lowercase space-y-4 font-medium select-text cursor-text">
                           {(item.summary || summary).split('\n').filter(l => l.trim()).map((line, i) => (
                             <div key={i} className="flex gap-4">
                               <span className="text-accent opacity-40 font-black">•</span>
                               <p>{line.replace(/^[•\-\d\.]+\s*/, '')}</p>
                             </div>
                           ))}
                        </div>
                     </motion.div>
                   )}
                 </div>
              </div>

              <div className="w-80 border-l border-white/5 bg-[#0a0a0a] flex flex-col p-6 space-y-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Intelligence tools</p>
                    <button onClick={handleGenerateSummary} disabled={isSummarizing} className="w-full p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-center gap-3 group hover:bg-accent hover:border-accent transition-all disabled:opacity-50">
                      {isSummarizing ? <Loader2 className="h-4 w-4 text-accent group-hover:text-white animate-spin" /> : (summary || item.summary ? <RefreshCcw className="h-4 w-4 text-accent group-hover:text-white" /> : <Sparkles className="h-4 w-4 text-accent group-hover:text-white" />)}
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-white uppercase tracking-widest">{summary || item.summary ? 'Regenerate' : 'Deep Research'}</p>
                        <p className="text-[9px] text-accent group-hover:text-white/60 uppercase">{summary || item.summary ? 'Get fresh insights' : 'Extract key insights'}</p>
                      </div>
                    </button>
                    
                    {isCollection && (
                      <div className="flex flex-col gap-2">
                        <button onClick={handleIdentifyVocab} disabled={isHighlighting} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 group hover:bg-white/10 transition-all disabled:opacity-50">
                          {isHighlighting ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : <ListChecks className="h-4 w-4 text-white" />}
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-white uppercase tracking-widest">Heatmap</p>
                            <p className="text-[9px] text-white/40 uppercase">Find native words</p>
                          </div>
                        </button>
                        
                        {highlights.length > 0 && (
                          <button 
                            onClick={() => setHighlights([])} 
                            className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-muted hover:text-red-400 transition-all"
                          >
                            Reset Heatmap
                          </button>
                        )}
                      </div>
                    )}

                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted">Linguistic level</p>
                          <p className="text-lg font-black text-white px-2 mt-1 border-l-2 border-accent">B2-C1</p>
                       </div>
                       <Star className="h-4 w-4 text-accent opacity-40" />
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">File to Archive</p>
                      
                      <div className="flex flex-wrap gap-2">
                         <button 
                           onClick={() => {
                             onUpdate({ ...item, collection: '' })
                             showToast('Moved to Unorganized')
                           }}
                           className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${!item.collection ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-muted hover:border-white/10 hover:text-white'}`}
                         >
                           Unorganized
                         </button>

                         {collections.map(c => (
                           <button 
                            key={c}
                            onClick={() => {
                              onUpdate({ ...item, collection: c })
                              showToast(`Moved to ${c}`)
                            }}
                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${item.collection === c ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-transparent border-white/5 text-muted hover:border-white/10 hover:text-white'}`}
                           >
                            {c}
                           </button>
                         ))}
                      </div>
                    </div>
                 </div>
                 <div className="flex-1" />
              </div>
          </div>

          <div className="px-10 py-6 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-center">
             <p className="text-[10px] text-muted font-bold uppercase tracking-[0.3em]">Institutional Research Archive — studyTube</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CardReaderModal
