import { Bell, Info, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef(null)

  const notifications = [
    { id: 1, type: 'insight', text: 'New neural pattern detected in Research Editor', time: '2m ago', icon: Zap, color: 'text-accent' },
    { id: 2, type: 'alert', text: 'Storage reaching 85% capacity', time: '1h ago', icon: AlertTriangle, color: 'text-orange-500' },
    { id: 3, type: 'system', text: 'Sync completed with global research node', time: '3h ago', icon: CheckCircle, color: 'text-green-500' },
  ]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center relative" ref={bellRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${isOpen ? 'bg-accent/10 text-accent' : 'text-muted/40 hover:bg-white/5 hover:text-text'}`}
      >
        <Bell className="h-4 w-4" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-surface shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-80 bg-surface-2 border border-border shadow-2xl z-[250] overflow-hidden rounded-[12px] backdrop-blur-xl"
          >
            <div className="p-4 bg-surface-3 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-black text-text uppercase tracking-[0.2em]">Neural Alerts</span>
              <span className="text-[8px] font-bold text-accent uppercase tracking-widest cursor-pointer hover:underline">Mark all read</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
              {notifications.map(notif => (
                <div key={notif.id} className="p-4 border-b border-border/10 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex gap-3">
                    <div className={`mt-0.5 ${notif.color}`}>
                      <notif.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] text-text/80 leading-relaxed font-medium group-hover:text-text">{notif.text}</p>
                      <span className="text-[8px] font-bold text-muted uppercase tracking-widest">{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-surface-3/50 border-t border-border flex items-center justify-center">
               <button className="text-[9px] font-black text-muted uppercase tracking-widest hover:text-text transition-colors">View All Transmissions</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
