import { 
  Search, 
  BookOpen, 
  Settings, 
  Sparkles, 
  FileDown, 
  Sun, 
  Moon, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  GraduationCap 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

export default function Activitybar({ view, setView, onExport, theme, onToggleTheme, onOpenGrammar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const mainTabs = [
    { id: 'search', label: 'Discover', icon: Search },
    { id: 'vocab', label: 'Library', icon: BookOpen },
    { id: 'editor', label: 'Research Editor', icon: FileText },
    { id: 'copilot', label: 'Research Assist', icon: Sparkles },
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const renderTab = (tab) => {
    const active = view === tab.id || (tab.id === 'vocab' && view === 'research-detail')
    
    return (
      <button
        key={tab.id}
        onClick={() => setView(tab.id)}
        className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 group ${active ? 'bg-accent/10 text-accent' : 'text-muted/40 hover:bg-surface-2 hover:text-text'}`}
      >
        <tab.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
        
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-2 w-0.5 h-8 bg-accent"
          />
        )}
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-bold uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[200]">
          {tab.label}
        </div>
      </button>
    )
  }

  return (
    <div className="w-[68px] h-full shrink-0 bg-surface-3 border-r border-border flex flex-col items-center pt-2 pb-6 relative z-[100] transition-colors duration-500">
      <div className="flex flex-col gap-1 w-full items-center">
        {mainTabs.map(renderTab)}
        
        <button
          onClick={onOpenGrammar}
          className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 group ${view === 'grammar' ? 'bg-accent/10 text-accent' : 'text-muted/40 hover:bg-surface-2 hover:text-text'}`}
        >
          <GraduationCap className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          {view === 'grammar' && (
            <motion.div 
              layoutId="sidebar-active" 
              className="absolute left-0 top-2 w-0.5 h-8 bg-accent" 
            />
          )}
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-bold uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[200]">
            Grammar Archive
          </div>
        </button>
      </div>

      <div className="mt-auto w-full flex flex-col items-center relative" ref={dropdownRef}>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              className="absolute bottom-5 left-full ml-0 w-48 bg-surface-2 border border-border shadow-xl z-[250] overflow-hidden rounded-[5px] backdrop-blur-xl"
            >
              <div className="p-1.5 space-y-0.5">
                <button 
                  onClick={() => { setView('settings'); setIsDropdownOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface-3 hover:text-text transition-all rounded-[3px]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </button>

                <button 
                  onClick={() => { onToggleTheme(); setIsDropdownOpen(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface-3 hover:text-text transition-all rounded-[3px]"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-orange-400" /> : <Moon className="h-3.5 w-3.5 text-accent" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                </button>

                <div className="h-px bg-border/40 mx-2 my-1" />

                <button 
                  onClick={() => { onExport(); setIsDropdownOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-accent/10 hover:text-accent transition-all rounded-[3px]"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Export Archive</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${isDropdownOpen ? 'bg-accent/20 border-accent/40 text-accent ring-2 ring-accent/10' : 'bg-surface-2 border-border text-muted/60 hover:border-accent/30 hover:text-text hover:shadow-xl hover:-translate-y-0.5'}`}
        >
          <UserIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
