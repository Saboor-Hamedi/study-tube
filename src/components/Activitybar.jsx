import { Search, BookOpen, Settings, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Activitybar({ view, setView }) {

  const mainTabs = [
    { id: 'search', label: 'Discover', icon: Search },
    { id: 'vocab', label: 'Library', icon: BookOpen },
    { id: 'copilot', label: 'Research Assist', icon: Sparkles }
  ]
  
  const bottomTabs = [
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderTab = (tab) => {
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
          <motion.div 
            layoutId="sidebar-active" 
            className="absolute left-0 top-2 w-0.5 h-8 bg-accent rounded-r-full" 
          />
        )}

        {/* Tooltip */}
        <div className="absolute left-14 px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10 ml-2">
          {tab.label}
        </div>
      </button>
    )
  }

  return (
    <div className="w-[68px] h-full shrink-0 bg-[#080808] border-r border-white/5 flex flex-col items-center pt-1 pb-6 relative z-30">
      <div className="flex flex-col gap-6 w-full items-center">
        {mainTabs.map(renderTab)}
      </div>

      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        {bottomTabs.map(renderTab)}
      </div>
    </div>
  )
}
