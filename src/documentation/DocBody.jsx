import React, { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ShieldCheck, Clock, Zap } from "lucide-react";

const DocBody = ({ content = "", onNavigate }) => {
  // Extract title and filter out redundant headers
  const { title, cleanContent } = useMemo(() => {
    let raw = content;

    // Remove specific doc titles if they exist
    raw = raw.replace(/# 📖 System Documentation\n?/, "");

    const titleMatch = raw.match(/^#\s+(.+)/);
    const extractedTitle = titleMatch ? titleMatch[1] : "Writella System Node";

    // Remove the main title from the body so we can render it in our custom header
    const bodyContent = raw.replace(/^#\s+.+\n?/, "").trim();

    return { title: extractedTitle, cleanContent: bodyContent };
  }, [content]);

  // Forensic Metadata (Calculated)
  const stats = useMemo(() => {
    const words = cleanContent.split(/\s+/).length;
    const readingTime = Math.ceil(words / 150);
    const complexity =
      words > 1000 ? "Advanced" : words > 500 ? "Technical" : "Core";
    return { readingTime, complexity };
  }, [cleanContent]);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-3 overflow-hidden relative selection:bg-accent/10">
      {/* Background Aesthetic Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f8fafc,transparent)] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#f1f5f9,transparent)] opacity-50 pointer-events-none" />

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin relative z-10 flex flex-col">
        {/* Diagnostic Header */}
        <div className="w-full bg-surface-2/40 backdrop-blur-xl border-b border-border/20 py-6 md:py-8 px-4 sm:px-6 md:px-12 flex justify-center">
          <div className="w-full max-w-5xl relative">
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-2 select-text cursor-text">
                <div className="w-1 h-3 bg-accent/40 rounded-full" />
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] opacity-80">
                  Writella / System Documentation
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto sm:ml-0 select-text cursor-text">
                <ShieldCheck className="h-3 w-3 text-blue-500/40" />
                <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest">
                  Technical Clearance
                </span>
              </div>
            </div>

            <h1 className="text-xl md:text-3xl font-black tracking-tight mb-6 select-text cursor-text leading-tight text-text uppercase">
              {title.replace(/📖|📚|🛠️|⚙️/g, "").trim()}
            </h1>

            <div className="flex flex-wrap gap-6 md:gap-10 select-text cursor-text">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-muted/30 uppercase tracking-[0.25em]">
                  Review Time
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-accent/40" />
                  <span className="text-[10px] font-black tabular-nums text-text/80">
                    {stats.readingTime} MIN
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-muted/30 uppercase tracking-[0.25em]">
                  Archival Class
                </span>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-accent/40" />
                  <span className="text-[10px] font-black uppercase text-text/80">
                    {stats.complexity}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:ml-auto min-w-[120px]">
                <span className="text-[8px] font-black text-muted/30 uppercase tracking-[0.25em]">
                  System Sync
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className="h-full bg-blue-500/40"
                    />
                  </div>
                  <span className="text-[9px] font-mono font-black text-blue-500/60">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Content Body */}
        <div className="flex-1 w-full bg-white flex justify-center border-t border-border/10">
          <div className="w-full max-w-6xl px-6 sm:p-8 md:p-10 py-8">
            <div className="writella-report select-text min-h-[600px]">
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
                        className="text-accent hover:underline cursor-pointer inline-flex items-center gap-1 transition-all"
                      >
                        {children}
                      </a>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="select-text cursor-pointer mb-6 text-xl font-black border-b border-surface-3 pb-4 text-text uppercase tracking-tight">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="select-text cursor-pointer mb-4 mt-12 text-lg font-black flex items-center gap-3 text-text/90 uppercase tracking-tight">
                      <div className="w-1 h-5 bg-blue-500/40 rounded-full shrink-0" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="select-text cursor-pointer mb-3 mt-8 text-[15px] font-black text-text/80 uppercase tracking-wide">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="select-text cursor-auto mb-6 leading-[1.7] text-[13px] md:text-[14px] text-text/70 font-medium">
                      {children}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li className="select-text cursor-auto mb-2 ml-6 text-[13px] md:text-[14px] leading-relaxed text-text/70">
                      {children}
                    </li>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-8 list-disc list-inside space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-8 list-decimal list-inside space-y-1">
                      {children}
                    </ol>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-accent/80 select-text">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic opacity-80 select-text">
                      {children}
                    </em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-surface-3/50 px-1.5 py-0.5 rounded border border-border/10 text-accent/80 font-mono text-[0.8em] select-text">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-[3px] border-accent/20 pl-6 py-2 my-8 italic text-muted/60 bg-accent/[0.01] rounded-r-[6px] select-text">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {cleanContent}
              </ReactMarkdown>
            </div>

            {/* Simplified Footer */}
            <div className="mt-16 pt-8 border-t border-surface-3 flex justify-center">
              <p className="text-[9px] text-muted/20 font-black uppercase tracking-[0.4em] italic select-text">
                System Specification — Writella Documentation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocBody;
