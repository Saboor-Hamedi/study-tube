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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="bg-surface border border-border/20 shadow-2xl rounded-[12px] overflow-hidden w-[280px] select-text cursor-text"
    >
      <div className="p-3 border-b border-border/10 bg-surface-3/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-blue-400" />
          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-muted">
            Neural Action
          </span>
        </div>
        <span
          className={`text-[7px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider ${getCategoryColor(selectedHl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(selectedHl.type)}`}
        >
          {selectedHl.type}
        </span>
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
          <p className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
            Neural Suggestions
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {(() => {
              const suggestions = Array.isArray(selectedHl.suggestions)
                ? selectedHl.suggestions
                : selectedHl.suggestion
                  ? [selectedHl.suggestion]
                  : [];

              return suggestions.map((s, si) => (
                <div key={si} className="space-y-2">
                  {/* this my "neural swap card" - where i see the old word and the new one side by side */}
                  {/* Section 3: Word & Suggestion */}
                  <div className="flex flex-col gap-1.5 p-2 bg-blue-500/5 border border-blue-500/10 rounded-[6px]">
                    <span className="text-[10px] font-black text-text/40  leading-relaxed">
                      {truncateChars(
                        content.substring(selectedHl.start, selectedHl.end),
                        40,
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-black text-blue-400 leading-snug">
                        {s}
                      </span>
                    </div>
                  </div>

                  {/* Section 4: Action Section (Bottom Right) */}
                  <div className="flex justify-end pt-1 border-t border-border/5">
                    <button
                      onMouseEnter={() =>
                        setGhostPreview({
                          start: selectedHl.start,
                          suggestion: s,
                        })
                      }
                      onMouseLeave={() => setGhostPreview(null)}
                      onClick={() => onApplySuggestion(s, selectedHl)}
                      className="px-4 py-1.5 bg-blue-500 text-white text-[10px] font-black rounded-[6px] hover:brightness-110 transition-all shadow-md"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WritingMenu;
