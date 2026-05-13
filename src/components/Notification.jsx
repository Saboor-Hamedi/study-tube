// Thisis the Toast notification.
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";

const Notification = memo(({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
          className="fixed top-[48px] right-14 z-[1000] w-[320px] px-6 py-[12px] bg-surface border border-border flex items-center gap-4 backdrop-blur-2xl transition-colors duration-500 rounded-[12px] shadow-2xl shadow-black/40"
        >
          <div
            className={`p-1.5 rounded-[5px] ${toast.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 flex flex-col pr-4 border-r border-border min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-text truncate">
              {toast.msg}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-tighter text-muted">
              System Signal
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/10 text-muted/40 hover:text-red-500 transition-all flex-shrink-0 rounded-[6px] group/close"
          >
            <X className="h-3.5 w-3.5 transition-transform group-hover/close:rotate-90" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default Notification;
