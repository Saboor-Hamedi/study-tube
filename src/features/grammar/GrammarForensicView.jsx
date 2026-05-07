import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  GraduationCap,
  Activity,
  Zap,
  Brain,
  Pencil,
  Archive,
  MessageSquare,
} from "lucide-react";
import { useRigor } from "../../hooks/useRigor";

export default function GrammarForensicView({
  api,
  showToast,
  onSaveDraft,
  initialData,
  content,
  setContent,
  diagnostics,
  setDiagnostics,
  isAnalyzing,
  setIsAnalyzing,
}) {
  const { analyze, isNeuralScanning, getCategoryColor, getCategoryBg } =
    useRigor();

  useEffect(() => {
    if (initialData) {
      setContent(initialData.definition || initialData.text || "");
      if (initialData.diagnostics) {
        setDiagnostics(initialData.diagnostics);
        setIsAnalyzing(true);
      } else {
        setIsAnalyzing(false);
      }
    }
  }, [initialData, setContent, setDiagnostics, setIsAnalyzing]);

  const handleDeepAnalyze = async () => {
    if (!content.trim()) return;
    const results = await analyze(content);
    if (results) {
      setDiagnostics(results.diagnostics);
      setIsAnalyzing(true);
    }
  };

  const handleArchive = async () => {
    if (!content.trim()) return;

    const draftId = Date.now().toString();
    const newDraft = {
      id: draftId,
      text: content.split("\n")[0].substring(0, 40) + "...",
      definition: content,
      collection: "__neural_drafts__",
      date: new Date().toISOString(),
      student: "Me (Forensic Audit)",
      status: "Saved",
      band: diagnostics.ielts || diagnostics.ieltsBand || "N/A",
      diagnostics: { ...diagnostics },
    };

    try {
      if (api?.saveVocabItem) {
        await api.saveVocabItem(newDraft);
        onSaveDraft?.(newDraft);
        if (showToast) showToast("Forensic Audit Archived", "success");
      }
    } catch (err) {
      console.error("Archive failure", err);
      if (showToast) showToast("Archive Failed", "error");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      <div className="flex-1 grid grid-cols-[1fr_380px] overflow-hidden">
        {/* Source Analysis Window */}
        <div className="min-w-0 flex flex-col border-r border-border bg-surface-2/40 overflow-hidden relative px-2 pt-3 pb-0">
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-surface border border-border/10 rounded-[12px]  shadow-black/10 relative">
            <div className="flex-1 min-w-0 relative flex flex-col overflow-hidden">
              {isAnalyzing ? (
                <div className="flex-1 min-w-0 overflow-y-auto custom-scroll p-4 lg:p-6">
                  <div className="text-[18px] text-text/90 leading-[2.2] font-light tracking-wide whitespace-pre-wrap break-words font-outfit select-text">
                    {(() => {
                      let lastIndex = 0;
                      const elements = [];
                      const highlights = diagnostics?.highlights || [];
                      const sorted = [...highlights].sort(
                        (a, b) => a.start - b.start,
                      );

                      sorted.forEach((hl, i) => {
                        elements.push(content.substring(lastIndex, hl.start));
                        elements.push(
                          <span
                            key={i}
                            className={`relative inline px-1 rounded-[4px] mx-0.5 ${getCategoryBg(hl.type)}`}
                          >
                            <span
                              onClick={() => {
                                const el = document.getElementById(
                                  `anomaly-${i + 1}`,
                                );
                                if (el)
                                  el.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                              }}
                              className={`absolute -top-3 -right-2 w-4 h-4 rounded-full ${getCategoryColor(hl.type)} text-white text-[8px] font-black flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform z-10`}
                            >
                              {i + 1}
                            </span>
                            <span
                              className={`font-bold ${getCategoryColor(hl.type).replace("bg-", "text-")}`}
                            >
                              {content.substring(hl.start, hl.end)}
                            </span>
                          </span>,
                        );
                        lastIndex = hl.end;
                      });

                      elements.push(content.substring(lastIndex));
                      return elements;
                    })()}
                  </div>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste research content here for linguistic scan..."
                  className="flex-1 w-full bg-transparent p-4 text-[18px] leading-[2] text-text/90 outline-none border-none resize-none font-outfit font-light tracking-wide custom-scroll"
                />
              )}

              {/* Density Monitor Overlay */}
              <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-surface-3/50 backdrop-blur-md rounded-full border border-border/10 flex items-center gap-2 pointer-events-none z-20">
                <div className="h-1.5 w-1.5 rounded-full bg-accent/40" />
                <span className="text-[9px] font-black text-muted/60 uppercase tracking-widest">
                  Density: {content.length} chars
                </span>
              </div>
            </div>

            {/* Integrated Statistics Footer (72px Baseline) */}
            <div className="h-[72px] border-t border-border/10 bg-surface-2/50 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 flex-1">
                {[
                  {
                    label: "Grammar",
                    score: diagnostics?.grammar || 0,
                    icon: CheckCircle,
                    color: "text-blue-500",
                  },
                  {
                    label: "Academic",
                    score: diagnostics?.academic || 0,
                    icon: GraduationCap,
                    color: "text-purple-500",
                  },
                  {
                    label: "Index",
                    score: diagnostics?.index || 0,
                    icon: Activity,
                    color: "text-green-500",
                  },
                  {
                    label: "Writing",
                    score: diagnostics?.writing || 0,
                    icon: Zap,
                    color: "text-accent",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 group cursor-default"
                  >
                    <div className={`p-1 rounded-[4px] bg-white/5`}>
                      <stat.icon className={`h-2.5 w-2.5 ${stat.color}`} />
                    </div>
                    <div className="flex flex-col -space-y-0.5">
                      <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                        {stat.label}
                      </span>
                      <span
                        className={`text-[12px] font-black tabular-nums ${stat.color}`}
                      >
                        {stat.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-4 w-px bg-border/10 mx-4" />

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-text/40 uppercase tracking-[0.2em]">
                    Neural: Connected
                  </span>
                </div>
                <span className="text-[8px] font-black text-muted/20 uppercase tracking-widest tabular-nums">
                  Load: {isNeuralScanning ? Math.floor(Math.random() * 40) + 60 : 12}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostics Hub Panel */}
        <div className="w-[380px] bg-surface flex flex-col border-l border-border">
          <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-[12px] font-black tracking-tight uppercase">
                Neural feedback hub
              </h2>
            </div>
            {isNeuralScanning && (
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-accent animate-pulse" />
                <span className="text-[10px] font-black text-accent tracking-tight">
                  Scanning...
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll">
            {/* High-Density Metrics Grid */}
            <div className="p-4 border-b border-border/5 bg-surface-2/10">
              <div className="grid grid-cols-2 gap-3">
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
                    className={`p-2 rounded-[8px] border ${stat.bg} ${stat.border} flex items-center justify-between transition-all hover:border-accent/20 shadow-sm`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded-[4px] ${stat.bg.replace("/5", "/20")}`}
                      >
                        <stat.icon className={`h-2.5 w-2.5 ${stat.color}`} />
                      </div>
                      <span className="text-[8px] font-black text-muted uppercase tracking-[0.1em]">
                        {stat.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className={`text-[14px] font-black leading-none ${stat.color}`}
                      >
                        {stat.score}
                      </span>
                      <span className="text-[7px] font-bold text-muted/40 uppercase">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Band Score Indicator */}
            {diagnostics?.ielts && (
              <div className="p-4 border-b border-border/5 bg-surface-2/30">
                <div className="p-4 bg-gradient-to-br from-accent/10 to-emerald-500/10 border border-accent/20 rounded-[10px] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <GraduationCap className="h-10 w-10" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-0">
                      <p className="text-[8px] font-black text-accent uppercase tracking-[0.2em]">
                        Neural Equivalent
                      </p>
                      <h4 className="text-[14px] font-black text-text uppercase tracking-tight">
                        {diagnostics.ieltsLabel}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-black text-accent leading-none">
                        {diagnostics.ielts}
                      </div>
                      <p className="text-[7px] font-black text-accent/40 uppercase tracking-widest">
                        Band
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/5 flex items-center justify-between">
                    <div className="h-1 flex-1 bg-surface-3 rounded-full overflow-hidden mr-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(parseFloat(diagnostics.ielts) / 9) * 100}%`,
                        }}
                        className="h-full bg-accent shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                      />
                    </div>
                    <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">
                      Mastery
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Explainable Feedback Cards */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-accent" />
                  Neural Anomalies
                </h3>
                <span className="text-[9px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full tracking-widest">
                  {(diagnostics?.highlights || []).length} DETECTED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isAnalyzing && (diagnostics?.highlights || []).length > 0 ? (
                  (diagnostics?.highlights || []).map((hl, i) => (
                    <div
                      key={i}
                      id={`anomaly-${i + 1}`}
                      className="relative bg-surface-2/50 border border-border/10 rounded-[10px] p-3 shadow-sm hover:border-accent/30 transition-all group/card overflow-hidden flex flex-col"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor(hl.type)}`}
                      />
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${getCategoryColor(hl.type)} text-white shadow-sm`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-tighter text-muted/30">
                          {hl.type}
                        </span>
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text/40 line-through truncate">
                            "{content.substring(hl.start, hl.end)}"
                          </span>
                          <span className="text-[11px] font-black text-green-500 tracking-tight leading-tight">
                            {hl.suggestion}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-border/5">
                          <p className="text-[9px] font-medium text-text/60 leading-snug line-clamp-3">
                            "{hl.explanation}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-surface-2/30 rounded-[12px] border border-dashed border-border/20">
                    <span className="text-[11px] text-muted/40 italic font-medium uppercase tracking-widest">
                      System Nominal
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar (Restored) */}
          <div className="p-3 border-t border-border bg-surface shrink-0 flex gap-2 h-[72px] items-center">
            <button
              onClick={() => {
                if (isAnalyzing) setIsAnalyzing(false);
                else handleDeepAnalyze();
              }}
              disabled={isNeuralScanning || (!content.trim() && !isAnalyzing)}
              className={`flex-1 h-11 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[11px] tracking-tight shadow-xl ${
                isNeuralScanning
                  ? "bg-accent/20 text-accent animate-pulse"
                  : isAnalyzing
                    ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4"
                    : "bg-accent text-white hover:brightness-110 shadow-accent/20"
              }`}
            >
              {isNeuralScanning ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : isAnalyzing ? (
                <>
                  <Pencil className="h-4 w-4" /> Reset laboratory
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Run forensic scan
                </>
              )}
            </button>
            <button
              onClick={handleArchive}
              disabled={!content.trim()}
              className="flex-1 h-11 rounded-[10px] border border-border text-muted hover:text-text hover:bg-surface-3 transition-all font-black text-[11px] tracking-tight flex items-center justify-center gap-2"
            >
              <Archive className="h-3.5 w-3.5" /> Archive audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
