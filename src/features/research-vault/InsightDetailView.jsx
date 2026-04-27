import { useState, memo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Pencil, X, Save } from "lucide-react";
import { formatNeuralText } from "../../utils/neuralFormat";

const InsightDetailView = ({
  item,
  setView,
  showToast,
  api,
  onUpdate,
  onOpenCopilot,
  onClose,
  collections,
  selectedCollection,
  setSelectedCollection,
}) => {
  const [isEditing, setIsEditing] = useState(false);
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
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onOpenCopilot) {
        const currentText = isEditing ? titleEditVal : item?.text || "";
        const currentDef = isEditing ? editVal : item?.definition || "";
        const activeContext =
          selection ||
          (currentDef?.length > 1000
            ? currentDef.substring(0, 1000) + "..."
            : currentDef);
        const itemKey = `${item?.id || item?.date}-${currentText}-${activeContext}-${selection}`;
        if (lastSyncedItem.current === itemKey) return;
        onOpenCopilot({
          type: "insight",
          text: currentText,
          definition: activeContext,
          isClipped: !selection && currentDef?.length > 1000,
        });
        lastSyncedItem.current = itemKey;
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [item, isEditing, editVal, titleEditVal, selection, onOpenCopilot]);

  const handleSaveEdit = () => {
    onUpdate({ ...item, text: titleEditVal, definition: editVal });
    setIsEditing(false);
    showToast("Archive Permanently Updated");
  };

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-background overflow-hidden relative"
    >
      {/* Nano-Scale Action Rail */}
      <div className="absolute top-2 right-12  z-[50] flex items-center gap-1.5 p-1 bg-background/40 backdrop-blur-md rounded-[6px] border border-border/10">
        {isEditing ? (
          <button
            onClick={handleSaveEdit}
            className="p-1.5 bg-emerald-500 text-white hover:brightness-110 transition-all rounded-[4px] shadow-lg shadow-emerald-500/20"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-surface-3 border border-border/10 text-muted hover:text-text hover:bg-surface transition-all rounded-[4px] shadow-sm"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => (isEditing ? setIsEditing(false) : onClose())}
          className="p-1.5 bg-surface-3 border border-border/10 text-muted hover:text-red-500 hover:bg-red-500/10 transition-all rounded-[4px] shadow-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-thin relative"
        ref={contentRef}
        onMouseUp={handleSelection}
      >
        <div
          className={`max-w-4xl mx-auto p-12 bg-white shadow-sm border-x border-border/10 relative z-10 ${isEditing ? "flex flex-col h-full" : "min-h-full"}`}
        >
          {isEditing ? (
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full flex-1 bg-surface-2 border border-border/40 rounded-[8px] p-5 text-[14px] leading-relaxed text-text focus:outline-none focus:border-accent/40 resize-none scrollbar-thin"
              autoFocus
            />
          ) : (
            <div
              className="neural-report select-text cursor-text"
              dangerouslySetInnerHTML={{
                __html: formatNeuralText(editVal || item.definition),
              }}
            />
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
