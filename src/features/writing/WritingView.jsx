import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, RotateCw, Plus } from "lucide-react";
import {
  useFloating,
  offset,
  flip,
  shift,
  hide,
  autoUpdate,
} from "@floating-ui/react";
import { useRigor } from "../../hooks/useRigor";
import WritingHub from "./WritingHub";
import WritingMenu from "./WritingMenu";
import WritingBody from "./WritingBody";

export default function WritingView({
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

  const takeSnapshot = useCallback(
    (newText) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const updated = [...sliced, newText];
        if (updated.length > 50) return updated.slice(1);
        return updated;
      });
      setHistoryIndex((prev) => (prev + 1 > 49 ? 49 : prev + 1));
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

  const {
    x,
    y,
    refs,
    strategy,
    placement: finalPlacement,
  } = useFloating({
    open: !!selectedHl,
    onOpenChange: (open) => !open && setSelectedHl(null),
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [
      offset(15),
      flip({
        padding: 20,
        fallbackPlacements: ["top-start", "bottom-end", "top-end"],
        boundary: containerRef.current || "clippingAncestors",
      }),
      shift({
        padding: 10,
        boundary: containerRef.current || "clippingAncestors",
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

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
    setIsAnalyzing(true);
    const res = await analyze(content);
    if (res && res.diagnostics) {
      setDiagnostics(res.diagnostics);
    }
  };

  const handleApplySuggestion = async (suggestion, specificHl = null) => {
    const hl = specificHl || selectedHl;
    if (!hl) return;

    takeSnapshot(content);

    let start = hl.start;
    let end = hl.end;

    const isNeuralFix =
      (hl.type === "sentence" || hl.reason === "Sentence Structure") &&
      (suggestion.split(/\s+/).length > 4 || /[.!?]$/.test(suggestion));

    if (isNeuralFix) {
      const textBefore = content.substring(Math.max(0, start - 150), start);
      const lastBoundary = Math.max(
        textBefore.lastIndexOf("."),
        textBefore.lastIndexOf("!"),
        textBefore.lastIndexOf("?"),
        textBefore.lastIndexOf("\n"),
      );
      if (lastBoundary !== -1) {
        start = Math.max(0, start - 150) + lastBoundary + 1;
      } else if (start < 150) {
        start = 0;
      }

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
      content.substring(0, start) + suggestion.trim() + content.substring(end);
    const delta = suggestion.trim().length - (end - start);

    setDiagnostics((prev) => {
      const existing = prev.highlights || [];
      const updated = existing
        .filter((h) => {
          if (h === hl || h.start === hl.start) return false;
          const isOverlapping =
            (h.start >= start && h.start < end) ||
            (h.end > start && h.end <= end) ||
            (h.start <= start && h.end >= end);
          return !isOverlapping;
        })
        .map((h) => {
          if (h.start >= end) {
            return { ...h, start: h.start + delta, end: h.end + delta };
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

  const handleIgnoreHighlight = (hl) => {
    setDiagnostics((prev) => {
      const updated = (prev.highlights || []).filter((h) => h !== hl);
      return { ...prev, highlights: updated };
    });
    setSelectedHl(null);
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
      if (showToast) showToast("Archive Failed", "error");
    }
  };

  const showHl = (hl, i, e) => {
    refs.setReference(e.currentTarget);
    setSelectedHl({ ...hl, index: i + 1 });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If menu is open and click is outside refs.floating, close it
      if (
        selectedHl &&
        refs.floating.current &&
        !refs.floating.current.contains(e.target)
      ) {
        // Also ensure we aren't clicking the highlight itself again
        const isHighlightClick = e.target.closest(".group\\/hl");
        if (!isHighlightClick) {
          setSelectedHl(null);
          setGhostPreview(null);
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedHl(null);
        setGhostPreview(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedHl, refs.floating, setGhostPreview]);

  const scrollToHl = (index) => {
    const el = document.getElementById(`hl-${index}`);
    const container = el?.closest(".overflow-y-auto");
    if (el && container) {
      const topPos =
        el.offsetTop - container.offsetHeight / 2 + el.offsetHeight / 2;
      container.scrollTo({ top: topPos, behavior: "smooth" });
    }
  };

  const scrollToAnomaly = (index) => {
    const el = document.getElementById(`anomaly-${index}`);
    const container = el?.closest(".overflow-y-auto");
    if (el && container) {
      const topPos =
        el.offsetTop - container.offsetHeight / 2 + el.offsetHeight / 2;
      container.scrollTo({ top: topPos, behavior: "smooth" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface text-text overflow-hidden font-sans select-text relative">
      <div ref={containerRef} className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        <WritingBody
          content={content}
          setContent={setContent}
          isAnalyzing={isAnalyzing}
          isNeuralScanning={isNeuralScanning}
          diagnostics={diagnostics}
          getCategoryBg={getCategoryBg}
          getCategoryColor={getCategoryColor}
          ghostPreview={ghostPreview}
          showHl={showHl}
          scrollToAnomaly={scrollToAnomaly}
          takeSnapshot={takeSnapshot}
          floatingMenu={
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
                  className="z-[90] pointer-events-auto"
                >
                  <WritingMenu
                    selectedHl={selectedHl}
                    content={content}
                    onApplySuggestion={handleApplySuggestion}
                    onAddToDictionary={handleAddToDictionary}
                    onIgnore={handleIgnoreHighlight}
                    onClose={() => {
                      setSelectedHl(null);
                      setGhostPreview(null);
                    }}
                    setGhostPreview={setGhostPreview}
                    getCategoryColor={getCategoryColor}
                    getCategoryBg={getCategoryBg}
                    placement={finalPlacement}
                  />
                </div>
              )}
            </AnimatePresence>
          }
        />

        {!isMobile && isSidebarOpen && document.getElementById("writing-hub-portal") && createPortal(
          <WritingHub
            diagnostics={diagnostics}
            isNeuralScanning={isNeuralScanning}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            content={content}
            getCategoryColor={getCategoryColor}
            scrollToHl={scrollToHl}
            onApplySuggestion={handleApplySuggestion}
            onIgnore={handleIgnoreHighlight}
            setGhostPreview={setGhostPreview}
          />,
          document.getElementById("writing-hub-portal")
        )}

        {isMobile && isAnalyzing && (
          <div className="w-full h-[260px] shrink-0 border-t border-border bg-surface overflow-hidden z-[60]">
            <WritingHub
              diagnostics={diagnostics}
              isNeuralScanning={isNeuralScanning}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              content={content}
              getCategoryColor={getCategoryColor}
              scrollToHl={scrollToHl}
              onApplySuggestion={handleApplySuggestion}
              onIgnore={handleIgnoreHighlight}
              setGhostPreview={setGhostPreview}
            />
          </div>
        )}
      </div>

      <div className="h-[40px] border-t border-border bg-surface flex items-center justify-between px-3 md:px-6 shrink-0 z-[70] relative select-text cursor-text">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 border-r border-border/10 pr-4">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded hover:bg-surface-3 text-muted disabled:opacity-20 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded hover:bg-surface-3 text-muted disabled:opacity-20 transition-all"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
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
               <div key={m.label} className="flex items-center gap-1.5">
                <span className="text-[7px] md:text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                  {m.label}
                </span>
                <span className="text-[9px] md:text-[10px] font-black text-text tabular-nums">
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {!isMobile && (
            <div className="flex items-center gap-4 shrink-0">
              <div className="h-4 w-px bg-border/10" />
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] md:text-[8px] font-bold text-muted/40 uppercase tracking-[0.2em]">
                  Neural Engine
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              isAnalyzing ? setIsAnalyzing(false) : handleDeepAnalyze()
            }
            disabled={isNeuralScanning || (!content.trim() && !isAnalyzing)}
            className={`h-8 px-4 md:px-8 rounded-[4px] flex items-center justify-center gap-1.5 transition-all font-medium text-[11px] ${
              isNeuralScanning
                ? "bg-blue-500/20 text-blue-400 animate-pulse"
                : isAnalyzing
                  ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4"
                  : "bg-blue-500 text-white hover:brightness-110 shadow-lg shadow-blue-500/20 border border-white/10"
            }`}
          >
            {isNeuralScanning ? (
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <motion.div className="h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </motion.div>
                </div>
                <span className="hidden xs:inline">Scanning...</span>
              </div>
            ) : isAnalyzing ? (
              <span className="font-semibold text-[10px] md:text-[11px]">
                Edit
              </span>
            ) : (
              <span className="font-semibold text-[10px] md:text-[11px]">
                Scan
              </span>
            )}
          </button>

          <button
            onClick={handleArchive}
            disabled={!content.trim()}
            className="h-8 px-4 md:px-8 rounded-[4px] bg-blue-500 text-white hover:brightness-110 shadow-lg shadow-blue-500/20 transition-all font-medium text-[11px] flex items-center justify-center border border-white/10"
          >
            Archive
          </button>

          {!isMobile && (
            <button
              onClick={onOpenCapture}
              className="h-8 w-8 bg-blue-500 hover:brightness-110 text-white rounded-[4px] flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 border border-white/10"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
