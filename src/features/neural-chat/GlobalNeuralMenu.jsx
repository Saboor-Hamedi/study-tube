import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export default function GlobalNeuralMenu({ onOpenCapture, stats, isShifted }) {
  return (
    <div className={`fixed right-8 z-[250] flex flex-col items-end transition-all duration-500 ease-in-out
      ${isShifted ? 'bottom-28' : 'bottom-8'}
    `}>
      <motion.button
        onClick={onOpenCapture}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-2xl shadow-[var(--accent)]/30 relative"
        title="Forge Insight"
      >
        <Plus className="h-5 w-5 text-white" />

        {stats?.total > 0 && (
          <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--success)] text-white text-[8px] font-black rounded-full border-2 border-[var(--background)] flex items-center justify-center shadow-lg">
            {stats.total}
          </div>
        )}
      </motion.button>
    </div>
  )
}
