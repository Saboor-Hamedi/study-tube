import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Notification({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ opacity: 0, x: 100, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, scale: 0.95 }}
          className="fixed top-8 right-8 z-[1000] px-6 py-4 bg-surface-3 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 backdrop-blur-2xl"
        >
          <div className={`p-2 ${toast.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="flex flex-col pr-4 border-r border-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-text">{toast.msg}</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter text-muted">System Notification</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface hover:text-text transition-colors">
            <X className="h-3.5 w-3.5 text-muted hover:text-text" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
