import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  CheckCircle,
  Archive,
  ArrowRight,
  RotateCcw,
  Plus,
  MessageSquare,
  AlertCircle,
  Loader2,
  Layers,
  GraduationCap,
  EyeOff,
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
    <div className="w-full md:w-[350px] bg-surface flex flex-col border-l border-border min-h-0 h-full overflow-x-hidden select-text cursor-text">
      {/* this my "diagnostic head" - where all the forensic stats start */}
      <div className="h-7 md:h-12 px-3 md:px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
          <h2 className="text-[10px] md:text-[12px] font-black tracking-tight uppercase">
            Writing Diagnostic
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
        {!isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
            <div className="p-5 bg-surface-2 rounded-full border border-border">
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
          <div className="p-1 space-y-1">
            {/* this my "neural scoreboard" - showing me exactly where my writing is weak */}
            <div className="bg-surface-2/30 border border-border/10 rounded-[8px] overflow-hidden">
              <div className="px-2 py-1 border-b border-border/5 bg-surface-3/20 flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-400" />
              </div>
              <div className="p-1 grid grid-cols-2 gap-1">
                {[
                  {
                    label: "Grammar",
                    value: diagnostics.grammar,
                    color: "text-blue-500",
                  },
                  {
                    label: "Spelling",
                    value: diagnostics.spelling,
                    color: "text-red-500",
                  },
                  {
                    label: "Syntax",
                    value: diagnostics.syntax,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Diction",
                    value: diagnostics.diction,
                    color: "text-orange-500",
                  },
                  {
                    label: "Acad",
                    value: diagnostics.academic,
                    color: "text-purple-500",
                  },
                ].map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between p-1.5 bg-surface-3/30 rounded-[4px] border border-border/5"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                        {stat.label}
                      </span>
                      <span
                        className={`text-[12px] font-black tabular-nums ${stat.color}`}
                      >
                        {stat.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rigor Score Card */}
            <div className="bg-surface-2/30 border border-border/10 p-2 rounded-[8px] space-y-2">
              {/* this my "rigor index" - the final academic verdict */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">
                    Rigor Index
                  </span>
                  <p className="text-[12px] font-black text-text tracking-tight uppercase leading-tight">
                    IELTS Band Estimate
                  </p>
                </div>
                <div className="text-right flex flex-col items-end min-w-[120px]">
                  <div className="flex flex-col items-end">
                    <span className="text-[36px] font-black tabular-nums leading-none text-blue-400">
                      {diagnostics.ielts || diagnostics.ieltsBand || "N/A"}
                    </span>
                    <p className="text-[7px] font-black text-muted/40 uppercase tracking-[0.2em] mt-1">
                      Band Estimate
                    </p>
                  </div>

                  <div className="mt-3 w-full space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[14px] font-black text-text tabular-nums leading-none">
                        {anomalies.length}
                      </span>
                      {/* this my "anomaly heat bar" - when it turns red, i know i've got work to do */}
                      <span className="text-[7px] font-black text-muted uppercase tracking-widest">
                        Detected Flags
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden border border-border/10 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, (anomalies.length / 20) * 100)}%`,
                        }}
                        className={`h-full ${anomalies.length > 10 ? "bg-red-500" : anomalies.length > 5 ? "bg-orange-500" : "bg-blue-500"} transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    Anomaly Map
                  </h3>
                  <span className="text-[7px] font-black text-blue-400/40 uppercase tracking-widest">
                    {anomalies.length} Flagged
                  </span>
                </div>

                <div className="space-y-1">
                  {/* this my "forensic timeline" - every single flag mapped out in order */}
                  {anomalies.map((hl, i) => (
                    <motion.div
                      key={i}
                      id={`anomaly-${i + 1}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => scrollToHl(i + 1)}
                      className={`p-1.5 bg-surface-2/50 border border-border/10 rounded-[6px] space-y-1 group hover:border-blue-500/20 transition-all cursor-pointer relative overflow-hidden`}
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${getCategoryColor(hl.type).replace("text-", "bg-")}`}
                      />

                      <div className="px-2 py-1.5 border-b border-border/10 bg-surface-3/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-2.5 w-2.5 text-blue-400" />
                          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted">
                            Neural Action
                          </span>
                        </div>
                        <span
                          className={`text-[7px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider ${getCategoryColor(hl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(hl.type)}`}
                        >
                          {hl.type}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-text/80 leading-snug">
                          {hl.reason || hl.message}
                        </p>
                      </div>

                      {hl.explanation && (
                        <p className="text-[9px] text-muted leading-relaxed opacity-60">
                          {hl.explanation}
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap gap-1.5 border-t border-border/5">
                        {(() => {
                          const suggestions = Array.isArray(hl.suggestions)
                            ? hl.suggestions
                            : hl.suggestion
                              ? [hl.suggestion]
                              : [];

                          if (suggestions.length === 0) {
                            return (
                              <div className="w-full py-2 flex flex-col items-center justify-center gap-2 bg-surface-3/50 border border-border/5 rounded-[4px] border-dashed">
                                <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                                  No Neural Auto-Fix Available
                                </span>
                              </div>
                            );
                          }

                          return suggestions.map((s, si) => (
                            <div key={si} className="space-y-1.5 w-full">
                              {/* Section 3: Word & Suggestion */}
                              <div className="flex flex-col gap-1 p-1.5 bg-blue-500/5 border border-blue-500/10 rounded-[4px]">
                                <span className="text-[9px] font-black text-text/40  ">
                                  {truncateChars(
                                    content.substring(hl.start, hl.end),
                                    40,
                                  )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <ArrowRight className="h-2 w-2 text-blue-400 shrink-0" />
                                  <span className="text-[10px] font-black text-blue-400 leading-snug">
                                    {s}
                                  </span>
                                </div>
                              </div>

                              {/* Section 4: Action Section (Bottom Right) */}
                              <div className="flex justify-end pt-1 border-t border-border/5">
                                <button
                                  // this my "neural bridge" - the button that triggers my ghost preview animation
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
                                  className="px-3 py-1 bg-blue-500 text-white text-[9px] font-black rounded-[4px] hover:brightness-110 transition-all shadow-sm"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
