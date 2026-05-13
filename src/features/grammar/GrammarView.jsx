import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Search } from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const GrammarViewer = ({ content, onNavigate }) => (
  <div className="neural-report select-text cursor-text bg-surface-2 p-8 rounded-[8px] shadow-sm border border-border/10 min-h-[500px]">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const isInternal = href?.endsWith(".md");
          return (
            <a
              href={href}
              onClick={(e) => {
                if (isInternal) {
                  e.preventDefault();
                  onNavigate(href);
                }
              }}
              className="text-accent hover:underline cursor-pointer"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

const GrammarView = ({ grammars, setView }) => {
  const [index, setIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Force Introduction to be first on the frontend
  const sortedGrammars = [...grammars].sort((a, b) => {
    if (a.name.toLowerCase() === "introduction.md") return -1;
    if (b.name.toLowerCase() === "introduction.md") return 1;
    return a.name.localeCompare(b.name);
  });

  const handleNavigate = (fileName) => {
    const targetIndex = sortedGrammars.findIndex(
      (g) => g.name.toLowerCase() === fileName.toLowerCase(),
    );
    if (targetIndex !== -1) {
      setIndex(targetIndex);
      const scrollContainer = document.querySelector(".grammar-scroll-area");
      if (scrollContainer) scrollContainer.scrollTop = 0;
    }
  };

  if (!sortedGrammars || sortedGrammars.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 text-muted/20 mx-auto" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted/40">
            Archive Empty or Loading...
          </p>
        </div>
      </div>
    );
  }

  const filteredGrammars = sortedGrammars.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const current = filteredGrammars[index] || filteredGrammars[0];
  const safeIndex = filteredGrammars.indexOf(current);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-background overflow-hidden"
    >
      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-12 pt-2 pb-12 grammar-scroll-area">
        <div className="max-w-4xl mx-auto">
          {/* Integrated Control Hub (Ghost Sticky) */}
          <div className="flex items-center justify-between sticky top-0 z-10 py-4 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              {current?.name?.toLowerCase() !== "introduction.md" && (
                <button
                  onClick={() => handleNavigate("introduction.md")}
                  className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-accent/30 hover:text-accent transition-colors group"
                >
                  <div className="h-3 w-3 rounded-full bg-accent/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <ChevronLeft className="h-2 w-2" />
                  </div>
                  Archive Hub
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                disabled={safeIndex <= 0}
                onClick={() => setIndex((i) => i - 1)}
                className="p-1.5 hover:bg-surface-3 text-muted hover:text-accent disabled:opacity-10 transition-all rounded-full"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <div className="text-[8px] font-mono font-black text-muted/40 min-w-[30px] text-center tracking-tighter">
                {safeIndex + 1}/{filteredGrammars.length}
              </div>
              <button
                disabled={safeIndex >= filteredGrammars.length - 1}
                onClick={() => setIndex((i) => i + 1)}
                className="p-1.5 hover:bg-surface-3 text-muted hover:text-accent disabled:opacity-10 transition-all rounded-full"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <GrammarViewer
            content={current?.content}
            onNavigate={handleNavigate}
          />

          <div className="pt-12 border-t border-border/10">
            <p className="text-[10px] text-muted/40 font-bold uppercase tracking-[0.2em] text-center italic">
              End of Neural Archive Block
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(GrammarView);
