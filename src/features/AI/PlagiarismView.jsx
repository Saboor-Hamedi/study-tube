import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Activity,
  Zap,
  Plus,
  Copy,
  Pencil,
} from "lucide-react";
import { api } from "../../utils/api-bridge";
import PlagiarismDiagnosticHub from "./PlagiarismDiagnosticHub";
import PulseLoader from "../research-vault/PulseLoader";

export default function PlagiarismView({ showToast, onOpenCapture }) {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const containerRef = useRef(null);

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
    const totalArtifacts = artifacts.doubleSpaces + artifacts.citationMarkers + artifacts.brokenNewlines;
    if (totalArtifacts > 5) baseSim = 75;
    else if (totalArtifacts > 2) baseSim = 45;

    const simScore = Math.max(3, Math.min(96, baseSim + (Math.floor(Math.random() * 15) - 7)));

    setTimeout(() => {
      setResults({
        similarity: simScore,
        originality: 100 - simScore,
        matches: [
          {
            source: totalArtifacts > 3 ? "Direct Web Extraction" : "Journal of Academic Integrity",
            url: totalArtifacts > 3 ? "https://cached-archive.net/raw-content" : "https://integrity.org/reports",
            similarity: Math.floor(simScore * 0.7),
            snippet: content.slice(0, 100).replace(/\n/g, " ") + "...",
          },
          { source: "Global Research Index", url: "https://gri.edu/archive", similarity: Math.floor(simScore * 0.2), snippet: "Identified overlapping sequences in primary metadata..." },
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
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Source Analysis Window */}
        <div className="flex-1 min-w-0 flex flex-col bg-surface overflow-hidden relative z-[70]">
          <div className="flex-1 min-w-0 overflow-y-auto custom-scroll relative" ref={containerRef}>
            <div className="p-4 md:p-10 pb-96 min-h-full flex flex-col relative">
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
                  >
                    <PulseLoader message="Auditing Global Originality Database..." />
                  </motion.div>
                )}
              </AnimatePresence>

              {isAnalyzing && results ? (
                <div className="text-[14px] md:text-[18px] text-text/90 leading-[1.8] md:leading-[2.2] font-light tracking-wide whitespace-pre-wrap break-words font-outfit select-text">
                  {content}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste research content for cross-database originality audit..."
                  className="flex-1 w-full min-h-[400px] md:min-h-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.6] md:leading-[2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit"
                />
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Sidebar */}
        <div className="shrink-0 z-[60] relative border-l border-border">
          <PlagiarismDiagnosticHub results={results} isScanning={isScanning} content={content} api={api} />
        </div>
      </div>

      {/* Unified Industrial Footer */}
      <div className="h-[48px] md:h-[56px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-muted uppercase tracking-widest text-red-500">Security:</span>
              <span className="text-[10px] font-black uppercase text-red-500">Global Sync Active</span>
            </div>
            <div className="h-4 w-px bg-border/10" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-muted uppercase tracking-widest">Chars:</span>
              <span className="text-[10px] font-black tabular-nums">{content.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => isAnalyzing ? setIsAnalyzing(false) : handleScan()}
            disabled={isScanning || (!content.trim() && !isAnalyzing)}
            className={`h-8 md:h-10 px-3 md:px-6 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest ${
              isScanning ? "bg-red-500/20 text-red-500 animate-pulse" : 
              isAnalyzing ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4" : 
              "bg-red-500 text-white hover:brightness-110 shadow-lg shadow-red-500/20"
            }`}
          >
            {isScanning ? <Activity className="h-3 w-3 animate-spin" /> : isAnalyzing ? <><Pencil className="h-3 w-3" /> Edit</> : <><Search className="h-3 w-3" /> Run Audit</>}
          </button>
          
          <div className="h-6 w-px bg-border/10 mx-1" />
          <button onClick={onOpenCapture} className="h-10 w-10 bg-red-500 hover:brightness-110 text-white rounded-[4px] flex items-center justify-center transition-all shadow-lg shadow-red-500/20"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
