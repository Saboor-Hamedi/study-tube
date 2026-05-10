import React from "react";
import { motion } from "framer-motion";
import { X, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function ForensicDropdown({
  selectedHl,
  content,
  onApplySuggestion,
  onClose,
  onMouseEnter,
  onMouseLeave,
  getCategoryColor,
  getCategoryBg,
}) {
  if (!selectedHl) return null;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: selectedHl.preferUp ? -10 : 10,
        scale: 0.95,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: selectedHl.preferUp ? -10 : 10,
        scale: 0.95,
      }}
      style={{
        top: selectedHl.top,
        left: selectedHl.left,
        transform: selectedHl.preferUp ? "translateY(-100%)" : "none",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute z-[110] w-[220px] bg-surface-2 border border-border shadow-2xl rounded-[10px] overflow-hidden flex flex-col font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`h-1 w-full ${getCategoryBg(selectedHl.type).replace("0.1", "1")}`}
      />
      <div className="p-3 space-y-3">
        {/* Compact Header with Integrated Apply Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span
              className={`text-[6px] font-black uppercase tracking-[0.15em] ${getCategoryColor(selectedHl.type)}`}
            >
              {selectedHl.reason}
            </span>
            <h4 className="text-[9px] font-black text-text uppercase leading-tight">
              Flag {selectedHl.index}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onApplySuggestion(selectedHl.suggestion)}
              className="h-6 px-2 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-[4px] font-black text-[7px] uppercase tracking-widest transition-all flex items-center gap-1 border border-accent/20"
            >
              <CheckCircle className="h-2.5 w-2.5" />
              Apply
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-3 rounded-md text-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Forensic Data */}
        <div className="space-y-2.5">
          <div className="p-2 bg-surface-3/30 border border-border/5 rounded-[6px] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[6px] font-bold text-muted uppercase shrink-0">
                Orig
              </span>
              <span className="text-[8px] font-bold text-red-500 line-through opacity-40 truncate">
                {content.substring(selectedHl.start, selectedHl.end)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[6px] font-bold text-muted uppercase shrink-0">
                Fix
              </span>
              <div className="flex items-center gap-1 min-w-0">
                <ArrowRight className="h-2 w-2 text-green-500" />
                <span className="text-[9px] font-black text-green-500 truncate">
                  {selectedHl.suggestion}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[6px] font-bold text-muted uppercase flex items-center gap-1">
              <AlertCircle className="h-2 w-2" /> Analysis
            </span>
            <p className="text-[8px] text-text/60 leading-relaxed font-medium italic">
              "{selectedHl.explanation}"
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
