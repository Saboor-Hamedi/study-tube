import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Trash2 } from 'lucide-react'

const DeleteModal = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Erase Data", 
  message = "Are you sure? This action is irreversible.",
  confirmLabel = "Confirm Delete",
  variant = "danger" // danger (red) or info (accent)
}) => {
  if (!isOpen) return null

  const isDanger = variant === "danger"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-surface border border-border p-6 shadow-[0_30px_100px_rgba(0,0,0,1)] space-y-6 rounded-[5px] relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
             <div className={`p-3 rounded-[5px] ${isDanger ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent"}`}>
                <AlertCircle className="h-6 w-6" />
             </div>
             <div className="space-y-1 pr-4">
                <h3 className="text-[13px] font-black text-text uppercase tracking-widest leading-tight">{title}</h3>
                <p className="text-[11px] text-muted leading-relaxed lowercase">{message}</p>
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <button 
              onClick={onConfirm}
              className={`w-full py-3 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg rounded-[5px] flex items-center justify-center gap-2 ${
                isDanger 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/10" 
                  : "bg-accent hover:bg-accent-hover shadow-accent/10"
              }`}
             >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmLabel}
             </button>
             <button 
              onClick={onClose}
              className="w-full py-3 bg-surface-2 text-muted hover:text-text text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-[5px]"
             >
                Cancel Protocol
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
})

export default DeleteModal
