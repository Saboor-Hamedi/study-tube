import React from "react";
import { motion } from "framer-motion";
import { X, ArrowRight, AlertCircle, CheckCircle, PlusCircle, Trash2 } from "lucide-react";

export default function ForensicDropdown({
  selectedHl,
  content,
  onApplySuggestion,
  onAddToDictionary,
  onClose,
  onMouseEnter,
  onMouseLeave,
  getCategoryColor,
  getCategoryBg,
}) {
  if (!selectedHl) return null;

  const previewStart = Math.max(0, selectedHl.start - 30);
  const previewEnd = Math.min(content.length, selectedHl.end + 30);
  const prefix = content.substring(previewStart, selectedHl.start);
  const suffix = content.substring(selectedHl.end, previewEnd);
  const originalWord = content.substring(selectedHl.start, selectedHl.end);

  return (
    <motion.div
      initial={{ opacity: 0, y: selectedHl.preferUp ? -10 : 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: "fixed",
        top: selectedHl.top,
        left: selectedHl.left,
        transform: "none",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`z-[999] w-[220px] bg-[var(--surface-2)] border border-[var(--border)] ${getCategoryColor(selectedHl.type).replace("text-", "border-t-")} border-t-2 shadow-2xl rounded-lg overflow-hidden flex flex-col font-sans backdrop-blur-xl pointer-events-auto`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 space-y-3">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`p-0.5 rounded ${getCategoryBg(selectedHl.type)}`}>
              <AlertCircle className={`h-2.5 w-2.5 ${getCategoryColor(selectedHl.type)}`} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black tracking-tight text-text`}>
                  {originalWord}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-wider ${getCategoryColor(selectedHl.type)}`}>
                  {selectedHl.reason || "Audit"}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <X className="h-2 w-2 text-red-500/50" />
                <span className="text-[6px] font-bold text-red-500/40 uppercase tracking-tighter">Forensic Flag (Unverified)</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--surface-3)] rounded text-muted transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* The Comparison HUD */}
        <div className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md p-2 relative overflow-hidden group/card">
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-black text-red-500/40 uppercase tracking-widest">Flagged</span>
              <X className="h-2 w-2 text-red-500/40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-red-500/60 line-through font-bold truncate">
                {originalWord}
              </span>
              <ArrowRight className="h-3 w-3 text-emerald-500/50" />
              <span className="text-[11px] text-emerald-500 font-black truncate">
                {selectedHl.suggestion === "Omit" ? "Delete" : selectedHl.suggestion}
              </span>
            </div>
          </div>

          <button
            onClick={() => onApplySuggestion(selectedHl.suggestion)}
            className="w-full h-7 bg-emerald-500 hover:bg-emerald-400 text-white rounded font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
          >
            <CheckCircle className="h-3 w-3" />
            Apply
          </button>
        </div>

        {/* Analysis Section */}
        <div className="px-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[7px] font-black text-muted/30 uppercase tracking-[0.2em]">Logic</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <p className="text-[10px] text-text/80 leading-relaxed font-medium">
            {selectedHl.explanation}
          </p>
        </div>

        {/* Action Grid */}
        <div className="pt-2 flex items-center gap-1.5 border-t border-[var(--border)]">
          <button 
            className="flex-1 h-7 flex items-center justify-center gap-1 hover:bg-red-500/5 rounded text-[8px] font-bold text-muted hover:text-red-500 transition-all uppercase tracking-wider border border-transparent hover:border-red-500/10"
            onClick={onClose}
          >
            <Trash2 className="h-2.5 w-2.5" />
            Ignore
          </button>
          <button 
            className="flex-1 h-7 flex items-center justify-center gap-1 hover:bg-accent/5 rounded text-[8px] font-bold text-muted hover:text-accent transition-all uppercase tracking-wider border border-transparent hover:border-accent/10"
            onClick={() => onAddToDictionary(originalWord)}
          >
            <PlusCircle className="h-2.5 w-2.5" />
            Dictionary
          </button>
        </div>
      </div>
    </motion.div>
  );
}
