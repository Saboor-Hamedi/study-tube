import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Activity,
  Zap,
  Brain,
  CheckCircle,
  Archive,
  Pencil,
  Plus,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { useRigor } from "../../hooks/useRigor";
import NeuralFeedbackHub from "./NeuralFeedbackHub";
import ForensicDropdown from "./ForensicDropdown";

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
  onOpenCapture,
}) {
  const { analyze, isNeuralScanning, getCategoryColor, getCategoryBg } =
    useRigor();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [selectedHl, setSelectedHl] = useState(null);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 800;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleApplySuggestion = async (suggestion) => {
    if (!selectedHl) return;
    const newContent = 
      content.substring(0, selectedHl.start) + 
      suggestion + 
      content.substring(selectedHl.end);
    
    setContent(newContent);
    setSelectedHl(null);

    const results = await analyze(newContent);
    if (results) {
      setDiagnostics(results.diagnostics);
    }
    
    if (showToast) showToast("Neural Correction Applied", "success");
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
      band: diagnostics.ielts || diagnostics.ieltsBand || "N/A",
      diagnostics: { ...diagnostics },
      metadata: {
        student: "Me (Forensic Audit)",
        status: "Saved",
        band: diagnostics.ielts || diagnostics.ieltsBand || "N/A",
        diagnostics: { ...diagnostics },
      },
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

  const showHl = (hl, i, e) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    
    // Aggressive Smart Positioning: Check space below for 400px card clearance
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
    }, 400); // Slightly longer buffer for better UX
  };

  const cancelHide = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col bg-surface text-text overflow-hidden font-sans select-text relative">
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Source Analysis Window (Seamless) */}
        <div className="flex-1 min-w-0 flex flex-col bg-surface overflow-hidden relative">
          <div className="flex-1 min-w-0 overflow-y-auto custom-scroll relative" ref={containerRef}>
            {/* Added PB-96 (384px) safe zone for bottom-of-page highlights */}
            <div className="p-4 md:p-10 pb-96 min-h-full flex flex-col relative">
              {isAnalyzing ? (
                <div className="flex-1">
                  <div className="text-[14px] md:text-[18px] text-text/90 leading-[1.8] md:leading-[2.2] font-light tracking-wide whitespace-pre-wrap break-words font-outfit select-text">
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
                          <motion.span
                            key={i}
                            initial={{
                              backgroundColor: "rgba(255, 107, 0, 0)",
                            }}
                            animate={{
                              backgroundColor: getCategoryBg(hl.type),
                            }}
                            className={`cursor-help border-b-2 ${getCategoryColor(hl.type).replace("text-", "border-")} px-0.5 rounded-sm transition-colors relative inline-flex items-center gap-0.5 leading-none group/hl`}
                            onMouseEnter={(e) => showHl(hl, i, e)}
                            onMouseLeave={hideHl}
                            onClick={(e) => {
                              e.stopPropagation();
                              showHl(hl, i, e);
                            }}
                          >
                            <span className="relative">
                              {content.substring(hl.start, hl.end)}
                            </span>
                            <span className={`absolute -top-1.5 -right-1 text-[7px] font-black opacity-80 px-0.5 rounded-[2px] leading-none ${getCategoryColor(hl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(hl.type)}`}>
                              {i + 1}
                            </span>
                          </motion.span>,
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
                  placeholder="Paste academic manuscript for neural forensic auditing..."
                  className="flex-1 h-full w-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.6] md:leading-[2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit"
                />
              )}

              {/* Robust Anomaly Dropdown/Tooltip */}
              <AnimatePresence>
                <ForensicDropdown
                  selectedHl={selectedHl}
                  content={content}
                  onApplySuggestion={handleApplySuggestion}
                  onClose={() => setSelectedHl(null)}
                  onMouseEnter={cancelHide}
                  onMouseLeave={hideHl}
                  getCategoryColor={getCategoryColor}
                  getCategoryBg={getCategoryBg}
                />
              </AnimatePresence>

              {/* On Mobile, Diagnostics move INSIDE the scroll view at the bottom */}
              {isMobile && isAnalyzing && (
                <div className="w-full mt-10 pb-6">
                   <div className="border border-border rounded-[8px] overflow-hidden bg-surface shadow-xl">
                      <NeuralFeedbackHub
                        diagnostics={diagnostics}
                        isNeuralScanning={isNeuralScanning}
                        isAnalyzing={isAnalyzing}
                        setIsAnalyzing={setIsAnalyzing}
                        content={content}
                        getCategoryColor={getCategoryColor}
                      />
                   </div>
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
              content={content}
              getCategoryColor={getCategoryColor}
            />
          </div>
        )}
      </div>

      {/* Unified Industrial Footer (Responsive) */}
      <div className="h-[48px] md:h-[56px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:gap-6">
            {[
              {
                label: "Words",
                value: content.trim().split(/\s+/).filter(Boolean).length,
              },
              {
                label: "Anomalies",
                value: diagnostics?.highlights?.length || 0,
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 md:gap-2">
                <span className="text-[7px] md:text-[8px] font-black text-muted uppercase tracking-widest">
                  {m.label}:
                </span>
                <span className="text-[9px] md:text-[10px] font-black text-text tabular-nums">
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {!isMobile && (
            <>
              <div className="h-4 w-px bg-border/10" />
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] md:text-[8px] font-black text-text/40 uppercase tracking-[0.2em]">
                    Neural
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => {
              if (isAnalyzing) setIsAnalyzing(false);
              else handleDeepAnalyze();
            }}
            disabled={isNeuralScanning || (!content.trim() && !isAnalyzing)}
            className={`h-8 md:h-10 px-3 md:px-6 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest ${
              isNeuralScanning
                ? "bg-accent/20 text-accent animate-pulse"
                : isAnalyzing
                  ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4"
                  : "bg-accent text-white hover:brightness-110 shadow-lg shadow-accent/20"
            }`}
          >
            {isNeuralScanning ? (
              <Activity className="h-3 w-3 animate-spin" />
            ) : isAnalyzing ? (
              <>
                <Pencil className="h-3 w-3" /> <span className="hidden xs:inline">Reset</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" /> <span className="hidden xs:inline">Scan</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleArchive}
            disabled={!content.trim()}
            className="h-8 md:h-10 px-3 md:px-6 rounded-[4px] border border-border text-muted hover:text-text hover:bg-surface-3 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
          >
            <Archive className="h-3 w-3" /> <span className="hidden xs:inline">Archive</span>
          </button>
          
          {!isMobile && (
            <>
              <div className="h-6 w-px bg-border/10 mx-1" />
              <button
                onClick={onOpenCapture}
                className="h-10 w-10 bg-accent hover:brightness-110 text-white rounded-[4px] flex items-center justify-center transition-all shadow-lg shadow-accent/20 border border-white/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
