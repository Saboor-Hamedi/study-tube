import { motion, AnimatePresence } from 'framer-motion'
import { X, Library, FileText } from 'lucide-react'

const ScriptReaderModal = ({ isOpen, script, onClose, showToast }) => {
  if (!isOpen || !script) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/95 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-5xl h-full bg-[#080808] border border-white/10 rounded-[5px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Progress Bar placeholder */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-30">
            <motion.div className="h-full bg-accent" style={{ width: '0%' }} />
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-40">
             <div className="flex items-center gap-4">
               <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Library className="h-3.5 w-3.5 text-accent" />
               </div>
               <div className="flex items-baseline gap-3">
                 <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] line-clamp-1">{script.text}</h2>
                 <span className="text-[9px] font-mono text-muted/30 invisible sm:visible">[{script.definition.split(' ').length} words]</span>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(script.definition)
                    showToast('Script copied to clipboard')
                  }}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white hover:text-black transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Copy
                </button>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button onClick={onClose} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted transition-all rounded-lg">
                  <X className="h-4 w-4" />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 lg:p-20 scrollbar-thin bg-black/40">
             <div className="max-w-2xl mx-auto">
               <article className="text-[18px] text-white/80 leading-[2.1] text-justify select-text lowercase space-y-8 font-light tracking-wide">
                 {script.definition}
               </article>
             </div>
          </div>
          
          <div className="px-10 py-6 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-center">
             <p className="text-[10px] text-muted font-bold uppercase tracking-[0.3em]">End of Collection — studyTube Intelligence</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ScriptReaderModal
