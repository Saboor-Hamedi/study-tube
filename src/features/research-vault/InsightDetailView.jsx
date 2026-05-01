import { useState, memo, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Pencil, X, Save, Plus, Sparkles } from "lucide-react";
import { formatNeuralText } from "../../utils/neuralFormat";

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
  isEditing,
  setIsEditing,
  saveTrigger,
}) => {
  const sidebarOffset = !isCopilotOpen ? 15 : isCopilotCollapsed ? 67 : 395;
  const [editVal, setEditVal] = useState(item?.definition || "");
  const [titleEditVal, setTitleEditVal] = useState(item?.text || "");
  const [selection, setSelection] = useState("");
  const [selectionRects, setSelectionRects] = useState([]);
  const contentRef = useRef(null);
  const lastSyncedItem = useRef(null);

  useEffect(() => {
    const hydrate = async () => {
      if (item) {
        let fullItem = { ...item };
        if (!item.definition && (item.id || item.date)) {
          try {
            const results = await api.loadVocabPage({
              id: item.id || item.date,
              limit: 1,
            });
            if (results?.[0]) fullItem = results[0];
          } catch (err) {
            console.error("[NEURAL WORKSPACE] Synchronization Failure:", err);
          }
        }
        setEditVal(fullItem.definition || "");
        setTitleEditVal(fullItem.text || "");
      }
    };
    hydrate();
  }, [item, api]);

  const stats = useMemo(() => {
    const text = editVal || item?.definition || "";
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    return { charCount, wordCount, readTime };
  }, [editVal, item?.definition]);

  const renderedHtml = useMemo(() => {
    return formatNeuralText(editVal || item.definition);
  }, [editVal, item.definition]);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel.toString().trim();

    if (selectedText && selectedText.length > 5) {
      setSelection(selectedText);
      const range = sel.getRangeAt(0);
      const rects = Array.from(range.getClientRects());
      const containerRect = contentRef.current.getBoundingClientRect();
      const mappedRects = rects.map((r) => ({
        top: r.top - containerRect.top + contentRef.current.scrollTop,
        left: r.left - containerRect.left,
        width: r.width,
        height: r.height,
      }));
      setSelectionRects(mappedRects);
    } else {
      setSelection("");
      setSelectionRects([]);
    }
  }, []);

  const lastHandledSave = useRef(0);

  const handleSaveEdit = useCallback(() => {
    onUpdate({
      ...item,
      text: titleEditVal,
      definition: editVal,
      summary: item.summary,
    });
    setIsEditing(false);
    // showToast("Archive Permanently Updated");
  }, [onUpdate, item, titleEditVal, editVal, setIsEditing, showToast]);

  useEffect(() => {
    if (saveTrigger > 0 && saveTrigger !== lastHandledSave.current) {
      handleSaveEdit();
      lastHandledSave.current = saveTrigger;
    }
  }, [saveTrigger, handleSaveEdit]);

  if (!item) return null;

  return (
    <div className="flex h-full bg-background overflow-hidden select-text">
      <div className="flex-1 flex flex-col overflow-hidden relative px-2 pt-3 pb-0">
        <div className="flex-1 overflow-hidden flex flex-col bg-surface border border-border/10 rounded-[12px] shadow-black/10 relative">
          <div
            className="flex-1 overflow-y-auto custom-scroll relative p-8 lg:p-12 flex flex-col"
            ref={contentRef}
            onMouseUp={handleSelection}
          >
            <div className="max-w-4xl mx-auto relative z-10 flex flex-col flex-1 w-full">


          {isEditing ? (
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full flex-1 bg-transparent border-none p-0 text-[16px] leading-[1.8] text-text focus:outline-none resize-none custom-scroll font-light tracking-wide"
              placeholder="Initialize neural drafting..."
              autoFocus
            />
          ) : (
            <StaticContent html={renderedHtml} />
          )}

          {/* Synthesis Abstract (Positioned at bottom of scroll stream) */}
          {item.summary && !isEditing && (
            <div className="mt-12 p-8 bg-accent/5 border border-border/10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 select-text cursor-text rounded-[8px]">
              <div className="flex items-center gap-2 text-accent select-none">
                <Sparkles className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">
                  Final Neural Synthesis
                </span>
              </div>
              <div className="text-[14px] text-muted leading-relaxed font-light space-y-3 select-text cursor-text">
                {item.summary.split("\n").map((l, i) => (
                  <p
                    key={i}
                    className="flex gap-4 select-text cursor-text text-text"
                  >
                    <span className="text-accent/30 font-black flex-shrink-0 select-none">
                      /
                    </span>
                    {l.replace(/^[•\-\d\.]+\s*/, "")}
                  </p>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Neural Selection Overlay */}
          {selectionRects.map((rect, i) => (
            <div
              key={i}
              className="absolute bg-accent/10 pointer-events-none z-0"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
            />
          ))}
        </div>

        {/* Integrated Statistics Footer (72px Baseline) */}
        <div className="h-[72px] border-t border-border/10 bg-surface-2/50 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                Density
              </span>
              <span className="text-[12px] font-black tabular-nums text-text">
                {stats.charCount} <span className="text-[8px] opacity-40">CHARS</span>
              </span>
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                Volume
              </span>
              <span className="text-[12px] font-black tabular-nums text-text">
                {stats.wordCount} <span className="text-[8px] opacity-40">WORDS</span>
              </span>
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                Horizon
              </span>
              <span className="text-[12px] font-black tabular-nums text-text">
                {stats.readTime} <span className="text-[8px] opacity-40">MIN READ</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-text/40 uppercase tracking-[0.2em]">
                Neural: Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Insight Dashboard Panel */}
    <div className="w-[320px] shrink-0 bg-surface flex flex-col border-l border-border">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-[11px] font-black tracking-tight uppercase">
            Insight Hub
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-3 rounded-[4px] text-muted transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-6">
        {/* Metadata Grid */}
        <div className="space-y-4">
          <div className="bg-surface-2/50 border border-border/10 p-4 rounded-[10px] space-y-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1 opacity-50">
                Insight Analytics
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-text/80">
                  {new Date(item.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1 opacity-50">
                  Density
                </span>
                <span className="text-[11px] font-mono font-bold text-text/80">
                  {stats.charCount} <span className="text-[8px] opacity-40">CHARS</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1 opacity-50">
                  Volume
                </span>
                <span className="text-[11px] font-mono font-bold text-text/80">
                  {stats.wordCount} <span className="text-[8px] opacity-40">WORDS</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1 opacity-50">
                Document ID
              </span>
              <span className="text-[10px] font-mono font-bold text-accent/60 truncate">
                {item.id || item.date}
              </span>
            </div>
          </div>
        </div>

        {/* Action Hub */}
        <div className="space-y-3">
          <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] px-1">
            Actions
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`h-11 rounded-[8px] flex items-center justify-center gap-2 transition-all font-black text-[11px] border ${
                isEditing
                  ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                  : "bg-surface-3 text-muted hover:text-text border-border/10 hover:bg-surface-4"
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" /> Save Modification
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" /> Edit Definition
                </>
              )}
            </button>
            
            <button
              onClick={() => onOpenCopilot?.(item)}
              className="h-11 rounded-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all font-black text-[11px] flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Analyze with Copilot
            </button>
          </div>
        </div>
      </div>

      {/* Global Action Baseline */}
      <div className="p-3 border-t border-border bg-surface shrink-0 flex gap-2 h-[72px] items-center">
        <button
          onClick={onClose}
          className="flex-1 h-11 rounded-[10px] bg-surface-3 border border-border text-text hover:bg-surface-4 transition-all font-black text-[11px] tracking-tight flex items-center justify-center gap-2"
        >
          Close Insight
        </button>
      </div>
    </div>
  </div>
);
};

export default memo(InsightDetailView);
