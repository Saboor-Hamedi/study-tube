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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onOpenCopilot) {
        const currentText = isEditing ? titleEditVal : item?.text || "";
        const currentDef = isEditing ? editVal : item?.definition || "";
        const activeContext = selection || currentDef;
        const itemKey = `${item?.id || item?.date}-${currentText}-${activeContext}-${selection}`;
        if (lastSyncedItem.current === itemKey) return;
        onOpenCopilot({
          type: "insight",
          text: currentText,
          definition: activeContext,
          isClipped: false,
        });
        lastSyncedItem.current = itemKey;
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [item, isEditing, editVal, titleEditVal, selection, onOpenCopilot]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-background overflow-hidden relative"
    >
      <div
        className="flex-1 overflow-y-auto scrollbar-thin relative"
        ref={contentRef}
        onMouseUp={handleSelection}
      >
        <div
          className={`max-w-4xl mx-auto p-12 bg-white shadow-sm border-x border-border/10 relative z-10 ${isEditing ? "flex flex-col h-full" : "min-h-full"}`}
        >
          {/* Neural Analytics Rail */}
          <div className="mb-8 flex items-center gap-3 border-b border-border/5 pb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted font-black uppercase tracking-[0.2em] opacity-40">
                Insight Analytics
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-accent/40 font-mono tracking-tighter uppercase">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <span className="text-[9px] text-muted font-black uppercase tracking-[0.2em]">
                  {stats.charCount} chars • {stats.readTime}m read
                </span>
              </div>
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full flex-1 bg-surface-2 border border-border/40 rounded-[8px] p-5 text-[14px] leading-relaxed text-text focus:outline-none focus:border-accent/40 resize-none scrollbar-thin"
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
    </motion.div>
  );
};

export default memo(InsightDetailView);
