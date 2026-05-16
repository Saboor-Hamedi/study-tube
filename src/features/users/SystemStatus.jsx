import React from "react";
import { motion } from "framer-motion";
import { Activity, BookOpen } from "lucide-react";

export default function SystemStatus({ forensicNodes = 0, hideMetrics = false }) {
  return (
    <div className="w-full bg-surface flex flex-col min-h-0 h-full overflow-x-hidden select-text cursor-text">
      {/* diagnostic head - synchronized with WritingHub */}
      <div className="h-10 px-3 border-b border-border bg-surface flex items-center justify-start gap-3 shrink-0 z-20">
        <Activity className="h-3.5 w-3.5 text-blue-400" />
        <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-text/50">
          System Status
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-1 space-y-1">
        {!hideMetrics && (
          <>
            {/* neural scoreboard - matching WritingHub but with restored graphs */}
            <div className="bg-surface-2/30 border border-border/10 overflow-hidden">
              <div className="px-2 py-1 border-b border-border/5 bg-surface-3/20 flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-400" />
                <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">Mastery Index</span>
              </div>
              <div className="p-2 space-y-3">
                {[
                  { label: "Depth", value: 88, color: "bg-blue-500" },
                  { label: "Density", value: 74, color: "bg-emerald-500" },
                  { label: "Rigor", value: 92, color: "bg-accent" },
                  { label: "Clarity", value: 85, color: "bg-orange-500" },
                  { label: "Flow", value: 90, color: "bg-pink-500" },
                  { label: "Style", value: 78, color: "bg-indigo-400" },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                      <span className="text-muted">{stat.label}</span>
                      <span className={`${stat.color.replace('bg-', 'text-')} tabular-nums`}>{stat.value}%</span>
                    </div>
                    <div className="h-1 w-full bg-surface-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        className={`h-full ${stat.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Health Summary */}
            <div className="bg-surface-2/30 border border-border/10 p-2 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-muted uppercase tracking-widest">Network Stability</span>
                  <span className="text-[9px] font-black text-emerald-500 tabular-nums">98%</span>
                </div>
                <div className="h-1 bg-surface-3 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "98%" }} className="h-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Weekly Writings Quota Card */}
        <div className="bg-surface-2/30 border border-border/10 p-3 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 items-center">
            {/* Column 1: Labels */}
            <div className="space-y-1">
              <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] block">Weekly Writings</span>
              <p className="text-[12px] font-black text-text tracking-tight uppercase leading-tight block">Active Drafts</p>
            </div>
            
            {/* Column 2: Status & Counter */}
            <div className="flex flex-col items-end space-y-0.5 text-right">
              {forensicNodes >= 20 ? (
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Quota Achieved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">
                  <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                  <span>In Progress</span>
                </div>
              )}
              <div className="flex items-baseline justify-end gap-0.5 font-black w-full pt-0.5">
                <span className="text-[28px] tabular-nums leading-none text-blue-400 tracking-tight">{forensicNodes}</span>
                <span className="text-[14px] text-muted/60 tabular-nums leading-none">/20</span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-1.5 pt-1 border-t border-border/5">
            <div className="flex justify-between items-center text-[7px] font-black text-muted uppercase tracking-widest">
              <span>0</span>
              <span>20 Target</span>
            </div>
            <div className="h-1.5 w-full bg-surface-3 overflow-hidden border border-border/10 relative rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (forensicNodes / 20) * 100)}%` }}
                className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.3)] rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
