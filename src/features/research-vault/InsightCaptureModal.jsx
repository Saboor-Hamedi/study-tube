import React, { useState, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Brain, Loader2 } from 'lucide-react'
import AnalyticalSidebar from './AnalyticalSidebar'

const InsightCaptureModal = ({ isOpen, onClose, onInsert, showToast, api }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isMaximized, setIsMaximized] = useState(() => {
    return localStorage.getItem('studytube_capture_maximized') === 'true'
  })

  // Persistence Protocol
  useEffect(() => {
    localStorage.setItem('studytube_capture_maximized', isMaximized)
  }, [isMaximized])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setContent('')
    }
  }, [isOpen])

  // Escape Protocol
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  /**
   * Manual Forge: Prepares a new research node for archival and 
   * triggers the industrial insert pipeline.
   */
  const handleSave = async () => {
    if (!title.trim()) return showToast('Subject Designation Required', 'error')
    setIsSaving(true)
    
    const newItem = {
      text: title,
      definition: content,
      date: new Date().toISOString(),
      type: 'Manual Research',
      videoTitle: 'Internal Forge',
      archived: 0,
      collection: null,
      skipAI: !!content.trim() // Industrial Bypass: Human definitions are sacred
    }

    try {
      // Optimistic Modal Exit: Close immediately to provide industrial responsiveness
      onClose()
      await onInsert(newItem)
    } catch (e) {
      showToast('Forge Interrupted', 'error')
    } finally {
      setIsSaving(false)
    }
  }

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
          initial={{ opacity: 0, scale: 0.99, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.99, y: 10 }} 
          transition={industrialTransition}
          style={{ borderRadius: isMaximized ? 0 : 5 }}
          className={`industrial-modal relative h-[88vh] bg-surface border border-border shadow-2xl shadow-black/80 overflow-hidden flex flex-row ${isMaximized ? 'maximized h-full w-full max-w-full' : 'w-[92vw] max-w-7xl'}`}
        >
          
          <div className={`flex-1 bg-surface flex flex-col overflow-hidden ${isMaximized ? 'rounded-none' : 'rounded-l-[5px]'}`}>
            <div className="w-full h-[72px] px-6 lg:px-12 flex items-center shrink-0 border-b border-border/10">
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-[20px] font-black tracking-normal text-text outline-none placeholder:text-muted/10"
                placeholder="Subject name..."
                autoFocus
              />
            </div>

            <div className="flex-1 w-full overflow-hidden">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[400px] bg-transparent border-none px-6 lg:px-12 py-8 text-[16px] text-text leading-[1.8] font-extralight tracking-wide outline-none scrollbar-thin resize-none transition-all selection:bg-accent/40 overflow-y-auto"
                placeholder="Initialize neural drafting..."
              />
            </div>
          </div>

          <AnalyticalSidebar 
            mode="capture"
            onClose={onClose}
            isMaximized={isMaximized}
            onMaximize={() => setIsMaximized(!isMaximized)}
          >
            {/* Command Footer (Capture Specific) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-surface-2">
              <button 
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="w-full h-14 bg-accent text-white rounded-[5px] flex items-center justify-center hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 border border-blue-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Loader2 className={`h-4 w-4 animate-spin ${isSaving ? 'opacity-100' : 'opacity-0'}`} />
                {!isSaving && <Plus className="h-4 w-4 absolute" />}
              </button>
            </div>
          </AnalyticalSidebar>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default memo(InsightCaptureModal)