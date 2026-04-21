import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, User, Bot, Pencil, Trash2, Library, FileText, ChevronRight, X, Maximize2, AlertCircle, Square, GripVertical, Brain, Plus } from 'lucide-react'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DroppableFolder, DraggableCard } from '../vocabulary/DraggableCard'

export default memo(function CopilotView({ 
  isOpen, onClose, 
  vocab, setVocab, 
  collections, setCollections, 
  selectedCollection, setSelectedCollection,
  contextItem,
  messages, setMessages, 
  api, showToast 
}) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  // Auto-expand textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    const assistantIdx = newMessages.length
    const currentInput = input
    setInput('')
    setIsTyping(true)

    let currentContent = ''
    let unsubscribe = null

    try {
      unsubscribe = api.onChatChunk(({ content }) => {
        currentContent += content
        setMessages(cm => cm.map((msg, idx) => 
          idx === assistantIdx ? { ...msg, content: currentContent } : msg
        ))
      })

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const systemPrompt = contextItem ? `You are the StudyTube Neural Assistant.
Analyze: "${contextItem.text}"
CONTEXT:
${contextItem.definition}
Format: industrial, concise, bullet points if needed.` : null

      const history = newMessages.map(m => ({ role: m.role, content: m.content }))
      const finalMessages = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...history] : history

      await api.chatWithAIStream({ 
        messages: finalMessages, 
        context: contextItem ? `Neural Node: ${contextItem.text}` : 'Global Research Copilot' 
      })
    } catch (e) {
      console.error('Neural stream failure', e)
      setMessages(prev => [...prev, { role: 'assistant', content: `[SYSTEM_ALERT] ${e.message}` }])
    } finally {
      if (unsubscribe) unsubscribe()
      setIsTyping(false)
    }
  }

  const handleStop = async () => {
    await api.stopAI()
    setIsTyping(false)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [activeDragMessage, setActiveDragMessage] = useState(null)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveDragMessage(null)
    if (over && active.data.current?.type === 'chat-message') {
      const item = active.data.current
      const targetCollection = over.id === 'unorganized' ? '' : (over.id === 'all' ? '' : over.id)
      try {
          const cleanText = item.content.replace(/[#*`~_\[\]()]/g, '').trim()
          const firstSentence = cleanText.split(/[.!?\n]/).filter(s => s.trim().length > 0)[0] || 'Neural Insight'
          const finalTitle = firstSentence.length > 50 ? firstSentence.slice(0, 50) + '...' : firstSentence
          
          const newEntry = { text: finalTitle, definition: item.content, collection: targetCollection, date: new Date().toISOString(), videoTitle: 'AI Research Insight', loading: false }
          const newList = [newEntry, ...vocab]
          setVocab(newList)
          await api.saveVocab(newList)
          showToast(`Insight archived in ${over.id || 'unorganized'}`)
      } catch (err) { showToast('Capture failed', 'error') }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/40 backdrop-blur-md z-[150]"
          />

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-full lg:w-[60%] bg-[var(--background)] border-l border-[var(--border)] shadow-2xl z-[151] flex flex-col overflow-hidden will-change-transform"
          >
            {/* Header Hub */}
            <div className="h-[72px] px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-3)]">
              <div className="flex items-center gap-4">
                <div className={`p-2 ${contextItem ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'} text-white rounded-[5px]`}>
                  {contextItem ? <Sparkles className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-tight">
                    {contextItem ? 'Neural Link' : 'Neural Copilot'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className={`h-1 w-1 ${contextItem ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'bg-[var(--success)] shadow-[0_0_5px_var(--success)]'} rounded-full animate-pulse`} />
                    <p className="text-[8px] text-[var(--muted)] font-bold uppercase tracking-widest truncate max-w-[150px]">
                      {contextItem ? `Buffer Sync: ${contextItem.text}` : 'Active Neural Link'}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[var(--text)]/5 rounded-full transition-colors text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragEnd={handleDragEnd}
              onDragStart={(e) => setActiveDragMessage(e.active.data.current)}
            >
              <div className="flex-1 flex overflow-hidden">
                {/* Archival Rail - Restored for high-density organization */}
                <div className="w-14 lg:w-48 border-r border-[var(--border)] bg-[var(--surface-2)] flex flex-col shrink-0 overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] hidden lg:block">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[var(--muted)] opacity-40">Neural Extract</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
                    {['all', ...collections].map(c => (
                      <DroppableFolder 
                        key={c} id={c} 
                        active={selectedCollection === c} 
                        onClick={() => setSelectedCollection(c)}
                        isCollapsed={window.innerWidth < 1024}
                      >
                         <span className="truncate">{c === 'all' ? 'Archive Root' : c}</span>
                      </DroppableFolder>
                    ))}
                  </div>
                </div>

                {/* Primary Dialogue Stream */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[var(--background)] to-[var(--surface)]">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <div className="p-6 bg-[var(--surface-2)] rounded-full border border-[var(--border)]">
                          <Sparkles className="h-10 w-10 text-[var(--accent)]/30" />
                        </div>
                        <div className="max-w-xs">
                          <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.3em] mb-1">Intelligence Layer Active</p>
                          <p className="text-[9px] text-[var(--muted)] leading-relaxed uppercase tracking-widest">Inquiry pending. Request neural synthesis.</p>
                        </div>
                      </div>
                    )}
                    
                    {messages.map((m, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-start gap-4 max-w-[92%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`shrink-0 p-1.5 border rounded-full transition-all duration-300
                            ${m.role === 'user' 
                              ? 'bg-indigo-500/10 border-indigo-500/10' 
                              : 'bg-emerald-500/10 border-emerald-500/10'}`}>
                            {m.role === 'user' 
                              ? <User className="h-4 w-4 text-indigo-400" /> 
                              : <Sparkles className="h-4 w-4 text-emerald-400" />}
                          </div>
                          
                          <div className={`flex-1 min-w-0 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                             {m.role === 'assistant' ? (
                                <DraggableCard id={`copilot-msg-${i}`} v={{ ...m, type: 'chat-message' }} useHandle={true}>
                                  {({ listeners, attributes }) => (
                                    <div className="group/msg relative cursor-text select-text">
                                      <div className={`prose prose-sm max-w-none 
                                        prose-p:text-[13px] prose-p:leading-[1.6] prose-p:text-[var(--text)] prose-p:tracking-wide prose-p:font-light prose-p:mb-4
                                        prose-strong:text-[var(--accent)] prose-strong:font-black
                                        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                                        prose-code:bg-[var(--surface-3)] prose-code:p-1 prose-code:text-[var(--accent)]
                                        select-text cursor-text`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                      </div>
                                      
                                      <div className="mt-4 flex items-center gap-4 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                          <div {...listeners} {...attributes} className="p-1.5 bg-transparent hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 border border-[var(--accent)]/20 rounded-[5px]">
                                             <GripVertical className="h-3 w-3" />
                                             <span className="text-[8px] font-black uppercase tracking-widest">Archive Insight</span>
                                          </div>
                                      </div>
                                    </div>
                                  )}
                                </DraggableCard>
                             ) : (
                                <p className="text-[13px] leading-[1.6] font-medium text-[var(--text)] tracking-wide mb-2 select-text cursor-text">{m.content}</p>
                             )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex items-center gap-4 text-[var(--accent)] animate-pulse">
                         <div className="p-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-[5px]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synthesizing...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Hub */}
                  <div className="p-6 bg-[var(--surface-3)] border-t border-[var(--border)]">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[24px] p-1.5 pr-3 focus-within:border-[var(--accent)]/30 transition-all backdrop-blur-2xl flex items-center gap-2 group/input">
                        <div className="p-2 bg-[var(--surface-3)] rounded-full ml-1">
                          <Plus className="h-3 w-3 text-[var(--muted)] group-hover/input:text-[var(--text)] transition-colors cursor-pointer" />
                        </div>
                        <textarea 
                          ref={textareaRef}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              isTyping ? handleStop() : handleSend()
                            }
                          }}
                          placeholder={isTyping ? "AI is generating..." : "Research anything..."}
                          className="flex-1 bg-transparent px-2 py-2.5 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]/40 resize-none min-h-[40px] max-h-[200px] scrollbar-none"
                          rows={1}
                        />
                        <button 
                          onClick={isTyping ? handleStop : handleSend}
                          className={`shrink-0 p-2 rounded-full transition-all active:scale-95 ${
                            isTyping ? 'bg-red-500 text-white' : (input.trim() ? 'bg-[var(--text)] text-[var(--background)]' : 'bg-[var(--surface-3)] text-[var(--muted)]')
                          }`}
                        >
                          {isTyping ? <Square className="h-3 w-3 fill-current" /> : <Send className="h-3 w-3 fill-current" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
                {activeDragMessage ? (
                  <div className="pointer-events-none flex items-center gap-2 bg-[var(--surface-3)] border border-[var(--accent)] py-1 px-3 shadow-2xl w-[150px] opacity-95 rounded-[5px]">
                    <div className="p-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-[3px]">
                       <FileText className="h-3 w-3 text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-[var(--text)] uppercase tracking-widest truncate">Neural Extract</p>
                      <p className="text-[7px] text-[var(--accent)] font-bold uppercase tracking-tighter">Archiving...</p>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
