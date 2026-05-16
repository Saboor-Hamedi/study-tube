import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  RotateCcw,
  Plus,
  MessageSquare,
  GraduationCap,
  EyeOff,
  Layers,
  ArrowRight,
} from "lucide-react";
import { truncateChars } from "../../utils/textUtils";

export default function WritingHub({
  diagnostics,
  isNeuralScanning,
  isAnalyzing,
  setIsAnalyzing,
  content,
  getCategoryColor,
  scrollToHl,
  onApplySuggestion,
  onIgnore,
  setGhostPreview,
}) {
  const anomalies = diagnostics?.highlights || [];

  return (
    <div className="w-full bg-surface flex flex-col min-h-0 h-full overflow-x-hidden select-text cursor-text">
      {/* this my "diagnostic head" - where all the forensic stats start */}
      <div className="h-10 px-3 border-b border-border bg-surface flex items-center justify-start gap-3 shrink-0 z-20">
        <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
        <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-text/50">
          Writing Hub
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
        {!isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
            <div className="p-5 bg-surface-2 border border-border rounded-[5px]">
              <Activity className="h-10 w-10 text-blue-500/30" />
            </div>
            <div className="max-w-[200px]">
              <p className="text-[11px] font-black text-text tracking-tight mb-1">
                Audit Standby
              </p>
              <p className="text-[9px] text-muted leading-relaxed uppercase tracking-widest">
                Initiate scan to map linguistic anomalies.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-5 pb-20">
            {/* Section 1: Neural Analytics */}
            <div className="space-y-2.5">
              <div className="px-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">
                  Neural Analytics
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-0.5 py-1">
                {[
                  {
                    label: "Gram",
                    value: diagnostics.grammar,
                    color: "text-blue-400",
                  },
                  {
                    label: "Spell",
                    value: diagnostics.spelling,
                    color: "text-red-400",
                  },
                  {
                    label: "Syntx",
                    value: diagnostics.syntax,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Dictn",
                    value: diagnostics.diction,
                    color: "text-orange-400",
                  },
                  {
                    label: "Acad",
                    value: diagnostics.academic,
                    color: "text-indigo-400",
                  },
                  {
                    label: "Flow",
                    value: diagnostics.flow || 0,
                    color: "text-pink-400",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-surface-3/30 border border-border/5 rounded-[6px] p-2 flex flex-col items-center justify-center"
                  >
                    <span className="text-[7px] font-black text-muted/50 uppercase tracking-widest mb-1">
                      {stat.label}
                    </span>
                    <span
                      className={`text-[11px] font-black tabular-nums ${stat.color}`}
                    >
                      {stat.value || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Linguistic Rigor & Flags */}
            <div className="space-y-2.5">
              <div className="px-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">
                  Linguistic Rigor
                </span>
              </div>
              <div className="px-1 py-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Cohesion",
                      value: diagnostics.flow || 0,
                      color: "bg-pink-500",
                      text: "text-pink-400",
                    },
                    {
                      label: "Rhythm",
                      value: diagnostics.rhythm || 0,
                      color: "bg-emerald-500",
                      text: "text-emerald-400",
                    },
                  ].map((m) => (
                    <div key={m.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-muted uppercase tracking-widest">
                          {m.label}
                        </span>
                        <span
                          className={`text-[9px] font-black tabular-nums ${m.text}`}
                        >
                          {m.value}%
                        </span>
                      </div>
                      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.value}%` }}
                          className={`h-full ${m.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/5">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">
                      Rigor Index
                    </span>
                    <p className="text-[10px] font-black text-text uppercase tracking-tight">
                      IELTS Band Estimate
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[28px] font-black tabular-nums leading-none text-blue-400">
                      {diagnostics.ielts || diagnostics.ieltsBand || "N/A"}
                    </span>
                    <p className="text-[6px] font-black text-muted uppercase tracking-widest mt-1">
                      Band Est.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/5">
                  <span className="text-[10px] font-black text-text uppercase tracking-widest">
                    Detected Flags
                  </span>
                  <span className="text-[14px] font-black text-blue-400 tabular-nums">
                    {anomalies.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Anomaly Map Feed */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">
                  Anomaly Map
                </span>
                <span className="text-[8px] font-black text-blue-400/40 uppercase tracking-widest">
                  {anomalies.length} Flagged
                </span>
              </div>

              <div className="space-y-3 pb-12">
                {anomalies.map((hl, i) => (
                  <motion.div
                    key={i}
                    id={`anomaly-${i + 1}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => scrollToHl(i + 1)}
                    className="group relative bg-surface border border-border/20 shadow-sm rounded-[12px] overflow-hidden transition-all hover:border-blue-500/30 cursor-pointer"
                  >
                    {/* Titlebar - h-8 */}
                    <div className="h-8 px-3 border-b border-border/10 bg-surface-3/30 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 h-full">
                        <Zap className="h-3 w-3 text-blue-400" />
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted/60">
                          Neural Audit
                        </span>
                      </div>
                      <span
                        className={`text-[7px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider ${getCategoryColor(hl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(hl.type)}`}
                      >
                        {hl.type}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-3.5">
                      {/* Content: Reason & Forensic Detail */}
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-text/90 leading-snug">
                          {hl.reason || hl.message}
                        </p>
                        {hl.explanation && (
                          <p className="text-[9px] text-muted leading-relaxed opacity-60 font-medium">
                            {hl.explanation}
                          </p>
                        )}
                      </div>

                      {/* Correction Options - 1:1 Parity with WritingMenu */}
                      <div className="space-y-2">
                        {(() => {
                          const suggestions = Array.isArray(hl.suggestions)
                            ? hl.suggestions
                            : hl.suggestion
                              ? [hl.suggestion]
                              : [];

                          if (suggestions.length === 0) {
                            return (
                              <div className="py-2.5 flex items-center justify-center gap-2 bg-surface-3/20 border border-dashed border-border/10 rounded-[8px]">
                                <EyeOff className="h-3 w-3 text-muted/20" />
                                <span className="text-[8px] font-black text-muted/30 uppercase tracking-widest">
                                  Manual Fix Required
                                </span>
                              </div>
                            );
                          }

                          return suggestions.map((s, si) => (
                            <div key={si} className="group/suggest space-y-3">
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[7px] font-black text-muted/30 uppercase tracking-widest mb-1">
                                    Current
                                  </p>
                                  <p className="text-[11px] font-black text-text/40 truncate italic leading-none">
                                    {truncateChars(
                                      content.substring(hl.start, hl.end),
                                      15,
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center justify-center">
                                  <ArrowRight className="h-3 w-3 text-blue-400/30 group-hover/suggest:text-blue-400 transition-colors" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-[7px] font-black text-blue-400/40 uppercase tracking-widest mb-1">
                                    Suggest
                                  </p>
                                  <p className="text-[11px] font-black text-blue-400 leading-none truncate">
                                    {s}
                                  </p>
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  onMouseEnter={() =>
                                    setGhostPreview({
                                      start: hl.start,
                                      suggestion: s,
                                    })
                                  }
                                  onMouseLeave={() => setGhostPreview(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onApplySuggestion(s, hl);
                                  }}
                                  className="px-6 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-[9px] font-black uppercase tracking-[0.1em] rounded-[8px] transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
