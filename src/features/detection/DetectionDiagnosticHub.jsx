import React from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Activity,
  Zap,
  BarChart3,
  Layers,
  Info,
  Fingerprint,
} from "lucide-react";

export default function DetectionDiagnosticHub({
  results,
  isScanning,
  content,
}) {
  return (
    <div className="w-full md:w-[350px] bg-surface flex flex-col border-l border-border min-h-0 h-auto md:h-full overflow-x-hidden select-text cursor-text">
      <div className="h-7 md:h-12 px-3 md:px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
          <h2 className="text-[10px] md:text-[12px] font-black tracking-tight uppercase">
            Neural Analytics
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
        {!results ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
            <div className="p-5 bg-surface-2 rounded-full border border-border">
              <Layers className="h-10 w-10 text-blue-500/30" />
            </div>
            <div className="max-w-[200px]">
              <p className="text-[11px] font-black text-text tracking-tight mb-1">
                Forensic Standby
              </p>
              <p className="text-[9px] text-muted leading-relaxed uppercase tracking-widest">
                Awaiting manuscript for neural mapping.
              </p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 md:p-5 space-y-4 md:space-y-6"
          >
            {/* Probability Gauge - Integrated Design */}
            <div className="bg-surface-2/30 border border-border/10 p-3 md:p-4 rounded-[12px] space-y-3 md:space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[7px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em]">Probability Map</span>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-red-400" />
                    <span className="text-[7px] md:text-[8px] font-black text-muted/60 uppercase tracking-widest">AI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[7px] md:text-[8px] font-black text-muted/60 uppercase tracking-widest">Human</span>
                  </div>
                </div>
              </div>
              
              <div className="h-2 md:h-3 w-full bg-surface-3 rounded-full overflow-hidden flex shadow-inner border border-border/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${results.aiScore}%` }}
                  className="h-full bg-red-400 relative group/ai"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                </motion.div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${results.humanScore}%` }}
                  className="h-full bg-emerald-400 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                </motion.div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex flex-col">
                  <span className="text-[16px] md:text-[20px] font-black tabular-nums text-red-400 leading-none">{results.aiScore}%</span>
                  <span className="text-[6px] md:text-[7px] font-black text-muted/40 uppercase tracking-widest mt-1">Synthetic</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[16px] md:text-[20px] font-black tabular-nums text-emerald-400 leading-none">{results.humanScore}%</span>
                  <span className="text-[6px] md:text-[7px] font-black text-muted/40 uppercase tracking-widest mt-1">Authentic</span>
                </div>
              </div>
            </div>

            {/* Neural Fingerprint Card */}
            <div className="bg-blue-500/5 border border-blue-500/10 p-3 md:p-4 rounded-[12px] space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Fingerprint className="h-3 md:h-3.5 w-3 md:w-3.5 text-blue-400" />
                  <span className="text-[7px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest">Linguistic DNA</span>
                </div>
                <span className="text-[6px] md:text-[7px] font-black text-blue-400/40 uppercase tracking-tighter">Forensic Scan</span>
              </div>
              
              <div className="bg-surface p-2 md:p-3 rounded-[8px] border border-border/50 shadow-sm flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[11px] font-black text-text tracking-tight uppercase truncate">
                    {results.classification || "Neural Signature"}
                  </p>
                  <p className="text-[6px] md:text-[7px] text-muted font-black uppercase tracking-[0.15em] mt-0.5 truncate">
                    Forensic match
                  </p>
                </div>
                <div className="shrink-0 px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-500 text-white text-[7px] md:text-[8px] font-black rounded-[3px] shadow-lg shadow-blue-500/20">
                  {(results.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
              {[
                { label: "Confidence", value: `${(results.confidence * 100).toFixed(0)}%`, sub: "Neural Accuracy" },
                { label: "Anomalies", value: `${results.anomalies}`, sub: "Pattern" },
                { label: "Burstiness", value: results.burstiness, sub: "Range" },
                { label: "Perplexity", value: results.perplexity, sub: "Flow" },
              ].map((m) => (
                <div key={m.label} className="bg-surface-2/50 p-2 md:p-3 rounded-[8px] border border-border/10">
                  <p className="text-[6px] md:text-[7px] font-black text-muted/60 uppercase tracking-widest mb-0.5 md:mb-1">{m.label}</p>
                  <p className="text-[10px] md:text-[12px] font-black text-text tabular-nums tracking-tight truncate">{m.value}</p>
                  <p className="text-[5px] md:text-[6px] font-bold text-muted/30 uppercase mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Segment Map */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[7px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1 md:gap-1.5">
                  <Layers className="h-3 md:h-3.5 w-3 md:w-3.5 text-blue-400" />
                  Segment Map
                </h3>
              </div>
              
              <div className="space-y-1.5 md:space-y-2">
                {results.segments.map((seg, idx) => (
                  <div key={idx} className="p-2 md:p-3 bg-surface-2/30 border border-border/10 rounded-[10px] space-y-1.5 md:space-y-2 group hover:border-blue-400/20 transition-all cursor-default shadow-sm">
                    <p className="text-[9px] md:text-[10px] leading-relaxed italic text-text/60 line-clamp-2">"{seg.text}"</p>
                    <div className="flex items-center justify-between pt-1.5 md:pt-2 border-t border-border/5">
                      <span className={`text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded-[3px] ${
                        seg.type === 'synthetic' ? 'bg-red-500/10 text-red-400' : 
                        seg.type === 'mixed' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {seg.type.toUpperCase()}
                      </span>
                      <span className="text-[7px] md:text-[8px] font-black tabular-nums text-muted/30 uppercase tracking-widest">
                        {(seg.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
