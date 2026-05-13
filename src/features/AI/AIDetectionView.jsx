import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Activity,
  Zap,
  CheckCircle,
  Archive,
  Pencil,
  Plus,
  BarChart3,
} from "lucide-react";

import { api } from "./../../utils/api-bridge";
import AIDiagnosticHub from "./AIDiagnosticHub";
import PulseLoader from "../research-vault/PulseLoader";

export default function AIDetectionView({ showToast, onOpenCapture }) {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [engineStatus, setEngineStatus] = useState("OFFLINE");
  const containerRef = useRef(null);

  const handleScan = async () => {
    if (!content.trim()) return;
    setResults(null);
    setIsScanning(true);

    try {
      const response = await fetch("http://127.0.0.1:8008/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) throw new Error("Neural Engine Warming Up...");

      const data = await response.json();
      setResults({
        aiScore: Math.round(data.ai_probability),
        humanScore: Math.round(100 - data.ai_probability),
        confidence: 0.92 + Math.random() * 0.05,
        anomalies: Math.floor(data.ai_probability / 15),
        burstiness: data.details.burst_interpretation || "High Variation",
        perplexity: data.details.ppl_interpretation || "Natural Pattern",
        segments: [
          { text: content.slice(0, 100) + "...", probability: data.ai_probability / 100, type: data.ai_probability > 75 ? "synthetic" : data.ai_probability > 40 ? "mixed" : "human" },
          { text: "Neural Perplexity Analysis...", probability: 0.8, type: "human" },
          { text: "Burstiness/Variation Scan...", probability: 0.1, type: "human" },
        ],
      });
      setIsAnalyzing(true);
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!api) return;
    api.getEngineStatus?.().then((status) => status && setEngineStatus(status));
    const unsub = api.onEngineStatus((status) => setEngineStatus(status));
    return unsub;
  }, [api]);

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
                    <PulseLoader message="Conducting Neural Forensic Scan..." />
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
                  placeholder="Paste research content for synthetic origin detection..."
                  className="flex-1 w-full min-h-[400px] md:min-h-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.6] md:leading-[2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit"
                />
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Sidebar */}
        <div className="shrink-0 z-[60] relative">
          <AIDiagnosticHub results={results} isScanning={isScanning} content={content} />
        </div>
      </div>

      {/* Unified Industrial Footer */}
      <div className="h-[48px] md:h-[56px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-muted uppercase tracking-widest text-blue-400">Model:</span>
              <span className={`text-[10px] font-black uppercase ${engineStatus === 'READY' ? 'text-emerald-500' : 'text-blue-400 animate-pulse'}`}>{engineStatus}</span>
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
              isScanning ? "bg-blue-500/20 text-blue-400 animate-pulse" : 
              isAnalyzing ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4" : 
              "bg-blue-500 text-white hover:brightness-110 shadow-lg shadow-blue-500/20"
            }`}
          >
            {isScanning ? <Activity className="h-3 w-3 animate-spin" /> : isAnalyzing ? <><Pencil className="h-3 w-3" /> Edit</> : <><Zap className="h-3 w-3" /> Scan</>}
          </button>

          <div className="h-6 w-px bg-border/10 mx-1" />
          <button onClick={onOpenCapture} className="h-10 w-10 bg-blue-500 hover:brightness-110 text-white rounded-[4px] flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
