import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Sparkles, Cpu, Layers } from 'lucide-react'

export default function GlobalNeuralMenu({ onOpenCapture, onOpenCopilot, stats, isShifted }) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    {
      id: 'capture',
      icon: <Layers className="h-3.5 w-3.5" />,
      label: 'Forge Insight',
      action: onOpenCapture,
      color: 'var(--accent)',
      delay: 0.05
    },
    {
      id: 'copilot',
      icon: <Sparkles className="h-3.5 w-3.5" />,
      label: 'Neural Copilot',
      action: onOpenCopilot,
      color: 'var(--success)',
      delay: 0.1
    }
  ]

  return (
    <div className={`fixed right-8 z-[250] flex flex-col items-end gap-3 transition-all duration-500 ease-in-out
      ${isShifted ? 'bottom-28 translate-x-[-4px]' : 'bottom-8 translate-x-[-8px]'}
    `}>
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ delay: item.delay, type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => {
                  item.action()
                  setIsOpen(false)
                }}
                className="group flex items-center gap-3 pr-1.5"
              >
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface-3)]/90 px-2.5 py-1 border border-[var(--border)]/10 rounded-full shadow-lg shadow-black/20 whitespace-nowrap backdrop-blur-md">
                  {item.label}
                </span>
                <div 
                  className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center transition-all bg-[var(--surface-2)] text-[var(--text)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] hover:border-[var(--accent)]/40 active:scale-95"
                >
                  {item.icon}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative
          ${isOpen ? 'bg-[var(--surface-3)] border-[var(--accent)] border-2' : 'bg-[var(--accent)] border-transparent'}
        `}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={isOpen ? 'text-[var(--accent)]' : 'text-white'}
        >
          <Plus className="h-5 w-5" />
        </motion.div>
        
        {!isOpen && stats?.total > 0 && (
          <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--success)] text-white text-[8px] font-black rounded-full border-2 border-[var(--background)] flex items-center justify-center shadow-lg">
            {stats.total}
          </div>
        )}
      </motion.button>
    </div>
  )
}
