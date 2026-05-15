import React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MessageSquare,
  ArrowRight,
  Zap,
  AlertCircle,
  EyeOff,
  BookOpen,
  X,
} from "lucide-react";
import { truncateChars } from "../../utils/textUtils";

const WritingMenu = ({
  selectedHl,
  content,
  onApplySuggestion,
  onAddToDictionary,
  onIgnore,
  onClose,
  onMouseEnter,
  onMouseLeave,
  setGhostPreview,
  getCategoryColor,
  getCategoryBg,
  placement = "bottom",
}) => {
  if (!selectedHl) return null;

  const isTop = placement.startsWith("top");

  return (
    // this my "surgical hud" - the little brain that follows my cursor
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: isTop ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: isTop ? -10 : 10 }}
      className="bg-surface border border-border/20 shadow-2xl rounded-[12px] overflow-hidden w-[280px] select-text cursor-text"
    >
      <div className="p-3 border-b border-border/10 bg-surface-3/30 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-2.5 w-2.5 text-blue-400" />
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted/60">
            Audit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[7px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider ${getCategoryColor(selectedHl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(selectedHl.type)}`}
          >
            {selectedHl.type}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-4 rounded-full transition-colors text-muted hover:text-text"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 bg-surface-2/50 border-b border-border/10 flex items-center gap-2">
        {/* this my "vocabulary forge" - adding words so the engine remembers them */}
        <button
          onClick={() =>
            onAddToDictionary(
              content.substring(selectedHl.start, selectedHl.end),
            )
          }
          className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-surface-3 transition-colors rounded-[6px] border border-border/5"
        >
          <BookOpen className="h-3 w-3 text-blue-400" />
          <span className="text-[8px] font-black text-text/80 uppercase tracking-widest">
            Dictionary
          </span>
        </button>
        <button
          onClick={() => onIgnore(selectedHl)}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-[6px] border border-border/5"
        >
          <EyeOff className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-widest">
            Ignore
          </span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-black text-text/90 leading-snug">
            {selectedHl.reason || selectedHl.message}
          </p>
          {selectedHl.explanation && (
            <p className="text-[9px] text-muted leading-relaxed opacity-60">
              {selectedHl.explanation}
            </p>
          )}
        </div>

        <div className="space-y-2">
            {(() => {
              const suggestions = Array.isArray(selectedHl.suggestions)
                ? selectedHl.suggestions
                : selectedHl.suggestion
                  ? [selectedHl.suggestion]
                  : [];

              return suggestions.map((s, si) => (
                <div key={si} className="group/suggest space-y-3">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[7px] font-black text-muted/30 uppercase tracking-widest mb-1">Current</p>
                      <p className="text-[11px] font-black text-text/40 truncate italic">
                        {truncateChars(content.substring(selectedHl.start, selectedHl.end), 20)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center">
                       <ArrowRight className="h-3 w-3 text-blue-400/30 group-hover/suggest:text-blue-400 transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[7px] font-black text-blue-400/40 uppercase tracking-widest mb-1">Suggest</p>
                      <p className="text-[11px] font-black text-blue-400 leading-none">
                        {s}
                      </p>
                    </div>
                  </div>

                  <button
                    onMouseEnter={() => setGhostPreview({ start: selectedHl.start, suggestion: s })}
                    onMouseLeave={() => setGhostPreview(null)}
                    onClick={() => onApplySuggestion(s, selectedHl)}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-white text-[9px] font-black uppercase tracking-[0.1em] rounded-[8px] transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                  >
                    Apply Neural Logic
                  </button>
                </div>
              ));
            })()}
        </div>
      </div>
    </motion.div>
  );
};

export default WritingMenu;
