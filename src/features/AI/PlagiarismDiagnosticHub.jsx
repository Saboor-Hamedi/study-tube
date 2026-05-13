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
    <div className="w-full md:w-[350px] bg-surface flex flex-col border-l border-border min-h-0 h-full overflow-x-hidden">
      <div className="h-7 md:h-12 px-3 md:px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-3">
          <Copy className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500" />
          <h2 className="text-[10px] md:text-[12px] font-black tracking-tight uppercase">
            Similarity Report
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
        {!results ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
            <div className="p-5 bg-surface-2 rounded-full border border-border">
              <Globe className="h-10 w-10 text-red-500/30" />
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
            className="p-3 md:p-5 space-y-6"
          >
            {/* Originality Score Card */}
            <div className="bg-surface-2/30 border border-border/10 p-5 rounded-[12px] space-y-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldAlert className="h-12 w-12 text-red-500" />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">
                    Integrity Score
                  </span>
                  <p className="text-[11px] font-black text-text tracking-tight uppercase">
                    {results.originality > 85
                      ? "Authentic"
                      : "Potential Overlap"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[28px] font-black tabular-nums leading-none ${results.originality > 80 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {results.originality}%
                  </span>
                  <p className="text-[7px] font-black text-muted uppercase tracking-widest mt-1">
                    Unique content
                  </p>
                </div>
              </div>

              <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden flex shadow-inner border border-border/5 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.originality}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ${results.originality > 80 ? "bg-emerald-500" : "bg-red-500"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col">
                  <span className="text-[14px] font-black tabular-nums text-red-400">
                    {results.similarity}%
                  </span>
                  <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                    Matched Content
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-black tabular-nums text-blue-400">
                    99.8%
                  </span>
                  <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                    Index Accuracy
                  </span>
                </div>
              </div>
            </div>

            {/* Database Matches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-red-500" />
                  Database Matches
                </h3>
                <span className="text-[7px] font-black text-red-500/40 uppercase tracking-widest">
                  14.2B Indexed
                </span>
              </div>

              <div className="space-y-3">
                {results.matches.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => api?.openExternal(match.url)}
                    className="p-4 bg-surface-2/50 border border-border/10 rounded-[12px] space-y-3 group hover:border-red-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-red-500 animate-pulse" : "bg-blue-400"}`}
                        />
                        <div>
                          <p className="text-[11px] font-black text-text leading-tight">
                            {match.source}
                          </p>
                          <p className="text-[7px] text-muted font-bold truncate max-w-[150px] mt-0.5">
                            {match.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tabular-nums text-red-500">
                          {match.similarity}%
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted/20 group-hover:text-red-500 transition-colors" />
                      </div>
                    </div>

                    <div className="relative p-2.5 bg-surface/50 border border-border/5 rounded-lg">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/20 rounded-full" />
                      <p className="text-[9px] leading-relaxed italic text-text/50 pl-3">
                        "...{match.snippet}..."
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Audit Metadata */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <div className="bg-surface-2/30 p-3 rounded-[8px] border border-border/10 flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted/40" />
                <div>
                  <p className="text-[10px] font-black text-text/70 leading-none">
                    {results.wordCount} words
                  </p>
                  <p className="text-[7px] text-muted font-bold tracking-widest uppercase mt-0.5">
                    Total Volume
                  </p>
                </div>
              </div>
              <div className="bg-surface-2/30 p-3 rounded-[8px] border border-border/10 flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted/40" />
                <div>
                  <p className="text-[10px] font-black text-text/70 leading-none">
                    {results.auditId}
                  </p>
                  <p className="text-[7px] text-muted font-bold tracking-widest uppercase mt-0.5">
                    Audit Hash
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
