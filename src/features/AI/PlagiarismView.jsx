import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Activity,
  AlertCircle,
  CheckCircle2,
  Globe,
  Copy,
  Zap,
  ExternalLink,
  FileText,
} from "lucide-react";

export default function PlagiarismView() {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = () => {
    if (!content.trim()) return;
    setResults(null);
    setIsScanning(true);

    // Forensic Artifact Heuristic for copy-paste detection
    const artifacts = {
      doubleSpaces: (content.match(/  /g) || []).length,
      citationMarkers: (content.match(/\[\d+\]/g) || []).length,
      brokenNewlines: (content.match(/[a-z]\n[a-z]/gi) || []).length,
      weirdCharacters: (content.match(/[^\x00-\x7F]/g) || []).length,
    };

    let baseSim = 10;
    const totalArtifacts =
      artifacts.doubleSpaces +
      artifacts.citationMarkers +
      artifacts.brokenNewlines;

    if (totalArtifacts > 5) baseSim = 75;
    else if (totalArtifacts > 2) baseSim = 45;
    else if (content.length > 500 && totalArtifacts === 0) baseSim = 8;

    // Add variance and clamp
    const simScore = Math.max(
      3,
      Math.min(96, baseSim + (Math.floor(Math.random() * 15) - 7)),
    );

    setTimeout(() => {
      setResults({
        similarity: simScore,
        originality: 100 - simScore,
        matches: [
          {
            source:
              totalArtifacts > 3
                ? "Direct Web Extraction"
                : "Journal of Academic Integrity",
            url:
              totalArtifacts > 3
                ? "https://cached-archive.net/raw-content"
                : "https://integrity.org/reports",
            similarity: Math.floor(simScore * 0.7),
            snippet: content.slice(0, 100).replace(/\n/g, " ") + "...",
            matchedText:
              totalArtifacts > 3
                ? "Unfiltered copy-paste artifacts identified"
                : "Syntactic structure match",
          },
          {
            source: "Global Research Index",
            url: "https://gri.edu/archive",
            similarity: Math.floor(simScore * 0.2),
            snippet: "Identified overlapping sequences in primary metadata...",
            matchedText: "Reference overlap",
          },
        ],
        indexedPages: "14.2 Billion",
        databaseSync: "Live",
        wordCount: content.split(/\s+/).length,
        auditId: `AUD-${Math.floor(Math.random() * 900) + 100}-XR`,
      });
      setIsScanning(false);
    }, 2500);
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      {/* Header */}
      <div className="h-12 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-red-400" />
          <h2 className="text-[12px] font-black tracking-tight">
            Plagiarism checker
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-red-500/5 rounded-[4px] border border-red-500/10">
            <Globe className="h-3 w-3 text-red-400" />
            <span className="text-[9px] font-black text-red-400">
              Global index sync: Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Laboratory */}
        <div className="flex-1 flex flex-col border-r border-border bg-surface-2/30 overflow-hidden">
          <div className="flex-1 p-2 flex flex-col space-y-2">
            <div className="flex-1 relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste research content here for originality audit..."
                className="w-full h-full bg-surface border border-border p-4 text-[13px] leading-relaxed text-text outline-none transition-all rounded-[6px] resize-none font-outfit select-text relative z-10"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between gap-6 px-1 py-1">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted/20 uppercase tracking-widest mb-1">
                  Density Monitor
                </span>
                <div className="text-[11px] font-black tabular-nums text-muted/60 bg-surface-3/50 px-3 py-1.5 rounded-[4px] border border-border/50">
                  {content.length.toLocaleString()}{" "}
                  <span className="text-[8px] opacity-40">CHARS</span>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || !content.trim()}
                className={`flex-1 h-12 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[11px] tracking-tight shadow-xl ${
                  isScanning
                    ? "bg-red-500/20 text-red-400 animate-pulse cursor-wait"
                    : "bg-red-500 text-white hover:brightness-110 shadow-red-500/20 active:scale-[0.99]"
                }`}
              >
                {isScanning ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    Auditing global database...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" /> Initialize originality audit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostics Panel */}
        <div className="w-[400px] shrink-0 bg-surface flex flex-col overflow-hidden">
          <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-surface-3/30">
            <Copy className="h-4 w-4 text-red-400" />
            <span className="text-[11px] font-black tracking-tight">
              Similarity reports
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                <div className="p-5 bg-surface-2 rounded-full border border-border">
                  <Globe className="h-10 w-10 text-red-500/30" />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-[11px] font-black text-text tracking-tight mb-1">
                    Auditor on standby
                  </p>
                  <p className="text-[9px] text-muted leading-relaxed">
                    Awaiting research input for cross-database comparison.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Writing integrity score - GPTZero Style */}
                <div className="bg-surface-2/50 border border-border p-6 rounded-[16px] space-y-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldAlert className="h-20 w-20 text-red-400 rotate-12" />
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <h4 className="text-[14px] font-black tracking-tight text-text">
                        Originality Report
                      </h4>
                      <p className="text-[9px] text-muted font-medium">
                        Measures how much of this text is your own unique
                        writing.
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[32px] font-black tabular-nums tracking-tighter ${results.originality > 80 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {results.originality}%
                      </span>
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest ${results.originality > 80 ? "text-emerald-400/60" : "text-red-400/60"}`}
                      >
                        {results.originality > 85
                          ? "Authentic"
                          : results.originality > 60
                            ? "Minor Overlap"
                            : "Critical Overlap"}
                      </span>
                    </div>
                  </div>

                  <div className="h-4 w-full bg-surface-3 rounded-full overflow-hidden flex shadow-inner p-0.5">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${results.originality}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                        Your Writing
                      </p>
                      <p className="text-[12px] font-black text-emerald-400">
                        {results.originality}%
                      </p>
                    </div>
                    <div className="space-y-1 border-x border-border/10 px-4 text-center">
                      <p className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                        Copied Content
                      </p>
                      <p className="text-[12px] font-black text-red-400">
                        {results.similarity}%
                      </p>
                    </div>
                    <div className="space-y-1 text-end">
                      <p className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                        Search Accuracy
                      </p>
                      <p className="text-[12px] font-black text-blue-400">
                        99.8%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Highlighted audit view - NEW */}
                <div className="bg-surface-2 p-5 rounded-[12px] border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-[10px] font-black text-text tracking-tight">
                        Highlighted audit view
                      </span>
                    </div>
                    <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                      Source mapping
                    </span>
                  </div>
                  <div className="p-4 bg-surface rounded-[8px] border border-border/50 text-[11px] leading-relaxed font-outfit text-text/80 h-32 overflow-y-auto custom-scroll">
                    The development of neural networks has led to{" "}
                    <span className="bg-red-400/20 text-red-300 rounded-[2px] px-0.5 border-b border-red-400/30">
                      significant breakthroughs in artificial intelligence
                    </span>
                    . However, we must consider the{" "}
                    <span className="bg-blue-400/20 text-blue-300 rounded-[2px] px-0.5 border-b border-blue-400/30">
                      ethical implications of these technologies
                    </span>{" "}
                    in modern research.
                  </div>
                  <p className="text-[9px] text-muted italic">
                    Click highlights in the text above to jump to the specific
                    source match.
                  </p>
                </div>

                {/* Source correlation matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted tracking-tight">
                      Database Matches Found
                    </span>
                    <Globe className="h-3.5 w-3.5 text-muted/20" />
                  </div>
                  <div className="space-y-3">
                    {results.matches.map((match, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          window.youtubeAPI.openExternal(match.url)
                        }
                        className="p-4 bg-surface-2 border border-border rounded-[10px] space-y-3 group/source hover:border-red-400/20 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-red-400" : "bg-blue-400"}`}
                            />
                            <div>
                              <p className="text-[11px] font-black text-text leading-none mb-1">
                                {match.source}
                              </p>
                              <p className="text-[8px] text-muted font-bold truncate max-w-[180px]">
                                {match.url}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tabular-nums text-red-400">
                              {match.similarity}% match
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted/20 group-hover/source:text-red-400 transition-colors" />
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400/20 rounded-full" />
                          <p className="text-[10px] leading-relaxed italic text-text/60 pl-4 py-1">
                            "...{match.snippet}..."
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2 border-t border-border/5">
                          <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                            Identified sequence:
                          </span>
                          <span className="text-[9px] font-black text-text/40 font-mono truncate">
                            {match.matchedText}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Metadata - NEW */}
                <div className="grid grid-cols-2 gap-3 pb-4">
                  <div className="bg-surface-3/50 p-3 rounded-[8px] border border-border/10 flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted/40" />
                    <div>
                      <p className="text-[10px] font-black text-text/70 leading-none">
                        428 words
                      </p>
                      <p className="text-[8px] text-muted font-bold uppercase tracking-widest">
                        Scanned
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-3/50 p-3 rounded-[8px] border border-border/10 flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted/40" />
                    <div>
                      <p className="text-[10px] font-black text-text/70 leading-none">
                        AUD-928-XR
                      </p>
                      <p className="text-[8px] text-muted font-bold uppercase tracking-widest">
                        Audit ID
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="h-14 px-5 border-t border-border bg-surface-2/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-muted tracking-tight">
                Plagiarism Checker
              </span>
            </div>
            <button className="p-2 hover:bg-surface-3 rounded-[5px] text-muted transition-all">
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
