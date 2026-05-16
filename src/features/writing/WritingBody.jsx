import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PulseLoader from "../research-vault/PulseLoader";

const WritingBody = ({
  content,
  setContent,
  isAnalyzing,
  isNeuralScanning,
  diagnostics,
  getCategoryBg,
  getCategoryColor,
  ghostPreview,
  showHl,
  hideHl,
  scrollToAnomaly,
  takeSnapshot,
}) => {
  const textareaRef = useRef(null);

  // this my "auto-growing editor" - keeps the workspace clean as i write more
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-surface relative z-[70] selection:bg-blue-500/10">
      <div className="flex-1 min-w-0 overflow-y-auto custom-scroll relative">
        {/* this my "document canvas" - true full-width layout with scroll clearance */}
        <div className="w-full max-w-none p-4 md:px-6 md:py-10 pb-96 min-h-full flex flex-col relative select-text cursor-text">
          <AnimatePresence>
            {/* this my "neural scanning shield" - keeps me focused while the brain is working */}
            {isNeuralScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
              >
                <PulseLoader />
              </motion.div>
            )}
          </AnimatePresence>

          {isAnalyzing ? (
            <div className="w-full relative">
              <div className="w-full text-[14px] md:text-[18px] text-text/90 leading-[1.8] md:leading-[2.2] font-light tracking-wide whitespace-pre-wrap break-words font-outfit select-text cursor-text">
                {(() => {
                  let lastIndex = 0;
                  const elements = [];
                  const highlights = diagnostics?.highlights || [];
                  const sorted = [...highlights].sort(
                    (a, b) => a.start - b.start,
                  );

                  sorted.forEach((hl, i) => {
                    if (hl.start < lastIndex) return;
                    elements.push(content.substring(lastIndex, hl.start));
                    elements.push(
                      <motion.span
                        key={i}
                        id={`hl-${i + 1}`}
                        className="cursor-pointer transition-all relative inline group/hl font-light tracking-wide"
                        onClick={(e) => {
                          e.stopPropagation();
                          showHl(hl, i, e);
                          scrollToAnomaly(i + 1);
                        }}
                      >
                        {content
                          .substring(hl.start, hl.end)
                          .split("\n")
                          .map((part, partIdx, arr) => (
                            <React.Fragment key={partIdx}>
                              {partIdx > 0 && "\n"}
                              <span
                                // this my "zero-shift grid" - back to the stack but with better baseline logic
                                className="relative inline-grid grid-cols-1 grid-rows-1 align-baseline rounded-sm transition-colors duration-200"
                                style={{ display: "inline-grid" }}
                              >
                                {/* this my "old word sliding up" */}
                                <motion.span
                                  className="grid-area-1-1 font-light tracking-wide px-[2px] mx-[0.5px] rounded-[2px]"
                                  style={{
                                    gridArea: "1/1",
                                    // this my "industrial highlight" - clean colors with microscopic vertical gaps to prevent merging
                                    background: `linear-gradient(to bottom, transparent 4%, ${getCategoryBg(hl.type)} 4%, ${getCategoryBg(hl.type)} 95%, transparent 95%)`,
                                  }}
                                  animate={{
                                    y: ghostPreview?.start === hl.start ? -15 : 0,
                                    opacity: ghostPreview?.start === hl.start ? 0 : 1,
                                  }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                >
                                  {part}
                                </motion.span>

                                {/* this my "new word sliding in" - showing me the future before i commit */}
                                {ghostPreview?.start === hl.start && partIdx === arr.length - 1 && (
                                  <motion.span
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    // this my "ghost stack" - sharing the exact same grid space as the original
                                    className="grid-area-1-1 font-light tracking-wide whitespace-nowrap text-[14px] md:text-[18px] pointer-events-none select-none"
                                    style={{ gridArea: "1/1" }}
                                  >
                                    {ghostPreview.suggestion === "Omit" ? (
                                      <span className="opacity-20 line-through">
                                        {part}
                                      </span>
                                    ) : (
                                      ghostPreview.suggestion
                                    )}
                                  </motion.span>
                                )}
                              </span>
                            </React.Fragment>
                          ))}
                        <span
                          // this my "anomaly index" - perfect circles for an industrial look
                          className={`absolute -top-3.5 -right-3.5 w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-full shadow-sm border border-white/10 select-none cursor-pointer ${getCategoryColor(hl.type)} ${getCategoryColor(
                            hl.type,
                          )
                            .replace("text-", "bg-")
                            .replace(/-(400|500)/, "-$1/20")}`}
                          style={{
                            backgroundColor: getCategoryBg(hl.type).replace(
                              "0.1",
                              "0.25",
                            ),
                          }}
                        >
                          {i + 1}
                        </span>
                      </motion.span>,
                    );
                    lastIndex = hl.end;
                  });
                  elements.push(content.substring(lastIndex));
                  return elements;
                })()}
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => takeSnapshot(content)}
              placeholder="Paste academic manuscript for neural forensic auditing..."
              // this my "industrial editor" - matched line-height exactly with read-mode to prevent jumping
              className="flex-1 w-full min-h-[400px] md:min-h-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.8] md:leading-[2.2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit select-text cursor-text"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingBody;
