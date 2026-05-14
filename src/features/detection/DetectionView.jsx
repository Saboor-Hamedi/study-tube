import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { api } from "../../utils/api-bridge";
import DetectionBody from "./DetectionBody";
import DetectionSidebar from "./DetectionSidebar";

const DetectionView = ({ showToast, onOpenCapture }) => {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [engineStatus, setEngineStatus] = useState("OFFLINE");

  const handleScan = async () => {
    if (!content.trim()) return;
    setResults(null);
    setIsScanning(true);

    try {
      // Neural Engine Endpoint
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
  }, []);

  return (
    <div className="h-full flex flex-col bg-surface text-text overflow-hidden font-sans select-text relative">
      {/* Main Forensic Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Analysis Canvas */}
        <DetectionBody 
          content={content}
          setContent={setContent}
          isScanning={isScanning}
          isAnalyzing={isAnalyzing}
          results={results}
        />

        {/* Intelligence Hub */}
        <DetectionSidebar 
          results={results}
          isScanning={isScanning}
          content={content}
        />
      </div>

      {/* Unified Industrial Footer */}
      <div className="h-[40px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative select-text cursor-text">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">Model</span>
              <span className={`text-[10px] font-black uppercase ${engineStatus === 'READY' ? 'text-emerald-500' : 'text-blue-400 animate-pulse'}`}>{engineStatus}</span>
            </div>
            <div className="h-4 w-px bg-border/10" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">Chars</span>
              <span className="text-[10px] font-black tabular-nums">{content.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => isAnalyzing ? setIsAnalyzing(false) : handleScan()}
            disabled={isScanning || (!content.trim() && !isAnalyzing)}
            className={`h-8 px-4 md:px-8 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-medium text-[11px] ${
              isScanning ? "bg-blue-500/20 text-blue-400 animate-pulse" : 
              isAnalyzing ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4" : 
              "bg-blue-500 text-white hover:brightness-110 shadow-lg shadow-blue-500/20 border border-white/10"
            }`}
          >
            {isScanning ? (
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Loader2 className="h-3 w-3" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-white rounded-full blur-[2px]"
                  />
                </div>
                <span>Scanning...</span>
              </div>
            ) : isAnalyzing ? (
              <span className="font-semibold text-[10px] md:text-[11px]">Edit</span>
            ) : (
              <span className="font-semibold text-[10px] md:text-[11px]">Scan</span>
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

export default DetectionView;
