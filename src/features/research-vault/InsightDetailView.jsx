import { useState, memo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Pencil, X, Save, Brain
} from 'lucide-react'
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

const InsightDetailView = ({ 
  item, setView, showToast, api, onUpdate, 
  onOpenCopilot, onClose,
  collections, selectedCollection, setSelectedCollection
}) => {
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
      }
    };
    hydrate();
  }, [item, api]);

  const handleSaveEdit = () => {
    onUpdate({ ...item, text: titleEditVal, definition: editVal })
    setIsEditing(false)
    showToast('Archive Permanently Updated')
  }

  const renderContent = useCallback((text) => {
    return text?.includes('\n') || /^(\d+\.|\s*[-*•])\s/m.test(text || '')
      ? text 
      : (text || '').split(/(?<=[.!?])\s+(?=[A-Z])/).join('\n\n')
  }, [])

  if (!item) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-background overflow-hidden"
    >
      {/* Sidebar Header — Title + Close */}
      <div className="h-[56px] shrink-0 flex items-center justify-between px-5 border-b border-border/20 bg-surface">
        <h2 className="text-[13px] font-black text-text tracking-tight truncate pr-4">{item.text}</h2>
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <button
              onClick={handleSaveEdit}
              className="p-2 bg-accent text-white hover:brightness-110 transition-all rounded-[5px]"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-muted hover:text-text hover:bg-surface-3 transition-all rounded-[5px]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {!isEditing && (
            <button
              onClick={() => onOpenCopilot?.({ type: 'insight', text: item.text, definition: item.definition })}
              className="p-2 text-muted hover:text-accent hover:bg-surface-3 transition-all rounded-[5px]"
            >
              <Brain className="h-3.5 w-3.5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-text hover:bg-surface-3 transition-all rounded-[5px]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-8">
        {isEditing ? (
          <textarea
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            className="w-full min-h-[600px] bg-transparent border-none text-[16px] text-text leading-[1.8] font-extralight tracking-wide outline-none resize-none transition-all selection:bg-accent/40"
            placeholder="Initialize neural drafting..."
          />
        ) : (
          <div className="prose max-w-none 
              prose-h1:text-2xl prose-h1:font-black prose-h1:text-text prose-h1:mb-8
              prose-h2:text-xl prose-h2:font-black prose-h2:text-text prose-h2:mb-6 prose-h2:border-l-4 prose-h2:border-accent prose-h2:pl-6
              prose-p:text-[16px] prose-p:leading-[1.9] prose-p:text-text prose-p:mb-8
              prose-strong:text-accent prose-strong:font-black prose-strong:bg-accent/5 prose-strong:px-1
              prose-li:text-[16px] prose-li:leading-relaxed selection:bg-accent/40 select-text font-extralight">
             <ReactMarkdown remarkPlugins={[remarkGfm]} components={neuralComponents}>
               {renderContent(item.definition)}
             </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default memo(InsightDetailView)
