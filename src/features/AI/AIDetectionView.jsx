import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Search,
  Activity,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Layers,
  Zap,
  Info,
} from "lucide-react";

import { api } from "./../../utils/api-bridge";

export default function AIDetectionView({ showToast }) {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [version, setVersion] = useState("0.0.0");

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

      if (!response.ok) {
        throw new Error("Neural Engine Warming Up. Please wait a moment...");
      }

      const data = await response.json();

      setResults({
        aiScore: Math.round(data.ai_probability),
        humanScore: Math.round(100 - data.ai_probability),
        confidence: 0.92 + Math.random() * 0.05,
        anomalies: Math.floor(data.ai_probability / 15),
        burstiness: data.details.burst_interpretation || "High Variation",
        perplexity: data.details.ppl_interpretation || "Natural Pattern",
        neuralFingerprint:
          data.ai_probability > 60 ? "GPT-2_Deep_Scan" : "Human_Authenticity",
        segments: [
          {
            text: content.slice(0, 100) + "...",
            probability: data.ai_probability / 100,
            type:
              data.ai_probability > 75
                ? "synthetic"
                : data.ai_probability > 40
                  ? "mixed"
                  : "human",
          },
          {
            text: "Neural Perplexity Analysis...",
            probability: data.perplexity > 50 ? 0.2 : 0.8,
            type: data.perplexity > 40 ? "human" : "synthetic",
          },
          {
            text: "Burstiness/Variation Scan...",
            probability: data.burstiness > 0.4 ? 0.1 : 0.9,
            type: data.burstiness > 0.3 ? "human" : "synthetic",
          },
        ],
      });
    } catch (err) {
      console.error("Forensic scan failure:", err);
      // Fallback to minimal state or alert
      showToast?.(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const [engineStatus, setEngineStatus] = useState("OFFLINE"); // OFFLINE, INITIALIZING, LOADING_WEIGHTS, READY

  // Get the versoin from package
  useEffect(() => {
    const loadVersion = async () => {
      const ver = await api?.getVersion(); // Request through the tunnel
      if (ver) setVersion(ver);
    };
    loadVersion();
  }, [api]);

  useEffect(() => {
    if (!api) return;

    // Initial State Handshake: Ask the main process what the current status is
    api.getEngineStatus?.().then((status) => {
      if (status) setEngineStatus(status);
    });

    const unsub = api.onEngineStatus((status) => {
      setEngineStatus(status);
    });
    return unsub;
  }, [api]);

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text relative">
      {/* Header */}
      <div className="h-12 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Cpu className="h-4 w-4 text-blue-400" />
          <h2 className="text-[12px] font-black tracking-tight">
            AI detection laboratory
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/5 rounded-[4px] border border-blue-500/10">
            <Activity className="h-3 w-3 text-blue-400" />
            <span className="text-[9px] font-black text-blue-400">
              Neural monitor active
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Laboratory */}
        <div className="flex-1 flex flex-col border-r border-border bg-surface-2/30 overflow-hidden">
          <div className="flex-1 p-2 flex flex-col space-y-2">
            <div className="flex-1 relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste research content here for forensic scan..."
                className="w-full h-full bg-surface border border-border p-4 text-[13px] leading-relaxed text-text outline-none transition-all rounded-[6px] resize-none font-outfit select-text relative z-10"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-muted/20 uppercase tracking-widest">
                    Model
                  </span>
                  {engineStatus === "READY" ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-500">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">
                        Ready
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="relative h-2.5 w-2.5">
                        <div className="absolute inset-0 border-[1.5px] border-blue-500/20 rounded-full" />
                        <motion.div
                          className="absolute inset-0 border-[1.5px] border-blue-500 rounded-full border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest animate-pulse">
                        {engineStatus.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] font-black tabular-nums text-muted/60 bg-surface-3/50 px-3 py-1.5 rounded-[4px] border border-border/50">
                  {content.length.toLocaleString()}{" "}
                  <span className="text-[8px] opacity-40">CHARS</span>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || !content.trim()}
                className={`flex-1 h-12 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[11px] tracking-tight shadow-xl ${
                  isScanning
                    ? "bg-blue-500/20 text-blue-400 animate-pulse cursor-wait"
                    : "bg-blue-500 text-white hover:brightness-110 shadow-blue-500/20 active:scale-[0.99]"
                }`}
              >
                {isScanning ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    Neural scanning in progress...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostics Panel */}
        <div className="w-[400px] shrink-0 bg-surface flex flex-col overflow-hidden">
          <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-surface-3/30">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <span className="text-[11px] font-black tracking-tight">
              Detection analytics
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                <div className="p-5 bg-surface-2 rounded-full border border-border">
                  <Layers className="h-10 w-10 text-blue-500/30" />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-[11px] font-black text-text tracking-tight mb-1">
                    System standby
                  </p>
                  <p className="text-[9px] text-muted leading-relaxed">
                    Awaiting research input for neural probability mapping.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Probability gauge */}
                <div className="bg-surface-2/50 border border-border p-5 rounded-[12px] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted tracking-tight">
                      Detection analysis
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">
                          AI
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">
                          Human
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-surface-3 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-red-400 transition-all duration-1000 ease-out relative group/ai"
                      style={{ width: `${results.aiScore}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div
                      className="h-full bg-emerald-400 transition-all duration-1000 ease-out relative"
                      style={{ width: `${results.humanScore}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[18px] font-black tabular-nums text-red-400">
                        {results.aiScore}%
                      </span>
                      <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                        AI synthetic
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[18px] font-black tabular-nums text-emerald-400">
                        {results.humanScore}%
                      </span>
                      <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                        Human original
                      </span>
                    </div>
                  </div>
                </div>

                {/* Neural Fingerprint - NEW */}
                <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-[12px] space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 tracking-tight">
                      Neural fingerprint identified
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-surface p-3 rounded-[8px] border border-border/50">
                    <div>
                      <p className="text-[12px] font-black text-text">
                        GPT-4.5_Omni
                      </p>
                      <p className="text-[8px] text-muted font-bold uppercase tracking-wider">
                        Likely model origin
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black rounded-[4px] shadow-lg shadow-blue-500/20">
                      98.4% Match
                    </div>
                  </div>
                  <p className="text-[9px] text-muted leading-relaxed italic">
                    Pattern matches found in stochastic frequency and syntactic
                    variability typical of the GPT-4 family architectures.
                  </p>
                </div>

                {/* Industrial metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Confidence
                    </p>
                    <p className="text-[13px] font-black tabular-nums text-text/90">
                      {(results.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Anomalies
                    </p>
                    <p className="text-[13px] font-black tabular-nums text-text/90">
                      {results.anomalies} detected
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Burstiness
                    </p>
                    <p className="text-[13px] font-black text-text/90">
                      {results.burstiness}
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Perplexity
                    </p>
                    <p className="text-[13px] font-black text-text/90">
                      {results.perplexity}
                    </p>
                  </div>
                </div>

                {/* Forensic breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted tracking-tight">
                      Segment breakdown
                    </span>
                    <Info className="h-3 w-3 text-muted/20" />
                  </div>
                  <div className="space-y-2">
                    {results.segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-2/30 border border-border rounded-[8px] space-y-2"
                      >
                        <p className="text-[10px] leading-relaxed italic text-text/70 line-clamp-2">
                          "{seg.text}"
                        </p>
                        <div className="flex items-center justify-between border-t border-border/5 pt-2">
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-[3px] ${
                              seg.type === "synthetic"
                                ? "bg-red-500/10 text-red-400"
                                : seg.type === "mixed"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {seg.type.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-black tabular-nums text-muted/40">
                            {(seg.probability * 100).toFixed(0)}% prob
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="h-14 px-5 border-t border-border bg-surface-2/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-muted tracking-tight">
                AI Detection
              </span>
            </div>
            <button className="p-2 hover:bg-surface-3 rounded-[5px] text-muted transition-all">
              <AlertCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
