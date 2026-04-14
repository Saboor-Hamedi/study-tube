import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, User, Bot, Pencil, Trash2, Library, FileText, ChevronRight, X, Maximize2, AlertCircle, Square, GripVertical, Brain, Plus } from 'lucide-react'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DroppableFolder, DraggableCard } from '../vocabulary/DraggableCard'
import Sidebar from '../Sidebar'

export default function CopilotView({ vocab, setVocab, collections, setCollections, selectedCollection, setSelectedCollection, messages, setMessages, setView, api, showToast }) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    const currentInput = input
    setInput('')
    setIsTyping(true)

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Neural Response Timed Out')), 45000))

    try {
      const chatPromise = api.chatWithAI({ 
        messages: newMessages.map(m => ({ role: m.role, content: m.content })), 
        context: 'Global Research Copilot' 
      })

      const responseText = await Promise.race([chatPromise, timeout])

      if (responseText) {
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }])
      }
    } catch (e) {
      if (e.message !== 'CANCELLED') {
        const errorMsg = e.message === 'Neural Response Timed Out' ? 'AI response timed out.' : `Anomaly: ${e.message}`
        setMessages(prev => [...prev, { role: 'assistant', content: `[SYSTEM_ALERT] ${errorMsg}` }])
        showToast(errorMsg, 'error')
        setInput(currentInput)
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleStop = async () => {
    await api.stopAI()
    setIsTyping(false)
    showToast('Neural stream halted')
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
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e) => setActiveDragMessage(e.active.data.current)} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#080808]">
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Neural Hub</span>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <Sidebar 
            collections={collections} selectedCollection={selectedCollection}
            setSelectedCollection={(id) => { setSelectedCollection(id); setView('vocab') }}
            handleCreateCollection={async () => {
              if (!newCollectionName.trim()) return
              const newList = [...collections, newCollectionName.trim()]; setCollections(newList); await api.saveCollections(newList); setNewCollectionName(''); setIsCreatingCollection(false); showToast('Folder Established')
            }}
            setIsCreatingCollection={setIsCreatingCollection} isCreatingCollection={isCreatingCollection}
            newCollectionName={newCollectionName} setNewCollectionName={setNewCollectionName}
          />

          {/* Chat Stream (Gemini Style) */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-thin p-10 pb-60 lg:px-24 xl:px-48 space-y-12">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20 filter grayscale">
                   <Sparkles className="h-12 w-12 text-accent" />
                   <div className="text-center">
                      <p className="text-xl font-light text-white tracking-widest uppercase">Deep Research Protocol Active</p>
                      <p className="text-xs text-muted uppercase tracking-[0.4em] mt-2">Initializing Neural Interface...</p>
                   </div>
                </div>
              )}
              
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-6 max-w-full ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`shrink-0 p-1.5 rounded-xl border transition-all duration-300
                      ${m.role === 'user' 
                        ? 'bg-indigo-500/10 border-indigo-500/10' 
                        : 'bg-emerald-500/10 border-emerald-500/10'}`}>
                      {m.role === 'user' 
                        ? <User className="h-4 w-4 text-indigo-400" /> 
                        : <Sparkles className="h-4 w-4 text-emerald-400" />}
                    </div>
                    
                    <div className={`flex-1 min-w-0 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                       {m.role === 'assistant' ? (
                          <DraggableCard id={`msg-${i}`} v={{ ...m, type: 'chat-message' }} useHandle={true}>
                            {({ listeners, attributes }) => (
                              <div className="group/msg relative cursor-text select-text">
                                <div className="prose prose-invert prose-lg max-w-none 
                                  prose-p:text-white/80 prose-p:leading-relaxed prose-p:mb-4
                                  prose-strong:text-accent prose-strong:font-black
                                  prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                                  prose-code:bg-white/5 prose-code:p-1 prose-code:rounded prose-code:text-accent
                                  select-text cursor-text">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                </div>
                                
                                <div className="mt-4 flex items-center gap-4 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                   <div {...listeners} {...attributes} className="p-2 bg-white/5 hover:bg-accent text-muted hover:text-white rounded-lg cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 border border-white/5">
                                      <GripVertical className="h-3 w-3" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Archive Insight</span>
                                   </div>
                                </div>
                              </div>
                            )}
                          </DraggableCard>
                       ) : (
                          <p className="text-xl font-light text-white leading-relaxed tracking-wide mb-2 select-text cursor-text">{m.content}</p>
                       )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-4 text-accent animate-pulse">
                   <div className="p-2.5 bg-accent/10 rounded-xl border border-accent/20">
                      <Loader2 className="h-4 w-4 animate-spin" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synthesizing Neural Response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Gemini Style Input Hub */}
            <div className="absolute bottom-8 left-0 right-0 px-10 lg:px-24 xl:px-48 z-30">
              <div className="max-w-5xl mx-auto relative">
                <div className="bg-[#121212] border border-white/10 rounded-[28px] p-1.5 pr-3 shadow-2xl shadow-black focus-within:border-accent/30 transition-all backdrop-blur-2xl flex items-center gap-2 group/input">
                  <div className="p-2.5 bg-white/[0.02] rounded-full ml-1">
                     <Plus className="h-3.5 w-3.5 text-white/20 group-hover/input:text-white transition-colors cursor-pointer" />
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
                    placeholder={isTyping ? "AI is generating..." : "Ask your assistant about anything..."}
                    className="flex-1 bg-transparent px-2 py-3 text-[14px] text-white/90 outline-none placeholder:text-muted/20 resize-none min-h-[48px] max-h-[200px] scrollbar-none"
                    rows={1}
                  />

                  <button 
                    onClick={isTyping ? handleStop : handleSend}
                    className={`shrink-0 p-2.5 rounded-full transition-all active:scale-90 ${
                      isTyping ? 'bg-red-500 text-white' : (input.trim() ? 'bg-white text-black' : 'bg-white/5 text-white/20')
                    }`}
                  >
                    {isTyping ? <Square className="h-3.5 w-3.5 fill-current" /> : <Send className="h-3.5 w-3.5 fill-current" />}
                  </button>
                </div>

                {/* Shield Pulse Indicator */}
                <button 
                  onClick={() => showToast('SHIELD PROTOCOL: Neural State & Atomic Save active.', 'success')}
                  className="absolute -top-10 right-4 flex items-center gap-3 py-1.5 px-3 bg-accent/[0.03] border border-accent/10 rounded-full group hover:bg-accent/10 hover:border-accent/40 transition-all"
                >
                   <span className="text-[7px] font-black uppercase tracking-[0.4em] text-muted group-hover:text-accent transition-colors">Shield Pulse Active</span>
                   <Brain className="h-3 w-3 text-accent animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeDragMessage ? (
          <div className="pointer-events-none flex items-center gap-3 bg-[#111] border border-accent/40 rounded-full py-3 px-6 shadow-2xl w-64 backdrop-blur-2xl">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">Neural Extract</p>
              <p className="text-[8px] text-accent font-bold uppercase tracking-tighter">Archiving to folder...</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
