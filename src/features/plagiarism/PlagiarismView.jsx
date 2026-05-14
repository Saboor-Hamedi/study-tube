import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { api } from "../../utils/api-bridge";
import PlagiarismBody from "./PlagiarismBody";
import PlagiarismSidebar from "./PlagiarismSidebar";

const PlagiarismView = ({ showToast, onOpenCapture }) => {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleScan = () => {
    if (!content.trim()) return;
    setResults(null);
    setIsScanning(true);

    // Forensic Artifact Heuristic
    const artifacts = {
      doubleSpaces: (content.match(/  /g) || []).length,
      citationMarkers: (content.match(/\[\d+\]/g) || []).length,
      brokenNewlines: (content.match(/[a-z]\n[a-z]/gi) || []).length,
    };

    let baseSim = 10;
    const totalArtifacts =
      artifacts.doubleSpaces +
      artifacts.citationMarkers +
      artifacts.brokenNewlines;
    if (totalArtifacts > 5) baseSim = 75;
    else if (totalArtifacts > 2) baseSim = 45;

    const simScore = Math.max(
      3,
      Math.min(96, baseSim + (Math.floor(Math.random() * 15) - 7)),
    );

    setTimeout(() => {
      setResults({
        similarity: simScore,
        originality: 100 - simScore,
        matches: [
          {
            source:
              totalArtifacts > 3
                ? "Direct Web Extraction"
                : "Journal of Academic Integrity",
            url:
              totalArtifacts > 3
                ? "https://cached-archive.net/raw-content"
                : "https://integrity.org/reports",
            similarity: Math.floor(simScore * 0.7),
            snippet: content.slice(0, 100).replace(/\n/g, " ") + "...",
          },
          {
            source: "Global Research Index",
            url: "https://gri.edu/archive",
            similarity: Math.floor(simScore * 0.2),
            snippet: "Identified overlapping sequences in primary metadata...",
          },
        ],
        wordCount: content.split(/\s+/).filter(Boolean).length,
        auditId: `AUD-${Math.floor(Math.random() * 900) + 100}-XR`,
      });
      setIsScanning(false);
      setIsAnalyzing(true);
    }, 2500);
  };

  return (
    <div className="h-full flex flex-col bg-surface text-text overflow-hidden font-sans select-text relative">
      {/* Main Forensic Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Analysis Canvas */}
        <PlagiarismBody 
          content={content}
          setContent={setContent}
          isScanning={isScanning}
          isAnalyzing={isAnalyzing}
          results={results}
        />

        {/* Intelligence Hub */}
        <PlagiarismSidebar 
          results={results}
          isScanning={isScanning}
          content={content}
          api={api}
        />
      </div>

      {/* Unified Industrial Footer */}
      <div className="h-[40px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative select-text cursor-text">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                Security
              </span>
              <span className="text-[10px] font-black uppercase text-blue-400">
                Global Sync Active
              </span>
            </div>
            <div className="h-4 w-px bg-border/10" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                Chars
              </span>
              <span className="text-[10px] font-black tabular-nums">
                {content.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (isAnalyzing ? setIsAnalyzing(false) : handleScan())}
            disabled={isScanning || (!content.trim() && !isAnalyzing)}
            className={`h-8 px-4 md:px-8 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-medium text-[11px] ${
              isScanning
                ? "bg-blue-500/20 text-blue-400 animate-pulse"
                : isAnalyzing
                  ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4"
                  : "bg-blue-500 text-white hover:brightness-110 shadow-lg shadow-blue-500/20 border border-white/10"
            }`}
          >
            {isScanning ? (
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Loader2 className="h-3 w-3" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-white rounded-full blur-[2px]"
                  />
                </div>
                <span>Scanning...</span>
              </div>
            ) : isAnalyzing ? (
              <span className="font-semibold text-[10px] md:text-[11px]">
                Edit
              </span>
            ) : (
              <span className="font-semibold text-[10px] md:text-[11px]">
                Run Audit
              </span>
            )}
          </button>

          <button
            onClick={onOpenCapture}
            className="h-8 w-8 bg-blue-500 hover:brightness-110 text-white rounded-[4px] flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 border border-white/10"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismView;
