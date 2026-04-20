import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const PulseLoader = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="relative z-10"
        >
          <Loader2 className="h-5 w-5 text-accent/60" />
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 2, 1], opacity: [0, 0.15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-accent rounded-full blur-md"
        />
      </div>

      {message && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-[9px] font-black uppercase tracking-[0.3em] text-accent/40"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

export default PulseLoader
