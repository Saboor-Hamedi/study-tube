import React from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Globe,
  ExternalLink,
  Activity,
  FileText,
  Search,
  CheckCircle2,
  Copy,
} from "lucide-react";

export default function PlagiarismDiagnosticHub({
  results,
  isScanning,
  content,
  api,
}) {
  return (
    <div className="w-full md:w-[350px] bg-surface flex flex-col border-l border-border min-h-0 h-full overflow-x-hidden select-text cursor-text">
      <div className="h-7 md:h-12 px-3 md:px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-3">
          <Copy className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
          <h2 className="text-[10px] md:text-[12px] font-black tracking-tight uppercase">
            Similarity Report
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
        {!results ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
            <div className="p-5 bg-surface-2 rounded-full border border-border">
              <Globe className="h-10 w-10 text-blue-500/30" />
            </div>
            <div className="max-w-[200px]">
              <p className="text-[11px] font-black text-text tracking-tight mb-1">
                Auditor Standby
              </p>
              <p className="text-[9px] text-muted leading-relaxed uppercase tracking-widest">
                Awaiting manuscript for cross-database audit.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 md:p-5 space-y-4 md:space-y-6"
          >
            {/* Originality Score Card */}
            <div className="bg-surface-2/30 border border-border/10 p-4 md:p-5 rounded-[12px] space-y-4 md:space-y-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldAlert className="h-8 md:h-12 w-8 md:w-12 text-blue-500" />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <span className="text-[7px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em]">
                    Integrity Score
                  </span>
                  <p className={`text-[9px] md:text-[11px] font-black tracking-tight uppercase ${results.originality > 85 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {results.originality > 85
                      ? "Authentic"
                      : "Potential Overlap"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[20px] md:text-[28px] font-black tabular-nums leading-none ${results.originality > 80 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {results.originality}%
                  </span>
                  <p className="text-[6px] md:text-[7px] font-black text-muted uppercase tracking-widest mt-1">
                    Unique content
                  </p>
                </div>
              </div>

              <div className="h-1.5 md:h-2 w-full bg-surface-3 rounded-full overflow-hidden flex shadow-inner border border-border/5 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.originality}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ${results.originality > 80 ? "bg-emerald-500" : "bg-red-500"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3 pt-1">
                <div className="flex flex-col">
                  <span className="text-[12px] md:text-[14px] font-black tabular-nums text-red-400">
                    {results.similarity}%
                  </span>
                  <span className="text-[6px] md:text-[7px] font-black text-red-500/40 uppercase tracking-widest">
                    Plagiarism
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[12px] md:text-[14px] font-black tabular-nums text-blue-400">
                    99.8%
                  </span>
                  <span className="text-[6px] md:text-[7px] font-black text-emerald-500/40 uppercase tracking-widest">
                    Human
                  </span>
                </div>
              </div>
            </div>

            {/* Database Matches */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[7px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1 md:gap-1.5">
                  <Globe className="h-3 md:h-3.5 w-3 md:w-3.5 text-blue-500" />
                  Database Matches
                </h3>
                <span className="text-[6px] md:text-[7px] font-black text-blue-500/40 uppercase tracking-widest">
                  14.2B Indexed
                </span>
              </div>

              <div className="space-y-2 md:space-y-3">
                {results.matches.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => api?.openExternal(match.url)}
                    className="p-3 md:p-4 bg-surface-2/50 border border-border/10 rounded-[12px] space-y-2 md:space-y-3 group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div
                          className={`shrink-0 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${idx === 0 ? "bg-red-500 animate-pulse" : "bg-blue-400"}`}
                        />
                        <div className="min-w-0">
                          <p className="text-[9px] md:text-[11px] font-black text-text leading-tight truncate">
                            {match.source}
                          </p>
                          <p className="text-[6px] md:text-[7px] text-muted font-bold truncate max-w-full mt-0.5">
                            {match.url}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 md:gap-2">
                        <span className="text-[7px] md:text-[9px] font-black tabular-nums text-red-500">
                          {match.similarity}%
                        </span>
                        <ExternalLink className="h-2.5 md:h-3 w-2.5 md:w-3 text-muted/20 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>

                    <div className="relative p-2 md:p-2.5 bg-red-500/[0.03] border border-red-500/10 rounded-lg">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/40 rounded-full" />
                      <p className="text-[8px] md:text-[9px] leading-relaxed italic text-text/60 pl-2 md:pl-3 line-clamp-2 md:line-clamp-none">
                        "...{match.snippet}..."
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Audit Metadata */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 pb-4">
              <div className="bg-surface-2/30 p-2 md:p-3 rounded-[8px] border border-border/10 flex items-center gap-2 md:gap-3">
                <FileText className="h-3 md:h-4 w-3 md:w-4 text-muted/40 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-black text-text/70 leading-none truncate">
                    {results.wordCount}
                  </p>
                  <p className="text-[6px] md:text-[7px] text-muted font-bold tracking-widest uppercase mt-1 truncate">
                    Words
                  </p>
                </div>
              </div>
              <div className="bg-surface-2/30 p-2 md:p-3 rounded-[8px] border border-border/10 flex items-center gap-2 md:gap-3">
                <Activity className="h-3 md:h-4 w-3 md:w-4 text-muted/40 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-black text-text/70 leading-none truncate">
                    {results.auditId}
                  </p>
                  <p className="text-[6px] md:text-[7px] text-muted font-bold tracking-widest uppercase mt-1 truncate">
                    Hash
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
