import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const PulseLoader = ({ message = "Synchronizing Research Archive..." }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Hardware Accelerated Pulse Rings */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-accent rounded-full blur-xl"
        />
        
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="relative z-10 p-4 rounded-full bg-accent/10 border border-accent/20"
        >
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
        </motion.div>
      </div>

      {message && (
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <p className="text-xs font-black uppercase tracking-[0.4em] text-text/80 animate-pulse text-center">
            {message}
          </p>
          <div className="h-[2px] w-12 bg-accent/20 rounded-full overflow-hidden">
            <motion.div 
              animate={{ x: [-48, 48] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-full bg-accent/60"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PulseLoader
