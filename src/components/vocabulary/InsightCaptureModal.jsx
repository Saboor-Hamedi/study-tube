import React, { useState, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Brain, Layout, Save, Loader2 } from 'lucide-react'
import ModalCommandHeader from './ModalCommandHeader'

const InsightCaptureModal = ({ isOpen, onClose, onInsert, showToast, api }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setContent('')
      setIsMaximized(false)
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
      collection: null
    }

    try {
      // Direct call to onInsert which is handleAddItem in LibraryView
      await onInsert(newItem)
      onClose()
    } catch (e) {
      showToast('Forge Interrupted', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const industrialTransition = { type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-500 ${isMaximized ? 'p-0' : 'p-0 lg:p-8'}`}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md" 
          onClick={onClose} 
        />
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.98, y: 40 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
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

          <div className={`relative z-50 flex w-[280px] shrink-0 flex-col border-l border-border bg-surface-2 overflow-hidden ${isMaximized ? 'rounded-none' : 'rounded-r-[5px]'}`}>
            
            <ModalCommandHeader 
              title="Capture" 
              subtitle="Node Interface" 
              Icon={Plus} 
              onClose={onClose} 
              onMaximize={() => setIsMaximized(!isMaximized)}
              isMaximized={isMaximized}
            />

            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-8">
              <div className="space-y-4">
                <div className="pt-2 border-t border-border opacity-5">
                   {/* Minimalist Industrial Interface */}
                </div>
              </div>
            </div>

            {/* Commmand Footer */}
            <div className="p-6 border-t border-border bg-surface-2">
              <button 
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="w-full h-14 bg-accent text-white rounded-[5px] flex items-center justify-center hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 border border-blue-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Loader2 className={`h-4 w-4 animate-spin ${isSaving ? 'opacity-100' : 'opacity-0'}`} />
                {!isSaving && <Plus className="h-4 w-4 absolute" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default memo(InsightCaptureModal)