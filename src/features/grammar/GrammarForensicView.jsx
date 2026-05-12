import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Activity,
  Zap,
  CheckCircle,
  Archive,
  Pencil,
  Plus,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  X,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  useFloating,
  offset,
  flip,
  shift,
  inline,
  autoUpdate,
} from "@floating-ui/react";
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
  const {
    analyze,
    analyzeAI,
    isNeuralScanning,
    getCategoryColor,
    getCategoryBg,
    addToDictionary,
  } = useRigor();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [selectedHl, setSelectedHl] = useState(null);
  const [ghostPreview, setGhostPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Snapshot Helper
  const takeSnapshot = useCallback(
    (newText) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const updated = [...sliced, newText];
        // Keep last 50 edits
        if (updated.length > 50) return updated.slice(1);
        return updated;
      });
      setHistoryIndex((prev) => {
        const next = prev + 1;
        return next > 49 ? 49 : next;
      });
    },
    [historyIndex],
  );

  const undo = () => {
    if (historyIndex > 0) {
      const prevText = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setContent(prevText);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextText = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setContent(nextText);
    }
  };

  // --- Floating UI Engine ---
  const { x, y, refs, strategy, placement } = useFloating({
    open: !!selectedHl,
    onOpenChange: (open) => !open && setSelectedHl(null),
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(12),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 10 }),
    ],
    whileElementsMounted: autoUpdate,
  });

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
      const txt = initialData.definition || initialData.text || "";
      setContent(txt);
      setHistory([txt]);
      setHistoryIndex(0);
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

    // Phase 1: Local Heuristic Scan (Instant)
    const localResults = await analyze(content);
    if (localResults) {
      setDiagnostics(localResults.diagnostics);
      setIsAnalyzing(true);
    }

    // Phase 2: Neural Deep Audit (Smart Suggestions)
    if (api) {
      const aiAnomalies = await analyzeAI(content, api);

      if (aiAnomalies && aiAnomalies.length > 0) {
        setDiagnostics((prev) => {
          // Merge AI highlights with local ones, avoiding duplicates at same positions
          const existingHighlights = prev.highlights || [];
          const merged = [...existingHighlights];

          aiAnomalies.forEach((aiHl) => {
            const isDuplicate = merged.some(
              (h) => Math.abs(h.start - aiHl.start) < 2,
            );
            if (!isDuplicate) {
              merged.push(aiHl);
            }
          });

          const sorted = merged.sort((a, b) => a.start - b.start);
          return {
            ...prev,
            highlights: sorted,
          };
        });
      }
    }
  };

  const handleApplySuggestion = async (suggestion, specificHl = null) => {
    const hl = specificHl || selectedHl;
    if (!hl) return;

    takeSnapshot(content);

    let start = hl.start;
    let end = hl.end;

    // Phrase-Aware Expansion (Surgical)
    // Only expand if the suggestion is a full sentence fix (contains punctuation or is long)
    const isNeuralFix =
      suggestion.split(/\s+/).length > 4 || /[.!?]$/.test(suggestion);

    if (isNeuralFix) {
      // Look back for nearest boundary (max 150 chars for safety)
      const textBefore = content.substring(Math.max(0, start - 150), start);
      const lastBoundary = Math.max(
        textBefore.lastIndexOf("."),
        textBefore.lastIndexOf("!"),
        textBefore.lastIndexOf("?"),
        textBefore.lastIndexOf("\n"),
      );
      if (lastBoundary !== -1) {
        // Adjust start to be absolute
        const absoluteBoundary = Math.max(0, start - 150) + lastBoundary + 1;
        start = absoluteBoundary;
      } else if (start < 150) {
        start = 0;
      }

      // Look forward for nearest boundary (max 150 chars for safety)
      const textAfter = content.substring(
        end,
        Math.min(content.length, end + 150),
      );
      const nextBoundary = textAfter.search(/[.!?\n]/);
      if (nextBoundary !== -1) {
        end = end + nextBoundary + 1;
      } else if (content.length - end < 150) {
        end = content.length;
      }
    }

    const newContent =
      content.substring(0, start).replace(/[ \t]+$/, "") +
      (start > 0 && !/\n$/.test(content.substring(0, start)) ? " " : "") +
      suggestion.trim() +
      (end < content.length && !/^\n/.test(content.substring(end)) ? " " : "") +
      content.substring(end).replace(/^[ \t]+/, "");

    // Surgical Index Shift: Calculate the length delta to avoid full re-analysis
    const delta = suggestion.trim().length - (end - start);

    // Update highlights optimistically by shifting indices
    setDiagnostics((prev) => {
      const existing = prev.highlights || [];

      // Atomic Overlap Purge: Remove any highlight that touches or is inside the modified range
      const updated = existing
        .filter((h) => {
          // If this is the active highlight, remove it
          if (h === hl || h.start === hl.start) return false;

          // If this highlight overlaps with the replacement zone [start, end], remove it
          const isOverlapping =
            (h.start >= start && h.start < end) ||
            (h.end > start && h.end <= end) ||
            (h.start <= start && h.end >= end);
          return !isOverlapping;
        })
        .map((h) => {
          // Precise Recalibration: Only shift highlights that are STRICTLY after the replaced zone
          if (h.start >= end) {
            return {
              ...h,
              start: h.start + delta,
              end: h.end + delta,
            };
          }
          return h;
        });

      return { ...prev, highlights: updated };
    });

    setContent(newContent);
    setSelectedHl(null);
    setGhostPreview(null);
  };

  const handleAddToDictionary = async (word) => {
    if (!word) return;
    const result = await addToDictionary(word);

    if (result.success) {
      if (showToast) showToast(`"${word}" added to Dictionary`, "success");

      // Optimistic Clearance: Remove all flags for this word instantly
      setDiagnostics((prev) => {
        const existing = prev.highlights || [];
        const cleanWord = word.toLowerCase();
        const updated = existing.filter((hl) => {
          const hlText = content.substring(hl.start, hl.end).toLowerCase();
          return hlText !== cleanWord;
        });
        return { ...prev, highlights: updated };
      });

      setSelectedHl(null);
    } else {
      if (showToast)
        showToast(`Failed to whitelist "${word}": ${result.message}`, "error");
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

    // Set the reference element directly for robust positioning
    refs.setReference(e.currentTarget);

    setSelectedHl({
      ...hl,
      index: i + 1,
    });
  };

  const hideHl = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedHl(null);
      setGhostPreview(null);
    }, 400); // Slightly longer buffer for better UX
  };

  const cancelHide = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const scrollToHl = (index) => {
    const el = document.getElementById(`hl-${index}`);
    if (el && containerRef.current) {
      // Calculate position relative to container
      const topPos =
        el.offsetTop -
        containerRef.current.offsetHeight / 2 +
        el.offsetHeight / 2;
      containerRef.current.scrollTo({ top: topPos, behavior: "smooth" });

      // Brief pulse effect
      el.style.transition = "all 0.3s ease";
      el.style.backgroundColor = "rgba(255,107,0,0.3)";
      setTimeout(() => {
        el.style.backgroundColor = "";
      }, 1000);
    }
  };

  const scrollToAnomaly = (index) => {
    const el = document.getElementById(`anomaly-${index}`);
    const parent = el?.closest(".overflow-y-auto");
    if (el && parent) {
      const topPos = el.offsetTop - 20;
      parent.scrollTo({ top: topPos, behavior: "smooth" });

      // Brief highlights effect
      el.style.transition = "all 0.3s ease";
      el.style.borderColor = "var(--accent)";
      setTimeout(() => {
        el.style.borderColor = "";
      }, 1000);
    }
  };

  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col bg-surface text-text overflow-hidden font-sans select-text relative">
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        {/* Source Analysis Window (Seamless) */}
        <div className="flex-1 min-w-0 flex flex-col bg-surface overflow-hidden relative z-[70]">
          <div
            className="flex-1 min-w-0 overflow-y-auto custom-scroll relative"
            ref={containerRef}
          >
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
                        // Spatial Safety: Prevent backwards jumps or overlapping renders
                        if (hl.start < lastIndex) return;

                        elements.push(content.substring(lastIndex, hl.start));
                        elements.push(
                          <motion.span
                            key={i}
                            id={`hl-${i + 1}`}
                            initial={{
                              backgroundColor: "rgba(255, 107, 0, 0)",
                            }}
                            animate={{
                              backgroundColor:
                                hl.type === "spelling" ||
                                hl.type === "grammar" ||
                                hl.type === "syntax"
                                  ? getCategoryBg(hl.type)
                                  : "rgba(202, 17, 17, 0)",
                            }}
                            className={`cursor-help rounded-sm transition-all relative inline leading-none group/hl font-light tracking-wide px-[1px] -mx-[1px]`}
                            onMouseLeave={hideHl}
                            onClick={(e) => {
                              e.stopPropagation();
                              showHl(hl, i, e);
                              scrollToAnomaly(i + 1);
                            }}
                          >
                            <span
                              className="relative inline-grid grid-cols-1 grid-rows-1 align-baseline"
                              style={{
                                display: "inline-grid",
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3' viewBox='0 0 6 3'%3E%3Cpath d='M0 2.5 C 0.5 2.5, 1.0 0.5, 1.5 0.5 C 2.0 0.5, 2.5 2.5, 3.0 2.5 C 3.5 2.5, 4.0 0.5, 4.5 0.5 C 5.0 0.5, 5.5 2.5, 6.0 2.5' fill='none' stroke='${getCategoryColor(hl.type).includes("blue") ? "%233b82f6" : getCategoryColor(hl.type).includes("emerald") ? "%2310b981" : getCategoryColor(hl.type).includes("orange") ? "%23f97316" : getCategoryColor(hl.type).includes("purple") ? "%23a855f7" : "%23ef4444"}' stroke-width='0.7'/%3E%3C/svg%3E")`,
                                backgroundRepeat: "repeat-x",
                                backgroundPosition: "bottom",
                                backgroundSize: "6px 3px",
                                paddingBottom: "2px",
                              }}
                            >
                              {/* Spatial Anchor (Keeps the manuscript footprint stable) */}
                              <span
                                className={`grid-area-1-1 ${ghostPreview?.start === hl.start ? "text-transparent" : ""} font-light tracking-wide`}
                                style={{ gridArea: "1/1" }}
                              >
                                {content.substring(hl.start, hl.end)}
                              </span>

                              {/* Neural Ghost (Manifests exactly on top of anchor) */}
                              {ghostPreview?.start === hl.start && (
                                <span
                                  className="grid-area-1-1 text-accent italic font-light tracking-wide whitespace-nowrap"
                                  style={{ gridArea: "1/1" }}
                                >
                                  {ghostPreview.suggestion === "Omit" ? (
                                    <span className="opacity-40 italic">
                                      [Delete]
                                    </span>
                                  ) : (
                                    ghostPreview.suggestion
                                  )}
                                </span>
                              )}
                            </span>
                            <span
                              className={`absolute -top-1.5 -right-1 text-[7px] font-black opacity-80 px-0.5 rounded-[2px] leading-none ${getCategoryColor(hl.type).replace("text-", "bg-").replace("-500", "-500/10")} ${getCategoryColor(hl.type)}`}
                            >
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
                  onBlur={() => takeSnapshot(content)}
                  placeholder="Paste academic manuscript for neural forensic auditing..."
                  className="flex-1 w-full min-h-[400px] md:min-h-full bg-transparent text-text/80 text-[14px] md:text-[18px] leading-[1.6] md:leading-[2] font-light tracking-wide focus:outline-none resize-none placeholder:text-muted/20 overflow-y-auto custom-scroll font-outfit"
                />
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
              scrollToHl={scrollToHl}
              onApplySuggestion={handleApplySuggestion}
              setGhostPreview={setGhostPreview}
            />
          </div>
        )}

        {/* Diagnostics Sidebar (Mobile Fallback - Stacks underneath) */}
        {isMobile && isAnalyzing && (
          <div className="w-full h-[260px] shrink-0 border-t border-border bg-surface overflow-hidden z-[60]">
            <NeuralFeedbackHub
              diagnostics={diagnostics}
              isNeuralScanning={isNeuralScanning}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              content={content}
              getCategoryColor={getCategoryColor}
              scrollToHl={scrollToHl}
              onApplySuggestion={handleApplySuggestion}
              setGhostPreview={setGhostPreview}
            />
          </div>
        )}
      </div>

      {/* Unified Industrial Footer (Responsive) */}
      <div className="h-[48px] md:h-[56px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-2 mr-4 border-r border-border/10 pr-4">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded hover:bg-surface-3 text-muted disabled:opacity-20 transition-all"
              title="Undo (Snapshot)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded hover:bg-surface-3 text-muted disabled:opacity-20 transition-all"
              title="Redo (Snapshot)"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

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
                <Pencil className="h-3 w-3" />{" "}
                <span className="hidden xs:inline">Reset</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" />{" "}
                <span className="hidden xs:inline">Scan</span>
              </>
            )}
          </button>

          <button
            onClick={handleArchive}
            disabled={!content.trim()}
            className="h-8 md:h-10 px-3 md:px-6 rounded-[4px] border border-border text-muted hover:text-text hover:bg-surface-3 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
          >
            <Archive className="h-3 w-3" />{" "}
            <span className="hidden xs:inline">Archive</span>
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

      {/* Robust Anomaly Dropdown - NEURAL LAYER (Floating UI) */}
      <AnimatePresence>
        {selectedHl && (
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: "max-content",
            }}
            className="z-[9999] pointer-events-auto"
          >
            <ForensicDropdown
              selectedHl={selectedHl}
              content={content}
              onApplySuggestion={handleApplySuggestion}
              onAddToDictionary={handleAddToDictionary}
              onClose={() => setSelectedHl(null)}
              onMouseEnter={cancelHide}
              onMouseLeave={hideHl}
              setGhostPreview={setGhostPreview}
              getCategoryColor={getCategoryColor}
              getCategoryBg={getCategoryBg}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
