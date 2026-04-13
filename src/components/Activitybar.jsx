import { Search, BookOpen, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Activitybar({ view, setView }) {
  const tabs = [
    { id: 'search', label: 'Discover', icon: Search },
    { id: 'vocab', label: 'Library', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="w-[68px] shrink-0 bg-[#080808] border-r border-white/5 flex flex-col items-center py-6 gap-6 relative z-30">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4">
        <div className="w-4 h-4 bg-accent rounded shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
      </div>

      {tabs.map(tab => {
        const active = view === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 group ${active ? 'bg-accent/10 text-accent' : 'text-muted/40 hover:bg-white/5 hover:text-white'}`}
          >
            <tab.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
            
            {/* Active Indicator Line */}
            {active && (
              <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            )}

            {/* Tooltip */}
            <div className="absolute left-14 px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10 ml-2">
              {tab.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
