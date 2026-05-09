import React from "react";
import { motion } from "framer-motion";
import { Activity, BookOpen } from "lucide-react";

export default function SystemStatus({ forensicNodes = 0 }) {
  return (
    <div className="w-full md:w-[320px] h-auto md:h-full bg-surface flex flex-col border border-border rounded-[8px] min-h-0 shrink-0 overflow-hidden">
      <div className="h-9 md:h-12 px-4 border-b border-border flex items-center bg-surface-3/30 shrink-0">
        <Activity className="h-3 w-3 md:h-4 md:w-4 text-accent mr-2 md:mr-3" />
        <h2 className="text-[9px] md:text-[12px] font-black tracking-tight uppercase">
          System Status
        </h2>
      </div>
      <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-8 overflow-y-auto custom-scroll">
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-[7px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em]">
            Linguistic Mastery
          </h3>
          <div className="space-y-3 md:space-y-6">
            {[
              { label: "Academic Depth", value: 88, color: "bg-blue-500" },
              { label: "Vocabulary Density", value: 74, color: "bg-emerald-500" },
              { label: "Syntactic Rigor", value: 92, color: "bg-accent" },
            ].map((bar) => (
              <div key={bar.label} className="space-y-1 md:space-y-2">
                <div className="flex items-center justify-between text-[8px] md:text-[10px] font-bold">
                  <span className="text-text/70">{bar.label}</span>
                  <span className="text-text tabular-nums">{bar.value}%</span>
                </div>
                <div className="h-1 md:h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.value}%` }}
                    className={`h-full ${bar.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 md:p-6 bg-accent/5 border border-accent/10 rounded-[8px] md:rounded-[16px] space-y-2 md:space-y-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-accent text-white rounded-[4px] md:rounded-[8px]">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <div className="space-y-0">
              <h4 className="text-[9px] md:text-[11px] font-black text-text uppercase">
                Research Quota
              </h4>
              <p className="text-[7px] md:text-[9px] text-muted font-bold uppercase tracking-widest">
                Weekly Achievement
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 md:gap-2">
            <span className="text-[20px] md:text-[32px] font-black text-accent tracking-tighter">
              {forensicNodes}/20
            </span>
            <span className="text-[8px] md:text-[10px] font-black text-muted uppercase">
              Nodes
            </span>
          </div>
          <div className="h-0.5 md:h-1 w-full bg-accent/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (forensicNodes / 20) * 100)}%`,
              }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
