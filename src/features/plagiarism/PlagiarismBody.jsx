import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PulseLoader from "../research-vault/PulseLoader";

const PlagiarismBody = ({
  content,
  setContent,
  isScanning,
  isAnalyzing,
  results,
}) => {
  const containerRef = useRef(null);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-surface overflow-hidden relative z-[70] selection:bg-blue-500/10">
      <div
        className="flex-1 min-w-0 overflow-y-auto custom-scroll relative"
        ref={containerRef}
      >
        <div className="p-4 md:p-10 pb-96 min-h-full flex flex-col relative select-text cursor-text">
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
              >
                <PulseLoader showMessage={false} />
              </motion.div>
            )}
          </AnimatePresence>

          {isAnalyzing && results ? (
            <div className="text-[14px] md:text-[18px] text-text/90 leading-[1.8] md:leading-[2.2] font-light tracking-wide whitespace-pre-wrap break-words font-outfit select-text cursor-text">
              {content}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste research content for cross-database originality audit..."
              className="flex-1 w-full min-h-[400px] md:min-h-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.6] md:leading-[2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit select-text cursor-text"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlagiarismBody;
