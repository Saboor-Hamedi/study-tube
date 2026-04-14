import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, User, Bot, Pencil, Trash2, Library, FileText, ChevronRight, X, Maximize2, AlertCircle, Square, GripVertical, Brain } from 'lucide-react'
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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    const currentInput = input
    setInput('')
    setIsTyping(true)

    // Shield Logic: Timeout Protection (45s)
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Neural Response Timed Out')), 45000))

    try {
      const chatHistory = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const chatPromise = api.chatWithAI({ 
        messages: chatHistory, 
        context: 'Global Research Copilot' 
      })

      const responseText = await Promise.race([chatPromise, timeout])

      if (responseText) {
        const assistantMsg = { role: 'assistant', content: responseText }
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch (e) {
      if (e.message !== 'CANCELLED') {
        const errorMsg = e.message === 'Neural Response Timed Out' ? 'AI response timed out. Service may be congested.' : `Connection anomaly: ${e.message}`
        setMessages(prev => [...prev, { role: 'assistant', content: `[SYSTEM_ALERT] ${errorMsg}` }])
        showToast(errorMsg, 'error')
        setInput(currentInput) // Restore input on failure
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const [activeDragMessage, setActiveDragMessage] = useState(null)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveDragMessage(null)

    if (over && active.data.current?.type === 'chat-message') {
      const item = active.data.current
      const targetCollection = over.id === 'unorganized' ? '' : (over.id === 'all' ? '' : over.id)
      
      try {
          // Precise Title Capture: Strip Markdown and take first clean sentence
          const cleanText = item.content.replace(/[#*`~_\[\]()]/g, '').trim()
          const firstSentence = cleanText.split(/[.!?\n]/).filter(s => s.trim().length > 0)[0] || 'Neural Insight'
          const finalTitle = firstSentence.length > 50 ? firstSentence.slice(0, 50) + '...' : firstSentence
          
          const newEntry = {
            text: finalTitle,
            definition: item.content,
            collection: targetCollection,
            date: new Date().toISOString(),
            videoTitle: 'AI Research Insight',
            loading: false
          }
          const newList = [newEntry, ...vocab]
          setVocab(newList)
          await api.saveVocab(newList)
          showToast(`Insight archived in ${over.id || 'unorganized'}`)
      } catch (err) {
          showToast('Failed to archive research insight', 'error')
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e) => setActiveDragMessage(e.active.data.current)} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        {/* Full-Width Header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent/20 text-accent rounded-xl">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Research Copilot</h2>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Neural assistant active</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Shared Unified Sidebar */}
          <div className="relative flex flex-col h-full shrink-0">
              <Sidebar 
                collections={collections}
                selectedCollection={selectedCollection}
                setSelectedCollection={(id) => {
                  setSelectedCollection(id)
                  setView('vocab')
                }}
                handleCreateCollection={async () => {
                  if (!newCollectionName.trim()) return
                  const newList = [...collections, newCollectionName.trim()]
                  setCollections(newList)
                  await api.saveCollections(newList)
                  setNewCollectionName('')
                  setIsCreatingCollection(false)
                  showToast('Folder established')
                }}
                setIsCreatingCollection={setIsCreatingCollection}
                isCreatingCollection={isCreatingCollection}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
              />
              
              {/* Shield Status Integration */}
              <button 
                onClick={() => showToast('SHIELD PROTOCOL: Atomic Writes & AI Timeout Sensors standing by.', 'success')}
                className="absolute bottom-4 left-6 right-6 p-2.5 bg-accent/[0.03] border border-accent/10 rounded-xl flex items-center justify-between group hover:bg-accent/5 hover:border-accent/30 transition-all cursor-help"
              >
                 <span className="text-[8px] font-black uppercase tracking-widest text-muted group-hover:text-accent transition-colors">Shield Active</span>
                 <Brain className="h-3 w-3 text-accent animate-pulse" />
              </button>
          </div>

          {/* Main Chat Hub */}
          <div className="flex-1 flex flex-col relative overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-8 space-y-10 pb-40">
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-6 ${m.role === 'user' ? 'justify-end' : ''} w-full`}
              >
                {m.role === 'assistant' && (
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shrink-0 mt-2">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                )}
                
                <div className={`flex-1 ${m.role === 'user' ? 'max-w-[80%]' : ''} space-y-3`}>
                  {m.role === 'assistant' ? (
                      <DraggableCard id={`msg-${i}`} v={{ ...m, type: 'chat-message' }} useHandle={true}>
                        {({ listeners, attributes }) => (
                          <div className="group/msg relative text-[14px] leading-relaxed text-white/90 p-6 bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none cursor-text select-text hover:border-accent/20 transition-all shadow-xl">
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:rounded-xl prose-strong:text-accent prose-strong:font-black prose-ul:list-disc prose-ul:pl-4 relative z-10">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                            
                            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-accent/40 tracking-[0.2em] opacity-40 group-hover/msg:opacity-100 transition-opacity">
                                  <span>Drag Handle to Archive Insight</span>
                               </div>
                               
                               <div 
                                {...listeners} 
                                {...attributes} 
                                className="p-1 px-2.5 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-[5px] cursor-grab active:cursor-grabbing transition-all flex items-center gap-1.5"
                               >
                                  <GripVertical className="h-3 w-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Handle</span>
                               </div>
                            </div>
                          </div>
                        )}
                      </DraggableCard>
                  ) : (
                    <div className="text-[14px] leading-relaxed bg-accent/10 text-white p-5 rounded-2xl rounded-tr-none border border-accent/20 backdrop-blur-sm shadow-xl ml-auto">
                      {m.content}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="p-2.5 bg-accent/20 rounded-xl border border-accent/20 shrink-0 mt-2 ml-4">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3 text-muted px-4 animate-pulse">
                 <Loader2 className="h-3 w-3 animate-spin" />
                 <span className="text-[9px] font-black uppercase tracking-widest">establishing neural bridge...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Dock (Full Width) */}
          <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-center z-30">
            <div className="w-full max-w-4xl bg-[#151515] border border-white/10 rounded-2xl p-2.5 shadow-2xl flex items-center gap-4 focus-within:border-accent/30 transition-all backdrop-blur-3xl">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (isTyping ? handleStop() : handleSend())}
                placeholder={isTyping ? "AI is generating..." : "Conduct research or drag insights to your folders..."}
                className="flex-1 bg-transparent px-5 py-3 text-[14px] text-white outline-none placeholder:text-muted/20"
                disabled={isTyping}
              />
              <button 
                onClick={isTyping ? handleStop : handleSend}
                className={`p-3 rounded-xl transition-all active:scale-95 ${
                  isTyping 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                    : 'bg-accent text-white hover:brightness-110'
                }`}
              >
                {isTyping ? <Square className="h-4.5 w-4.5 fill-current" /> : <Send className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeDragMessage ? (
          <div className="pointer-events-none flex items-center gap-2 bg-[#1a1a1a] border border-accent/40 rounded-xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-56 backdrop-blur-md">
            <div className="shrink-0 p-1.5 bg-accent/20 rounded-lg">
               <Sparkles className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-white/90 uppercase tracking-widest truncate">Research Capture</p>
              <p className="text-[8px] text-accent/60 font-medium truncate uppercase tracking-tighter">Archiving to persistent unit...</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
