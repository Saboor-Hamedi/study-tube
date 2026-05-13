import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, BookOpen } from "lucide-react";

const GrammarViewer = ({ content }) => (
  <pre className="text-[12px] leading-relaxed text-text/80 font-mono p-4 bg-surface-3/50 rounded-[4px] overflow-auto max-h-[400px] border border-border/5 whitespace-pre-wrap">
    {content}
  </pre>
);

const MainGrammarModel = memo(({ grammars, isOpen, onClose, setView }) => {
  const [index, setIndex] = useState(0);

  if (!isOpen || !grammars || grammars.length === 0) return null;

  const current = grammars[index];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface-2 border border-border/10 rounded-[12px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/5 bg-surface-3/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setView?.("vocab");
                  onClose();
                }}
                className="p-2 bg-accent/10 rounded-[6px] hover:bg-accent/20 transition-all group"
                title="Go to Library"
              >
                <BookOpen className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <h2 className="text-[14px] font-black uppercase tracking-widest text-text">
                  Grammar Archive
                </h2>
                <p className="text-[10px] text-muted font-bold tracking-tight uppercase opacity-50">
                  {current.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/10 text-muted hover:text-red-500 transition-all rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            <GrammarViewer content={current.content} />
          </div>

          {/* Pagination Actions */}
          <div className="px-6 py-4 bg-surface-3/30 border-t border-border/5 flex items-center justify-between">
            <div className="text-[10px] font-mono text-muted/40 uppercase tracking-widest">
              Entry {index + 1} of {grammars.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
                className="p-2 bg-surface-3 border border-border/10 rounded-[6px] text-muted hover:text-accent disabled:opacity-20 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                disabled={index === grammars.length - 1}
                onClick={() => setIndex((i) => i + 1)}
                className="p-2 bg-surface-3 border border-border/10 rounded-[6px] text-muted hover:text-accent disabled:opacity-20 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default MainGrammarModel;
