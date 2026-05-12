import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Trash2,
} from "lucide-react";

const ForensicDropdown = ({
  selectedHl,
  content,
  onApplySuggestion,
  onAddToDictionary,
  onClose,
  onMouseEnter,
  onMouseLeave,
  setGhostPreview,
  getCategoryColor,
  getCategoryBg,
}) => {
  if (!selectedHl) return null;

  const previewStart = Math.max(0, selectedHl.start - 30);
  const previewEnd = Math.min(content.length, selectedHl.end + 30);
  const prefix = content.substring(previewStart, selectedHl.start);
  const suffix = content.substring(selectedHl.end, previewEnd);
  const originalWord = content.substring(selectedHl.start, selectedHl.end);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`z-[9999] w-[260px] bg-[var(--surface-2)] border border-[var(--border)] ${getCategoryColor(selectedHl.type).replace("text-", "border-t-")} border-t-2 shadow-2xl rounded-lg overflow-hidden flex flex-col font-sans pointer-events-auto`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Industrial Title Bar */}
      <div className="h-7 bg-surface-3 border-b border-border flex items-center justify-between pl-3 shrink-0">
        <span className="text-[7px] font-black text-muted/40 capitalize tracking-[0.2em]">
          Forensic Audit
        </span>
        <button
          onClick={onClose}
          className="h-full px-3 hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors border-l border-border"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      {/* Secondary Utility Bar */}
      <div className="flex items-center gap-px bg-border/20 border-b border-border shrink-0">
        <button
          className="flex-1 h-7 flex items-center justify-center gap-1.5 hover:bg-red-500/5 bg-surface-2 text-[8px] font-bold text-muted hover:text-red-500 transition-all capitalize tracking-wider"
          onClick={onClose}
        >
          <Trash2 className="h-2.5 w-2.5" />
          Ignore
        </button>
        <button
          className="flex-1 h-7 flex items-center justify-center gap-1.5 hover:bg-accent/5 bg-surface-2 text-[8px] font-bold text-muted hover:text-accent transition-all capitalize tracking-wider"
          onClick={() => onAddToDictionary(originalWord)}
        >
          <PlusCircle className="h-2.5 w-2.5" />
          Dictionary
        </button>
      </div>

      <div className="p-2 space-y-3">
        {/* Analysis Header - Repositioned under Title Bar */}
        <div className="flex items-stretch gap-2.5">
          {/* Left Icon Rail */}
          <div className="flex flex-col items-center shrink-0 py-0.5">
            <div
              className={`p-0.5 rounded ${getCategoryBg(selectedHl.type)} flex mb-auto`}
            >
              <AlertCircle
                className={`h-3 w-3 ${getCategoryColor(selectedHl.type)}`}
              />
            </div>
            <X className="h-3 w-3 text-red-500/40 mt-auto" />
          </div>

          {/* Right Text Content Rail */}
          <div className="flex flex-col min-w-0 gap-1.5 flex-1">
            <span className="text-[13px] font-black tracking-tight text-text truncate max-w-[160px] leading-tight">
              {originalWord}
            </span>
            <div className="flex">
              <span
                className={`text-[8px] font-black capitalize tracking-wider ${getCategoryColor(selectedHl.type)} bg-current/5 px-1.5 py-0.5 rounded-sm`}
              >
                {selectedHl.reason || "Audit"}
              </span>
            </div>
            <span className="text-[9px] font-bold text-red-500/60 capitalize tracking-tight italic leading-none py-0.5">
              {selectedHl.explanation === "This word is not recognized by the system." 
                ? "Not Recognized by System" 
                : "Linguistic Anomaly"}
            </span>
          </div>
        </div>

        {/* The Comparison HUD */}
        <div className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md p-2 relative overflow-hidden group/card">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-black text-red-500/40 capitalize tracking-widest">
                Flagged
              </span>
              <X className="h-2 w-2 text-red-500/40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-red-500/60 line-through font-bold truncate">
                {originalWord}
              </span>
              <ArrowRight className="h-3 w-3 text-emerald-500/50" />
              <span className="text-[11px] text-emerald-500 font-black truncate">
                {selectedHl.suggestion === "Omit"
                  ? "Delete"
                  : selectedHl.suggestion}
              </span>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="px-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[7px] font-black text-muted/30 capitalize tracking-[0.2em]">
              Logic
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <p className="text-[10px] text-text/80 leading-relaxed font-medium">
            {selectedHl.explanation}
          </p>
        </div>
      </div>

      {/* Footer Action Rail */}
      <div className="p-2 bg-surface-3 border-t border-border flex justify-end">
        <button
          onClick={() => {
            setGhostPreview(null);
            onApplySuggestion(selectedHl.suggestion);
          }}
          onMouseEnter={() => setGhostPreview(selectedHl)}
          onMouseLeave={() => setGhostPreview(null)}
          className="h-6 px-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded text-[8px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10 active:scale-95 shrink-0"
        >
          Apply
        </button>
      </div>
    </motion.div>
  );
};

export default memo(ForensicDropdown);
