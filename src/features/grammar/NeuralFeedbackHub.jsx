import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  GraduationCap,
  Activity,
  Zap,
  Brain,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export default function NeuralFeedbackHub({
  diagnostics,
  isNeuralScanning,
  isAnalyzing,
  setIsAnalyzing,
  content,
  getCategoryColor,
  scrollToHl,
  onApplySuggestion,
  setGhostPreview,
}) {
  return (
    <div className="w-full md:w-[300px] bg-surface flex flex-col border-l border-border min-h-0 h-full">
      <div className="h-9 md:h-12 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-accent" />
          <h2 className="text-[10px] md:text-[12px] font-black tracking-tight uppercase">
            Diagnostics
          </h2>
        </div>
        {isNeuralScanning && (
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-accent animate-pulse" />
            <span className="text-[9px] font-black text-accent tracking-tight">
              SCANNING
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll">
        {/* High-Density Metrics Grid */}
        <div className="border-b border-border/5 bg-surface-2/10">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-1.5">
            {[
              {
                label: "Grammar",
                score: diagnostics?.grammar || 0,
                icon: CheckCircle,
                color: "text-blue-500",
                bg: "bg-blue-500/5",
                border: "border-blue-500/10",
              },
              {
                label: "Syntax",
                score: diagnostics?.syntax || 0,
                icon: Activity,
                color: "text-emerald-500",
                bg: "bg-emerald-500/5",
                border: "border-emerald-500/10",
              },
              {
                label: "Academic",
                score: diagnostics?.academic || 0,
                icon: GraduationCap,
                color: "text-purple-500",
                bg: "bg-purple-500/5",
                border: "border-purple-500/10",
              },
              {
                label: "Diction",
                score: diagnostics?.diction || 0,
                icon: Zap,
                color: "text-orange-500",
                bg: "bg-orange-500/5",
                border: "border-orange-500/10",
              },
              {
                label: "Writing",
                score: diagnostics?.writing || 0,
                icon: Brain,
                color: "text-accent",
                bg: "bg-accent/5",
                border: "border-accent/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`p-2 rounded-[6px] border ${stat.bg} ${stat.border} flex flex-col items-center justify-center transition-all hover:border-accent/20 group`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <stat.icon
                    className={`h-2.5 w-2.5 ${stat.color} group-hover:scale-110 transition-transform`}
                  />
                  <span className="text-[7px] md:text-[8px] font-black text-muted uppercase tracking-tight">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`text-[12px] md:text-[14px] font-black leading-none ${stat.color}`}
                  >
                    {stat.score}
                  </span>
                  <span className="text-[6px] font-bold text-muted/40 uppercase">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Band Score Indicator */}
        {diagnostics?.ielts && (
          <div className="p-3 border-b border-border/5 bg-surface-2/30">
            <div className="p-3 bg-gradient-to-br from-accent/10 to-emerald-500/10 border border-accent/20 rounded-[8px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-0">
                  <p className="text-[7px] font-black text-accent uppercase tracking-widest">
                    Equivalent
                  </p>
                  <h4 className="text-[12px] font-black text-text uppercase tracking-tight truncate max-w-[120px]">
                    {diagnostics.ieltsLabel}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-[18px] md:text-[22px] font-black text-accent leading-none">
                    {diagnostics.ielts}
                  </div>
                  <p className="text-[7px] font-black text-accent/40 uppercase tracking-widest">
                    Band
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/5 flex items-center justify-between">
                <div className="h-0.5 flex-1 bg-surface-3 rounded-full overflow-hidden mr-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(parseFloat(diagnostics.ielts) / 9) * 100}%`,
                    }}
                    className="h-full bg-accent shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                  />
                </div>
                <span className="text-[7px] font-black text-muted/60 uppercase tracking-widest">
                  Mastery
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Explainable Feedback Cards */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[8px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Brain className="h-3 w-3 md:h-3.5 md:w-3.5 text-accent" />
              Anomalies
            </h3>
            <span className="text-[8px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded-full tracking-widest">
              {(diagnostics?.highlights || []).length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {isAnalyzing && (diagnostics?.highlights || []).length > 0 ? (
              (diagnostics?.highlights || []).map((hl, i) => {
                // Sentential Context Extraction
                const lookback = 100;
                const lookahead = 100;
                const startPos = Math.max(0, hl.start - lookback);
                const endPos = Math.min(content.length, hl.end + lookahead);
                const rawFragment = content.substring(startPos, endPos);

                // Truncate to the nearest full sentence
                const sentenceMatch = rawFragment.match(/[^.!?]*[.!?]/g);
                const sentence = sentenceMatch
                  ? sentenceMatch.find((s) =>
                      s.includes(content.substring(hl.start, hl.end)),
                    ) || rawFragment
                  : rawFragment;

                return (
                  <div
                    key={i}
                    id={`anomaly-${i + 1}`}
                    onClick={() => scrollToHl(i + 1)}
                    className="relative bg-surface-2/50 border border-border/10 rounded-[10px] p-3 hover:border-accent/40 cursor-pointer transition-all group/card overflow-hidden flex flex-col col-span-2 shadow-sm hover:shadow-md"
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor(hl.type).replace("text-", "bg-")}`}
                    />

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black cursor-pointer transition-colors ${getCategoryColor(hl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(hl.type)} hover:bg-accent hover:text-white shadow-sm`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${getCategoryColor(hl.type)}`}
                        >
                          {hl.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-20">
                        <Brain className="h-3 w-3" />
                        <span className="text-[7px] font-black uppercase">
                          Neural
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <div className="p-2.5 bg-surface rounded-lg border border-border/5 text-[10px] leading-relaxed italic text-text/50">
                          ...
                          {sentence
                            .trim()
                            .replace(
                              content.substring(hl.start, hl.end),
                              `[[${content.substring(hl.start, hl.end)}]]`,
                            )}
                          ...
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-[8px] font-black text-muted uppercase mt-0.5">
                            Logic:
                          </span>
                          <p className="text-[10px] font-medium text-text/80 leading-snug">
                            {hl.explanation}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center space-y-1.5 bg-accent/5 p-3 rounded-lg border border-accent/10 relative group/action">
                        <span className="text-[7px] font-black text-accent/40 uppercase tracking-widest">
                          Neural Suggestion
                        </span>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-accent" />
                            <span className="text-[12px] font-black text-text tracking-tight">
                              {hl.suggestion}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplySuggestion(hl.suggestion, hl);
                            }}
                            onMouseEnter={() => setGhostPreview(hl)}
                            onMouseLeave={() => setGhostPreview(null)}
                            className="h-6 px-3 bg-accent hover:brightness-110 text-white rounded-[4px] text-[8px] font-black uppercase tracking-widest transition-all shadow-lg shadow-accent/20 active:scale-95 shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-surface-2/30 rounded-[10px] border border-dashed border-border/20 w-full col-span-2">
                <span className="text-[9px] text-muted/40 italic font-medium uppercase tracking-widest">
                  System Nominal
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
