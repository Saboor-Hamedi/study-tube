import { useState, useRef, useMemo, memo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Library, FileText, Sparkles, Brain, ListChecks, 
  Loader2, Star, RefreshCcw, Pencil, Copy, 
  ChevronLeft, ExternalLink, Clock, Tag
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import AnalyticalSidebar from './AnalyticalSidebar'

const neuralComponents = {
  ol: ({node, ...props}) => <ol className="list-decimal pl-10 space-y-4 my-8 text-accent marker:text-accent marker:font-black" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc pl-10 space-y-4 my-8 text-accent marker:text-accent" {...props} />,
  li: ({node, ...props}) => <li className="text-text leading-[1.8] pl-2 font-extralight" {...props} />,
  p: ({node, ...props}) => <p className="mb-6 last:mb-0 text-text leading-[1.8] font-extralight" {...props} />,
  strong: ({node, ...props}) => <strong className="text-accent font-bold tracking-tight px-0.5 border-b border-accent/20 drop-shadow-[0_0_2px_rgba(var(--accent-rgb),0.4)]" {...props} />,
  em: ({node, ...props}) => <em className="text-muted italic" {...props} />
}

const InsightDetailView = ({ item, setView, showToast, api, onUpdate }) => {
  const [summary, setSummary] = useState(item?.summary || null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editVal, setEditVal] = useState(item?.definition || '')
  const [titleEditVal, setTitleEditVal] = useState(item?.text || '')

  useEffect(() => {
    const hydrate = async () => {
      if (item) {
        let fullItem = { ...item };
        if (!item.definition && (item.id || item.date)) {
          console.log('[NEURAL WORKSPACE] Shallow node detected. Synchronizing with archive...');
          try {
            const results = await api.loadVocabPage({ id: item.id || item.date, limit: 1 });
            if (results?.[0]) fullItem = results[0];
          } catch (err) {
            console.error('[NEURAL WORKSPACE] Synchronization Failure:', err);
          }
        }
        
        setEditVal(fullItem.definition || '')
        setTitleEditVal(fullItem.text || '')
        setSummary(fullItem.summary || null)
        setHighlights([])
      }
    };
    hydrate();
  }, [item, api]);

  const handleSaveEdit = () => {
    onUpdate({ ...item, text: titleEditVal, definition: editVal })
    setIsEditing(false)
    showToast('Archive Permanently Updated')
  }

  const handleGenerateSummary = async () => {
    if (isSummarizing) return
    setIsSummarizing(true)
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timed Out')), 45000))
    try {
      const chatPromise = api.chatWithAI({ 
        messages: [{ role: 'user', content: `Summarize in 5 bullet points (No markdown/bold): ${editVal.slice(0, 8000)}` }] 
      })
      const response = await Promise.race([chatPromise, timeout])
      const cleaned = response.replace(/[#*`~_]/g, '').replace(/^(Sure|Of course|Here is).+?(:|\.)/i, '').trim()
      setSummary(cleaned)
      onUpdate({ ...item, summary: cleaned })
    } catch (e) {
      showToast('Synthesis Interrupted', 'error')
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

  const renderContentWithHeatmap = useCallback((text) => {
    const formattedText = text?.includes('\n') || /^(\d+\.|\s*[-*•])\s/m.test(text || '')
      ? text 
      : (text || '').split(/(?<=[.!?])\s+(?=[A-Z])/).join('\n\n')

    if (!highlights.length) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>
          {formattedText}
        </ReactMarkdown>
      )
    }
    const safeHighlights = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`\\b(${safeHighlights.join('|')})\\b`, 'gi')
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>
        {formattedText.split(regex).map(p => highlights.includes(p.toLowerCase()) ? `**${p}**` : p).join('')}
      </ReactMarkdown>
    )
  }, [highlights])

  if (!item) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-background overflow-hidden"
    >
      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace Rail (Full Width / Parallel to Sidebar logic) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          
          {/* Locked Title Hub (Modal Style) */}
          <div className="w-full h-[72px] shrink-0 border-b border-border/10 flex items-center px-8 lg:px-12 bg-background/20">
            {isEditing ? (
              <input 
                value={titleEditVal}
                onChange={e => setTitleEditVal(e.target.value)}
                className="w-full bg-transparent text-[20px] font-black tracking-tight text-text outline-none py-2 transition-all"
                placeholder="Subject name..."
                autoFocus
              />
            ) : (
              <h1 className="text-[20px] font-black text-text tracking-tight leading-tight select-text">{item.text}</h1>
            )}
          </div>

          {/* Independent Scroll Content Stream */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-8 lg:px-12 py-10">
            <div className="w-full">
              {isEditing ? (
                <textarea
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  className="w-full h-full min-h-[600px] bg-transparent border-none text-[17px] text-text leading-[1.8] font-extralight tracking-wide outline-none resize-none transition-all selection:bg-accent/40"
                  placeholder="Initialize neural drafting..."
                />
              ) : (
                <div className="prose max-w-none 
                    prose-h1:text-2xl prose-h1:font-black prose-h1:text-text prose-h1:mb-8
                    prose-h2:text-xl prose-h2:font-black prose-h2:text-text prose-h2:mb-6 prose-h2:border-l-4 prose-h2:border-accent prose-h2:pl-6
                    prose-p:text-[17px] prose-p:leading-[1.9] prose-p:text-text prose-p:mb-10
                    prose-strong:text-accent prose-strong:font-black prose-strong:bg-accent/5 prose-strong:px-1
                    prose-li:text-[17px] prose-li:leading-relaxed selection:bg-accent/40 select-text font-extralight">
                   {renderContentWithHeatmap(item.definition)}
                </div>
              )}

              {/* Summary Block (Modal Style) */}
              {summary && !isEditing && (
                <div className="mt-16 p-10 bg-accent/5 border border-accent/10 space-y-6 relative overflow-hidden rounded-[5px] group">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Sparkles className="h-32 w-32 text-accent" />
                   </div>
                   <div className="flex items-center gap-3 text-accent relative z-10">
                      <Sparkles className="h-5 w-5" />
                      <h2 className="text-[10px] font-black text-text uppercase tracking-[0.2em]">Neural Synthesis Root</h2>
                   </div>
                   <div className="text-[17px] text-text/80 leading-relaxed font-light space-y-4 relative z-10">
                      {summary.split('\n').map((l, i) => (
                        <p key={i} className="flex gap-6 items-start">
                          {l.replace(/^[•\-\d\.]+\s*/, '')}
                        </p>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnalyticalSidebar 
          mode="workspace"
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
          setView={setView}
        />
      </div>
    </motion.div>
  )
}

export default memo(InsightDetailView)
