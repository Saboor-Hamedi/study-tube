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
  FileText
} from "lucide-react";

export default function PlagiarismView() {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = () => {
    if (!content.trim()) return;
    setIsScanning(true);
    // Simulate industrial forensic scan
    setTimeout(() => {
      setResults({
        similarity: 24,
        originality: 76,
        matches: [
          { 
            source: "Journal of Neural Ethics", 
            url: "https://nature.com/articles/neural-ethics",
            similarity: 12, 
            snippet: "breaks in artificial intelligence lead to significant breakthroughs in neural development.",
            matchedText: "breakthroughs in artificial intelligence"
          },
          { 
            source: "AI Research Quarterly", 
            url: "https://sciencedirect.com/ai-quarterly",
            similarity: 8, 
            snippet: "ethical implications of these technologies must be considered by all practitioners.",
            matchedText: "ethical implications of these technologies"
          }
        ],
        indexedPages: "14.2 Billion",
        databaseSync: "Live"
      });
      setIsScanning(false);
    }, 2500);
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      {/* Header */}
      <div className="h-12 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <h2 className="text-[12px] font-black tracking-tight">Plagiarism audit laboratory</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-red-500/5 rounded-[4px] border border-red-500/10">
            <Globe className="h-3 w-3 text-red-400" />
            <span className="text-[9px] font-black text-red-400">Global index sync: Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Laboratory */}
        <div className="flex-1 flex flex-col border-r border-border bg-surface-2/30 overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scroll">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-black tracking-tight text-text/90">Originality analysis window</h3>
                  <p className="text-[10px] text-muted font-medium">Scan research text against 14B+ indexed academic sources.</p>
                </div>
                <div className="text-[10px] font-black tabular-nums text-muted/40">
                  {content.length} characters
                </div>
              </div>
              
              <div className="relative group">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste research content here for originality audit..."
                  className="w-full h-[400px] bg-surface border border-border p-6 text-[13px] leading-relaxed text-text outline-none focus:border-red-500/30 transition-all rounded-[12px] resize-none font-outfit"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="px-2 py-1 bg-surface-2 border border-border rounded-[4px] text-[8px] font-black text-muted/40">
                    DEEP_SCAN_MODE
                  </div>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || !content.trim()}
                className={`w-full h-12 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[11px] tracking-tight shadow-xl ${
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
            <span className="text-[11px] font-black tracking-tight">Similarity reports</span>
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
                {/* Similarity Gauge */}
                <div className="bg-surface-2/50 border border-border p-5 rounded-[12px] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted tracking-tight">Similarity index</span>
                    <span className={`text-[18px] font-black tabular-nums ${results.similarity > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {results.similarity}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${results.similarity > 15 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${results.similarity}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-muted/40 tracking-widest uppercase">
                    <span>Clean</span>
                    <span>Plagiarized</span>
                  </div>
                </div>

                {/* Database Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">Indexed Sources</p>
                    <p className="text-[12px] font-black text-text/90 uppercase tracking-tighter">
                      {results.indexedPages}
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">Database Sync</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[12px] font-black text-text/90 uppercase">
                        {results.databaseSync}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source Matches */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted tracking-tight">Source match results</span>
                    <FileText className="h-3 w-3 text-muted/20" />
                  </div>
                  <div className="space-y-3">
                    {results.matches.map((match, idx) => (
                      <div key={idx} className="p-4 bg-surface-2 border border-border rounded-[10px] space-y-3 group/source">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-[3px]">
                              {match.similarity}% match
                            </span>
                            <span className="text-[10px] font-black text-text truncate max-w-[150px]">
                              {match.source}
                            </span>
                          </div>
                          <a 
                            href={match.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1 hover:bg-surface-3 rounded-[4px] text-muted/40 hover:text-red-400 transition-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-[10px] leading-relaxed italic text-text/60 border-l-2 border-red-400/20 pl-3">
                          "...{match.snippet}..."
                        </p>
                        <div className="pt-2 border-t border-border/5">
                          <p className="text-[9px] font-bold text-muted/40 uppercase tracking-widest">
                            Matched sequence identified
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="h-14 px-5 border-t border-border bg-surface-2/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-red-400" />
              <span className="text-[9px] font-black text-muted tracking-tight italic">Legal integrity sweep active</span>
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
