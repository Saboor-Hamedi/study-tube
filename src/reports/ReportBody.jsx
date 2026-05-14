import React from "react";
import { motion } from "framer-motion";
import { BarChart2, ShieldCheck, Zap } from "lucide-react";

const ReportBody = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface-3 overflow-hidden relative selection:bg-accent/10">
      {/* Background Aesthetic Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f8fafc,transparent)] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#f1f5f9,transparent)] opacity-50 pointer-events-none" />
      
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin relative z-10 flex flex-col">
        
        {/* Diagnostic Header */}
        <div className="w-full bg-surface-2/40 backdrop-blur-xl border-b border-border/20 py-6 md:py-8 px-4 sm:px-6 md:px-12 flex justify-center">
          <div className="w-full max-w-6xl relative">
            
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-2 select-text cursor-text">
                <div className="w-1 h-3 bg-accent/40 rounded-full" />
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] opacity-80">
                  Writella / Analytical Intelligence
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0 select-text cursor-text">
                <ShieldCheck className="h-3 w-3 text-orange-500/40" />
                <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest">
                  Analytical Vault
                </span>
              </div>
            </div>

            <h1 className="text-xl md:text-3xl font-black tracking-tight mb-6 select-text cursor-text leading-tight text-text uppercase">
              Forensic Progress Reports
            </h1>

            <div className="flex flex-wrap gap-6 md:gap-10 select-text cursor-text">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-muted/30 uppercase tracking-[0.25em]">Report Status</span>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-accent/40" />
                  <span className="text-[10px] font-black uppercase text-text/80">Under Construction</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:ml-auto min-w-[120px]">
                <span className="text-[8px] font-black text-muted/30 uppercase tracking-[0.25em]">Neural Sync</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "15%" }}
                      className="h-full bg-orange-500/40"
                    />
                  </div>
                  <span className="text-[9px] font-mono font-black text-orange-500/60">15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 w-full bg-white flex justify-center border-t border-border/10">
          <div className="w-full max-w-6xl px-6 sm:p-8 md:p-10 py-20 flex flex-col items-center justify-center text-center select-text cursor-text">
            <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mb-8 border border-border/10">
              <BarChart2 className="h-8 w-8 text-muted/20" />
            </div>
            
            <h2 className="text-2xl font-black uppercase tracking-tight text-text/90 mb-4">
              Intelligence Reporting Coming Soon
            </h2>
            <p className="max-w-md text-sm text-muted/60 leading-relaxed mb-12">
              The Analytical Intelligence Hub is currently undergoing architectural synthesis. Soon, you will be able to visualize your linguistic forensic history and research progress through high-fidelity diagnostic charts.
            </p>
            
            <div className="flex gap-4">
              <div className="h-[1px] w-20 bg-border/20 self-center" />
              <span className="text-[10px] font-black text-muted/20 uppercase tracking-[0.4em]">Archival Mode Active</span>
              <div className="h-[1px] w-20 bg-border/20 self-center" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBody;
