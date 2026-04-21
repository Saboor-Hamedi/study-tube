import { useState, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, Brain, Sparkles, Loader2, Square, Plus
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const InsightChatDrawer = memo(({ isOpen, onClose, item, api }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-expand textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    let currentContent = ''
    let unsubscribe = null

    try {
      const systemPrompt = `You are the StudyTube Neural Assistant. 
Analyze: "${item.text}"
CONTEXT:
${item.definition}
Format: industrial, concise, bullet points if needed.`

      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }))
      const assistantIdx = messages.length + 1

      unsubscribe = api.onChatChunk(({ content }) => {
        currentContent += content
        setMessages(cm => cm.map((msg, idx) => 
          idx === assistantIdx ? { ...msg, content: currentContent } : msg
        ))
      })

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      await api.chatWithAIStream({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory,
          userMessage
        ],
        context: `Neural Node: ${item.text}`
      })

    } catch (err) {
      console.error('[NEURAL DRAWER] Stream Failure:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: `Neural Downlink Interrupted: ${err.message}` }])
    } finally {
      if (unsubscribe) unsubscribe()
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    await api.stopAI()
    setIsLoading(false)
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
            className="absolute inset-0 bg-background/60 z-[100]"
          />

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="absolute top-0 right-0 h-full w-full lg:w-1/2 bg-[var(--background)] border-l border-[var(--border)] shadow-2xl z-[101] flex flex-col overflow-hidden will-change-transform"
          >
            <div className="h-[72px] px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-3)]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[var(--accent)] text-white rounded-[5px] shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-tight">Neural Dialogue</h2>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-[var(--success)] rounded-full animate-pulse shadow-[0_0_5px_var(--success)]" />
                    <p className="text-[8px] text-[var(--muted)] font-bold uppercase tracking-widest">Buffer Sync: {item.text?.slice(0, 30)}</p>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--text)]/5 rounded-full transition-colors text-[var(--muted)] hover:text-[var(--text)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-gradient-to-b from-[var(--background)] to-[var(--surface)]">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <div className="p-6 bg-[var(--surface-2)] rounded-full border border-[var(--border)]">
                    <Sparkles className="h-10 w-10 text-[var(--accent)]/30" />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.3em] mb-1">Intelligence Layer Active</p>
                    <p className="text-[9px] text-[var(--muted)] leading-relaxed uppercase tracking-widest">Inquire current material buffer.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] py-1 px-3 rounded-[6px] text-[13px] leading-[1.6] relative ${
                    msg.role === 'user' 
                      ? 'bg-[var(--accent)] text-white font-medium border border-white/10' 
                      : 'bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text)]/90 font-light shadow-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="select-text cursor-text whitespace-pre-wrap tracking-wide">
                        {msg.content === '' && isLoading ? (
                          <div className="flex items-center gap-3 py-1">
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em] animate-pulse">Synthesis in progress...</span>
                          </div>
                        ) : (
                          msg.content.replace(/[#*`_~\[\]]/g, '')
                        )}
                      </div>
                    ) : (
                      <p className="select-text cursor-text">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

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
                        isLoading ? handleStop() : handleSendMessage()
                      }
                    }}
                    placeholder={isLoading ? "AI is generating..." : "Chat with resources..."}
                    className="flex-1 bg-transparent px-2 py-2.5 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]/40 resize-none min-h-[40px] max-h-[200px] scrollbar-none"
                    rows={1}
                  />
                  <button 
                    onClick={isLoading ? handleStop : handleSendMessage}
                    className={`shrink-0 p-2 rounded-full transition-all active:scale-95 ${
                      isLoading ? 'bg-red-500 text-white' : (input.trim() ? 'bg-[var(--text)] text-[var(--background)]' : 'bg-[var(--surface-3)] text-[var(--muted)]')
                    }`}
                  >
                    {isLoading ? <Square className="h-3 w-3 fill-current" /> : <Send className="h-3 w-3 fill-current" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

export default InsightChatDrawer
