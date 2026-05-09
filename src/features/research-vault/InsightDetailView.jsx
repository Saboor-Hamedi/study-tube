import { useState, memo, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Pencil, 
  X, 
  Save, 
  Plus, 
  Sparkles, 
  Activity, 
  CheckCircle, 
  Archive,
  ArrowRight,
  Brain,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { formatNeuralText } from "../../utils/neuralFormat";
import { useRigor } from "../../hooks/useRigor";
import NeuralFeedbackHub from "../grammar/NeuralFeedbackHub";
import ForensicDropdown from "../grammar/ForensicDropdown";
import ReactMarkdown from "react-markdown";

const StaticContent = memo(({ html }) => (
  <div
    className="neural-report select-text cursor-text"
    dangerouslySetInnerHTML={{ __html: html }}
  />
));

const InsightDetailView = ({
  item,
  setView,
  showToast,
  api,
  onUpdate,
  onOpenCopilot,
  onClose,
  onOpenCapture,
  collections,
  selectedCollection,
  setSelectedCollection,
  isCopilotOpen,
  isCopilotCollapsed,
}) => {
  const { analyze, isNeuralScanning, getCategoryColor, getCategoryBg } = useRigor();
  
  const [editVal, setEditVal] = useState(item?.definition || "");
  const [titleEditVal, setTitleEditVal] = useState(item?.text || "");
  const [isEditing, setIsEditing] = useState(false);
  const [diagnostics, setDiagnostics] = useState(item?.diagnostics || { highlights: [] });
  const [isAnalyzing, setIsAnalyzing] = useState(!!item?.diagnostics);
  
  const [selectedHl, setSelectedHl] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 800;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (item) {
      setEditVal(item.definition || "");
      setTitleEditVal(item.text || "");
      setDiagnostics(item.diagnostics || { highlights: [] });
      setIsAnalyzing(!!item.diagnostics);
    }
  }, [item]);

  const handleSaveEdit = async () => {
    try {
      await onUpdate({
        ...item,
        text: titleEditVal,
        definition: editVal,
        diagnostics: diagnostics
      });
      setIsEditing(false);
      if (showToast) showToast("Neural Archive Updated", "success");
    } catch (err) {
      if (showToast) showToast("Update Failed", "error");
    }
  };

  const handleDeepAnalyze = async () => {
    if (!editVal.trim()) return;
    const results = await analyze(editVal);
    if (results) {
      setDiagnostics(results.diagnostics);
      setIsAnalyzing(true);
    }
  };

  const showHl = (hl, i, e) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferUp = spaceBelow < 400; 

    setSelectedHl({
      ...hl,
      index: i + 1,
      top: preferUp 
        ? rect.top - parentRect.top + containerRef.current.scrollTop - 16
        : rect.bottom - parentRect.top + containerRef.current.scrollTop + 16,
      left: Math.min(Math.max(10, rect.left - parentRect.left), parentRect.width - 230),
      preferUp
    });
  };

  const hideHl = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedHl(null);
    }, 400);
  };

  const cancelHide = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  if (!item) return null;

  return (
    <div className="h-full flex flex-col bg-surface text-text overflow-hidden font-sans select-text relative">
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Source Analysis Window */}
        <div className="flex-1 min-w-0 flex flex-col bg-surface overflow-hidden relative border-r border-border/5">
          <div className="flex-1 min-w-0 overflow-y-auto custom-scroll relative" ref={containerRef}>
            <div className="p-5 md:p-10 pb-96 min-h-full flex flex-col relative">
              
              {/* Refined Industrial Header */}
              <div className="mb-10 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 bg-accent/5 border border-accent/10 rounded-full flex items-center gap-1.5 shrink-0">
                      <Brain className="h-2.5 w-2.5 text-accent" />
                      <span className="text-[8px] font-black text-accent uppercase tracking-widest">
                        {item.collection || "Unsorted"}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-border/5" />
                  </div>
                  
                  {isEditing ? (
                    <input
                      value={titleEditVal}
                      onChange={(e) => setTitleEditVal(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[18px] md:text-[24px] font-black text-text focus:outline-none placeholder:text-muted/20"
                      placeholder="Insight Title..."
                    />
                  ) : (
                    <h1 className="text-[18px] md:text-[24px] font-black text-text tracking-tight uppercase leading-tight break-all">
                      {item.text}
                    </h1>
                  )}
                </div>

                <button 
                  onClick={onClose} 
                  className="mt-1 p-2 hover:bg-surface-3 rounded-[8px] text-muted/40 hover:text-red-500 transition-all shrink-0 border border-transparent hover:border-red-500/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isAnalyzing ? (
                <div className="flex-1">
                  <div className="text-[14px] md:text-[18px] text-text/90 leading-[1.8] md:leading-[2.2] font-light tracking-wide whitespace-pre-wrap break-words font-outfit select-text">
                    {(() => {
                      let lastIndex = 0;
                      const elements = [];
                      const highlights = diagnostics?.highlights || [];
                      const sorted = [...highlights].sort((a, b) => a.start - b.start);

                      sorted.forEach((hl, i) => {
                        elements.push(editVal.substring(lastIndex, hl.start));
                        elements.push(
                          <motion.span
                            key={i}
                            initial={{ backgroundColor: "rgba(255, 107, 0, 0)" }}
                            animate={{ backgroundColor: getCategoryBg(hl.type) }}
                            className={`cursor-help border-b-2 ${getCategoryColor(hl.type).replace("text-", "border-")} px-0.5 rounded-sm transition-colors relative inline-flex items-center gap-0.5 leading-none group/hl`}
                            onMouseEnter={(e) => showHl(hl, i, e)}
                            onMouseLeave={hideHl}
                            onClick={(e) => {
                              e.stopPropagation();
                              showHl(hl, i, e);
                            }}
                          >
                            <span className="relative">
                              {editVal.substring(hl.start, hl.end)}
                            </span>
                            <span className={`absolute -top-1.5 -right-1 text-[7px] font-black opacity-80 px-0.5 rounded-[2px] leading-none ${getCategoryColor(hl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(hl.type)}`}>
                              {i + 1}
                            </span>
                          </motion.span>,
                        );
                        lastIndex = hl.end;
                      });
                      elements.push(editVal.substring(lastIndex));
                      return elements;
                    })()}
                  </div>
                </div>
              ) : isEditing ? (
                <textarea
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  placeholder="Drafting forensic research definition..."
                  className="flex-1 h-full w-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.6] md:leading-[2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit"
                />
              ) : (
                <div className="flex-1 text-[14px] md:text-[18px] text-text/80 leading-[1.8] md:leading-[2.2] font-light tracking-wide break-words font-outfit whitespace-pre-wrap">
                   <ReactMarkdown>{editVal}</ReactMarkdown>
                </div>
              )}

              {/* Synthesis Abstract */}
              {item.summary && !isEditing && (
                <div className="mt-12 p-6 md:p-8 bg-accent/5 border border-accent/10 space-y-4 rounded-[12px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">
                      Final Neural Synthesis
                    </span>
                  </div>
                  <div className="text-[14px] text-muted leading-relaxed font-light space-y-3">
                    {item.summary.split("\n").map((l, i) => (
                      <p key={i} className="flex gap-4 text-text">
                        <span className="text-accent/30 font-black flex-shrink-0">/</span>
                        {l.replace(/^[•\-\d\.]+\s*/, "")}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                <ForensicDropdown
                  selectedHl={selectedHl}
                  content={editVal}
                  onApplySuggestion={(suggestion) => {
                    if (!selectedHl) return;
                    const newContent = editVal.substring(0, selectedHl.start) + suggestion + editVal.substring(selectedHl.end);
                    setEditVal(newContent);
                    setSelectedHl(null);
                    handleDeepAnalyze();
                  }}
                  onClose={() => setSelectedHl(null)}
                  onMouseEnter={cancelHide}
                  onMouseLeave={hideHl}
                  getCategoryColor={getCategoryColor}
                  getCategoryBg={getCategoryBg}
                />
              </AnimatePresence>

              {isMobile && isAnalyzing && (
                <div className="w-full mt-10 pb-6">
                  <NeuralFeedbackHub
                    diagnostics={diagnostics}
                    isNeuralScanning={isNeuralScanning}
                    isAnalyzing={isAnalyzing}
                    setIsAnalyzing={setIsAnalyzing}
                    content={editVal}
                    getCategoryColor={getCategoryColor}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostics Sidebar (Desktop Only) */}
        {!isMobile && isSidebarOpen && (
          <div className="shrink-0 z-[60] relative">
            <NeuralFeedbackHub
              diagnostics={diagnostics}
              isNeuralScanning={isNeuralScanning}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              content={editVal}
              getCategoryColor={getCategoryColor}
            />
          </div>
        )}
      </div>

      {/* Industrial Footer */}
      <div className="h-[48px] md:h-[56px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:gap-6">
            {[
              { label: "Words", value: editVal.trim().split(/\s+/).filter(Boolean).length },
              { label: "Anomalies", value: diagnostics?.highlights?.length || 0 },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 md:gap-2">
                <span className="text-[7px] md:text-[8px] font-black text-muted uppercase tracking-widest">{m.label}:</span>
                <span className="text-[9px] md:text-[10px] font-black text-text tabular-nums">{m.value}</span>
              </div>
            ))}
          </div>

          {!isMobile && (
            <>
              <div className="h-4 w-px bg-border/10" />
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] md:text-[8px] font-black text-text/40 uppercase tracking-[0.2em]">Neural Synced</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            className={`h-8 md:h-10 px-3 md:px-6 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest ${
              isEditing ? "bg-accent text-white" : "bg-surface-3 text-text border border-border/10 hover:bg-surface-4"
            }`}
          >
            {isEditing ? <><Save className="h-3 w-3" /> Save</> : <><Pencil className="h-3 w-3" /> Edit</>}
          </button>

          <button
            onClick={() => isAnalyzing ? setIsAnalyzing(false) : handleDeepAnalyze()}
            disabled={isNeuralScanning}
            className={`h-8 md:h-10 px-3 md:px-6 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest ${
              isAnalyzing ? "bg-surface-3 text-text border border-border/10" : "bg-accent text-white"
            }`}
          >
            {isNeuralScanning ? <Activity className="h-3 w-3 animate-spin" /> : isAnalyzing ? "Reset" : "Scan"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default memo(InsightDetailView);
