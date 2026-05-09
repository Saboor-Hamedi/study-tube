import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { User as UserIcon, Settings, Sun, Moon, LogOut } from 'lucide-react'

export default function Dropdow({ view, setView, theme, onToggleTheme }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center relative" ref={profileRef}>
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-64 bg-surface-2 border border-border shadow-2xl z-[250] overflow-hidden rounded-[12px] backdrop-blur-xl"
          >
            {/* User Identity Header */}
            <div className="p-4 bg-surface-3 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
                <UserIcon className="h-5 w-5 text-accent" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black text-text uppercase tracking-tight truncate">Saboor Hamedi</span>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">English Teacher</span>
              </div>
            </div>

            <div className="p-1.5 space-y-0.5">
              <button 
                onClick={() => { setView('profile'); setIsProfileOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/10 transition-all rounded-[3px] border border-accent/10"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Researcher Profile</span>
              </button>

              <div className="h-px bg-border/40 mx-2 my-1" />
              <button 
                onClick={() => { onToggleTheme(); setIsProfileOpen(false) }}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface-3 hover:text-text transition-all rounded-[3px]"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-orange-400" /> : <Moon className="h-3.5 w-3.5 text-accent" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
              </button>

              <button 
                onClick={() => { setView('settings'); setIsProfileOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface-3 hover:text-text transition-all rounded-[3px]"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings Cluster</span>
              </button>

              <div className="h-px bg-border/40 mx-2 my-1" />

              <button 
                onClick={() => { setIsProfileOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-[3px]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Terminate Session</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className={`group flex items-center gap-3 px-3 py-0 h-8 rounded-[12px] transition-all duration-300 ${
          isProfileOpen 
            ? 'bg-accent/10 shadow-sm' 
            : 'hover:bg-white/5'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 border ${
          isProfileOpen 
            ? 'bg-accent text-background border-accent' 
            : 'bg-surface-3 border-border text-muted group-hover:text-text group-hover:border-accent/20'
        }`}>
          <UserIcon className="h-3.5 w-3.5" />
        </div>
        <div className="hidden lg:flex flex-col items-start text-left shrink-0 whitespace-nowrap">
          <span className="text-[10px] font-black text-text uppercase tracking-tight">Saboor Hamedi</span>
          <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">English Teacher</span>
        </div>
      </button>
    </div>
  )
}
