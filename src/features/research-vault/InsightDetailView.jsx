import { useState, memo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Pencil, X, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
      const mappedRects = rects.map(r => ({
        top: r.top - containerRect.top + contentRef.current.scrollTop,
        left: r.left - containerRect.left,
        width: r.width,
        height: r.height
      }));
      setSelectionRects(mappedRects);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onOpenCopilot) {
        const currentText = isEditing ? titleEditVal : item?.text || "";
        const currentDef = isEditing ? editVal : item?.definition || "";
        const activeContext = selection || (currentDef?.length > 1000 ? currentDef.substring(0, 1000) + "..." : currentDef);
        const itemKey = `${item?.id || item?.date}-${currentText}-${activeContext}-${selection}`;
        if (lastSyncedItem.current === itemKey) return;
        onOpenCopilot({
          type: "insight",
          text: currentText,
          definition: activeContext,
          isClipped: !selection && currentDef?.length > 1000
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-background overflow-hidden">
      <div className="h-[56px] shrink-0 flex items-center justify-between px-5 border-b border-border/20 bg-surface">
        <h2 className="text-[13px] font-black text-text tracking-tight truncate pr-4">{item.text}</h2>
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <button onClick={handleSaveEdit} className="p-2 bg-accent text-white hover:brightness-110 transition-all rounded-[5px]">
              <Save className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-2 text-muted hover:text-text hover:bg-surface-3 transition-all rounded-[5px]">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 text-muted hover:text-text hover:bg-surface-3 transition-all rounded-[5px]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-8 selection:bg-accent/40 selection:text-white cursor-text antialiased relative" onMouseUp={handleSelection}>
        {selectionRects.map((r, i) => (
          <div key={i} className="absolute bg-accent/20 pointer-events-none rounded-[2px] z-0 animate-in fade-in zoom-in-95 duration-200" style={{ top: r.top, left: r.left, width: r.width, height: r.height }} />
        ))}
        <div className="max-w-4xl mx-auto w-full relative z-10">
          {isEditing ? (
            <textarea value={editVal} onChange={(e) => setEditVal(e.target.value)} className="w-full bg-surface-2 border border-border/40 rounded-[8px] p-5 text-[14px] leading-relaxed text-text focus:outline-none focus:border-accent/40 min-h-[400px] resize-none scrollbar-thin" />
          ) : (
            <div className="prose prose-sm prose-invert max-w-none prose-p:text-text/70 prose-p:leading-[1.8] prose-p:font-light prose-p:mb-6 prose-strong:text-accent prose-strong:font-bold prose-headings:text-text prose-headings:font-black prose-li:text-text/70 prose-li:font-light select-text pointer-events-auto cursor-text">
              <ReactMarkdown>{editVal || item.definition}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(InsightDetailView);
