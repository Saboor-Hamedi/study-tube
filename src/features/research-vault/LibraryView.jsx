import {
  useMemo,
  memo,
  useState,
  useEffect,
  useRef,
  useDeferredValue,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Trash2,
  Search as SearchIcon,
  RefreshCcw,
  Brain,
  Library,
  FileText,
  ChevronRight,
  X,
  Maximize2,
  AlertCircle,
  Plus,
  FolderMinus,
  Download,
  GripVertical,
  Download as DownloadIcon,
  MinusCircle,
} from "lucide-react";
import CardReaderModal from "./CardReaderModal";
import { DroppableFolder, DraggableCard } from "./DraggableCard";
import ReactMarkdown from "react-markdown";
import DeleteModal from "./DeleteModal";
import InsightCaptureModal from "./InsightCaptureModal";
import PulseLoader from "./PulseLoader";

export default function LibraryView({
  vocab,
  setVocab,
  collections,
  setCollections,
  selectedCollection,
  setSelectedCollection,
  sortBy,
  setSortBy,
  displayLimit,
  setDisplayLimit,
  api,
  showToast,
  syncStats,
  stats,
  onExpand,
  onUpdateStats,
  activeDragItem,
  searchInputRef,
  // Elevated Search Logic
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  isSearching,
  setIsSearching,
  searchHistory,
  setSearchHistory,
  isHistoryOpen,
  setIsHistoryOpen,
  historyRef,
}) {
  const [localVocab, setLocalVocab] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAppending, setIsAppending] = useState(false);

  const [selectedCard, setSelectedCard] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const lastContextRef = useRef({
    collection: selectedCollection,
    sortBy: sortBy,
  });

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const syncLibraryPage = useCallback(
    async (showLoader = true) => {
      const controller = new AbortController();
      let forceHydrate = false;

      const timeout = setTimeout(() => {
        forceHydrate = true;
        setLoading(false);
        setIsAppending(false);
      }, 6000);

      const minDelay = new Promise((resolve) =>
        setTimeout(resolve, showLoader && !isAppending ? 300 : 0),
      );

      if (showLoader && !isAppending) setLoading(true);
      try {
        const fetchPromise = api.loadVocabPage({
          collection: selectedCollection,
          sortBy,
          limit: displayLimit,
        });

        const [page] = await Promise.all([fetchPromise, minDelay]);

        if (!forceHydrate) {
          setLocalVocab(page || []);
          await new Promise((r) => setTimeout(r, 50));
        }
      } catch (err) {
        console.error("Paginated fetch failure", err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
        setIsAppending(false);
      }
    },
    [selectedCollection, sortBy, displayLimit, api],
  );

  useEffect(() => {
    const loadLog = async () => {
      try {
        const log = await api.getSearchLog();
        setSearchHistory(log || []);
      } catch (err) {
        console.error("Failed to sync search intelligence", err);
      }
    };
    loadLog();
  }, [api]);



  useEffect(() => {
    // Detect if this is just a limit change or a full context change
    const contextChanged =
      lastContextRef.current.collection !== selectedCollection ||
      lastContextRef.current.sortBy !== sortBy;
    const isLimitChange = !contextChanged && localVocab.length > 0;

    if (isLimitChange) {
      // If expanding, show the appending indicator
      if (displayLimit > localVocab.length) setIsAppending(true);
      syncLibraryPage(false);
    } else {
      syncLibraryPage(true);
    }

    lastContextRef.current = { collection: selectedCollection, sortBy: sortBy };
  }, [selectedCollection, sortBy, displayLimit, syncLibraryPage]);

  const visible = localVocab;

  const totalInCollection = useMemo(() => {
    if (!stats) return 0;
    if (selectedCollection === "all") return stats.all || 0;
    if (selectedCollection === "trash") return stats.trash || 0;
    const coll = (stats.collections || []).find(
      (c) => c.name === selectedCollection,
    );
    return coll ? coll.count : 0;
  }, [stats, selectedCollection]);

  const handleUpdateItem = async (updated) => {
    try {
      await api.saveVocabItem(updated);
      setLocalVocab((prev) => {
        const isTrashView = selectedCollection === "trash";
        const isAllView = selectedCollection === "all";

        let itemBelongs = true;
        if (isTrashView) {
          itemBelongs = updated.archived;
        } else if (isAllView) {
          itemBelongs = !updated.archived;
        } else {
          // Custom Collection View
          itemBelongs =
            updated.collection === selectedCollection && !updated.archived;
        }

        if (!itemBelongs) {
          return prev.filter(
            (item) => (item.id || item.date) !== (updated.id || updated.date),
          );
        }
        return prev.map((item) =>
          (item.id || item.date) === (updated.id || updated.date)
            ? updated
            : item,
        );
      });

      // Optimistic Stat Update
      const originalItem = vocab.find(
        (i) => (i.id || i.date) === (updated.id || updated.date),
      );
      if (
        onUpdateStats &&
        originalItem &&
        originalItem.collection !== updated.collection
      ) {
        onUpdateStats(originalItem.collection, updated.collection);
      }

      if (syncStats) syncStats();
      if (setVocab)
        setVocab((prev) =>
          prev.map((item) =>
            (item.id || item.date) === (updated.id || updated.date)
              ? updated
              : item,
          ),
        );
      if (selectedCard) setSelectedCard(updated);
      // Removal of premature sync: Trust optimistic local state for content updates
    } catch (err) {
      console.error("Update failure", err);
      showToast("Nexus Synchrony Failure: Update not persistent", "error");
    }
  };

  const handleExportItem = async (item) => {
    try {
      const dataStr = JSON.stringify(item, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `research-${item.text.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Insight Exported Successfully");
    } catch (err) {
      showToast("Export Anomaly Detected", "error");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const itemId = itemToDelete.id || itemToDelete.date;
    try {
      if (selectedCollection === "trash" || itemToDelete.archived) {
        await api.deleteVocabItem(itemId);
        showToast("Insight permanently eradicated", "success");
      } else {
        const archivedItem = { ...itemToDelete, archived: true };
        await api.saveVocabItem(archivedItem);
        showToast("Insight moved to trash", "success");
      }
      setLocalVocab((prev) => prev.filter((v) => (v.id || v.date) !== itemId));
      if (setVocab)
        setVocab((prev) => prev.filter((v) => (v.id || v.date) !== itemId));

      // Optimistic Stat Decelerator
      if (onUpdateStats && itemToDelete.collection) {
        onUpdateStats(itemToDelete.collection, null);
      }

      await syncLibraryPage(false);
      if (syncStats) syncStats();
      setItemToDelete(null);
    } catch (err) {
      console.error("System refusal: Delete failed", err);
      showToast("Industrial Safety Lock: Delete aborted", "error");
    }
  };

  const handleRestore = async (item) => {
    await handleUpdateItem({ ...item, archived: 0 });
    showToast("Insight restored to archive");
  };

  const gridMemo = useMemo(
    () => (
      <div
        className={`grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5 ${activeDragItem ? "[&_*]:transition-none [&_*]:duration-0 select-none" : ""}`}
      >
        {visible.map((v, i) => (
          <DraggableCard
            key={v.id || v.date || i}
            id={v.id || v.date || i}
            v={v}
            useHandle={true}
          >
            {({ listeners, attributes }) => (
              <div className="group h-[180px] bg-surface p-5 transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-black/5 overflow-hidden relative border border-border/10 hover:border-accent/20 rounded-[5px]">
                <div className="flex flex-col gap-4 overflow-hidden">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1 min-h-[44px]">
                      <h3 className="text-[14px] font-bold text-slate-900 leading-normal line-clamp-2">
                        {v.text}
                      </h3>
                      <div className="flex items-center gap-2">
                        {v.type && (
                          <span className="text-accent text-[11px] font-bold uppercase tracking-[0.1em]">
                            {v.type.split(/[.,(]/)[0].trim().substring(0, 20)}
                          </span>
                        )}
                        {v.band && (
                          <span className="px-1.5 py-0.5 bg-accent text-white text-[9px] font-black rounded-[3px] shadow-sm flex items-center gap-1">
                            <Brain className="h-2.5 w-2.5" />
                            BAND {v.band}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <div
                        {...listeners}
                        {...attributes}
                        className="p-1.5 bg-slate-200 border border-slate-300 hover:bg-accent text-slate-600 hover:text-white transition-all cursor-grab active:cursor-grabbing rounded-[5px]"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      <button
                        onClick={() => onExpand(v)}
                        className="p-1.5 bg-slate-200 border border-slate-300 hover:bg-accent text-slate-600 hover:text-white transition-all rounded-[5px]"
                        title="Neural Link"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedCard(v)}
                        className="p-1.5 bg-slate-200 border border-slate-300 hover:bg-accent text-slate-600 hover:text-white transition-all rounded-[5px]"
                        title="Maximize View"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden relative">
                    {v.loading ? (
                      <div className="flex items-center gap-2 py-1 opacity-50">
                        <Loader2 className="h-3 w-3 animate-spin text-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                          calling ai...
                        </span>
                      </div>
                    ) : (
                      <div className="text-[12px] text-slate-600 leading-[1.6] select-text font-light tracking-wide italic overflow-hidden">
                        {v.definition
                          ?.replace(/[#*`~_]/g, "")
                          ?.replace(/\[(.*?)\]\(.*?\)/g, "$1")
                          ?.split(/\s+/)
                          ?.slice(0, 20)
                          ?.join(" ")}
                        {v.definition?.split(/\s+/).length > 20 ? "..." : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-1.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted font-bold uppercase tracking-tighter line-clamp-1 opacity-40">
                        {v.videoTitle || "Universal Knowledge"}
                      </span>
                      <span className="text-[8px] text-muted/20 font-mono tracking-tighter uppercase">
                        {new Date(v.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(i_e) => {
                        i_e.stopPropagation();
                        handleExportItem(v);
                      }}
                      className="p-1.5 hover:bg-surface-3 text-muted/20 hover:text-accent transition-all rounded-[5px]"
                    >
                      <DownloadIcon className="h-3.5 w-3.5" />
                    </button>
                    {v.archived ? (
                      <button
                        onClick={(i_e) => {
                          i_e.stopPropagation();
                          handleRestore(v);
                        }}
                        className="p-1.5 hover:bg-accent/10 text-accent transition-all rounded-[5px]"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      v.collection &&
                      selectedCollection !== "all" &&
                      selectedCollection !== "trash" && (
                        <button
                          onClick={(i_e) => {
                            i_e.stopPropagation();
                            handleUpdateItem({ ...v, collection: null });
                            showToast(`Released to Neural Archive`);
                          }}
                          className="p-1.5 hover:bg-accent/10 text-accent/40 hover:text-accent transition-all rounded-[5px]"
                          title="Remove from Collection"
                        >
                          <MinusCircle className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                    <button
                      onClick={(i_e) => {
                        i_e.stopPropagation();
                        setItemToDelete(v);
                      }}
                      className={`p-1.5 transition-all rounded-[5px] ${v.archived ? "hover:bg-red-500 text-red-500 hover:text-white" : "hover:bg-red-500/10 text-muted/20 hover:text-red-500"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </DraggableCard>
        ))}
      </div>
    ),
    [visible, activeDragItem],
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full overflow-hidden text-text bg-background"
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
            <div className="max-w-[1400px] mx-auto min-h-[400px] flex flex-col">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center p-20"
                  >
                    <PulseLoader />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex-1 flex flex-col"
                  >
                    {gridMemo}
                    <div className="mt-8 mb-20 flex flex-col items-center gap-6">
                      {isAppending ? (
                        <PulseLoader message="Expanding Research Horizon..." />
                      ) : (
                        <div className="flex items-center gap-4">
                          {localVocab.length >= displayLimit &&
                            totalInCollection > displayLimit && (
                              <button
                                onClick={() => {
                                  setDisplayLimit((prev) => prev + 3);
                                }}
                                className="group h-10 px-6 flex items-center gap-2 bg-surface-2 border border-border/10 text-muted/60 hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all rounded-full"
                              >
                                <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform duration-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                  Load more
                                </span>
                              </button>
                            )}

                          {displayLimit > 6 && (
                            <button
                              onClick={() => setDisplayLimit(6)}
                              className="h-10 px-6 flex items-center bg-transparent border border-transparent hover:border-red-500/20 text-muted/30 hover:text-red-400 transition-all rounded-full"
                            >
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                Collapse
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {selectedCard && (
        <CardReaderModal
          isOpen={!!selectedCard}
          item={selectedCard}
          onClose={() => setSelectedCard(null)}
          showToast={showToast}
          api={api}
          onUpdate={handleUpdateItem}
          collections={collections}
          onExpand={onExpand}
        />
      )}

      {itemToDelete && (
        <DeleteModal
          isOpen={!!itemToDelete}
          title={
            selectedCollection === "trash" || itemToDelete?.archived
              ? "Eradicate Research?"
              : "Move to Trash?"
          }
          message={
            selectedCollection === "trash" || itemToDelete?.archived
              ? "This action permanently dissolves the insight from the neural archive."
              : "The insight will be moved to the trash for later disposal."
          }
          onConfirm={handleDelete}
          onClose={() => setItemToDelete(null)}
        />
      )}
    </>
  );
}
