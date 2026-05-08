import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  GraduationCap,
  Activity,
  Zap,
  Brain,
  MessageSquare,
} from "lucide-react";

export default function NeuralFeedbackHub({
  diagnostics,
  isNeuralScanning,
  isAnalyzing,
  setIsAnalyzing,
  content,
  getCategoryColor,
}) {
  return (
    <div className="w-full md:max-w-[280px] bg-surface flex flex-col border-l border-border min-h-0 h-full">
      <div className="h-9 md:h-10 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3 w-3 md:h-3.5 md:w-3.5 text-accent" />
          <h2 className="text-[10px] md:text-[11px] font-black tracking-tight uppercase">
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
        <div className="p-3 border-b border-border/5 bg-surface-2/10">
          <div className="grid grid-cols-2 gap-2">
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
                label: "Academic",
                score: diagnostics?.academic || 0,
                icon: GraduationCap,
                color: "text-purple-500",
                bg: "bg-purple-500/5",
                border: "border-purple-500/10",
              },
              {
                label: "Index",
                score: diagnostics?.index || 0,
                icon: Activity,
                color: "text-green-500",
                bg: "bg-green-500/5",
                border: "border-green-500/10",
              },
              {
                label: "Writing",
                score: diagnostics?.writing || 0,
                icon: Zap,
                color: "text-accent",
                bg: "bg-accent/5",
                border: "border-accent/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`p-1.5 rounded-[6px] border ${stat.bg} ${stat.border} flex items-center justify-between transition-all hover:border-accent/20`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1 rounded-[3px] ${stat.bg.replace("/5", "/20")}`}
                  >
                    <stat.icon className={`h-2.5 w-2.5 ${stat.color}`} />
                  </div>
                  <span className="text-[7px] md:text-[8px] font-black text-muted uppercase tracking-tighter">
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
              (diagnostics?.highlights || []).map((hl, i) => (
                <div
                  key={i}
                  id={`anomaly-${i + 1}`}
                  className="relative bg-surface-2/50 border border-border/10 rounded-[8px] p-2 hover:border-accent/30 transition-all group/card overflow-hidden flex flex-col"
                >
                  <div
                    className={`absolute top-0 left-0 w-0.5 h-full ${getCategoryColor(hl.type)}`}
                  />
                  <div className="flex items-center justify-between mb-1.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${getCategoryColor(hl.type)} text-white shadow-sm`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[6px] font-black uppercase tracking-tighter text-muted/30">
                      {hl.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[9px] font-bold text-text/40 line-through truncate">
                        "{content.substring(hl.start, hl.end)}"
                      </span>
                      <span className="text-[9px] md:text-[10px] font-black text-green-500 tracking-tight leading-tight">
                        {hl.suggestion}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-border/5">
                      <p className="text-[8px] font-medium text-text/60 leading-snug line-clamp-3">
                        "{hl.explanation}"
                      </p>
                    </div>
                  </div>
                </div>
              ))
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
