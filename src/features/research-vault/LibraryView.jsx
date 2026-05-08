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

import { api as bridgeApi } from "./../../utils/api-bridge";

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
  const activeApi = api || bridgeApi;
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
        const fetchPromise = activeApi.loadVocabPage({
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
    [selectedCollection, sortBy, displayLimit, activeApi],
  );

  const handleCloudPull = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await activeApi.pullFromCloud();
      if (result?.success) {
        showToast(`Cloud Restoration: ${result.count} items recovered`, "success");
        await syncLibraryPage(true);
        if (syncStats) syncStats();
      } else {
        showToast("Cloud connection refused", "error");
      }
    } catch (err) {
      showToast("Sync anomaly detected", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadLog = async () => {
      try {
        const log = await activeApi.getSearchLog();
        if (log) setSearchHistory(log);
      } catch (err) {}
    };
    loadLog();
  }, [activeApi, setSearchHistory]);

  const handleUpdateItem = (updatedItem) => {
    setLocalVocab((prev) =>
      prev.map((v) => (v.id === updatedItem.id ? updatedItem : v)),
    );
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (selectedCollection === "trash" || itemToDelete.archived) {
        await activeApi.deleteVocabItem(itemToDelete.id);
        setLocalVocab((prev) => prev.filter((v) => v.id !== itemToDelete.id));
        showToast("Insight Purged", "success");
      } else {
        await activeApi.updateVocabItem(itemToDelete.id, {
          ...itemToDelete,
          archived: true,
        });
        setLocalVocab((prev) => prev.filter((v) => v.id !== itemToDelete.id));
        showToast("Moved to Trash", "success");
      }
      if (onUpdateStats) onUpdateStats();
    } catch (err) {
      showToast("Operation Failed", "error");
    } finally {
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    if (
      lastContextRef.current.collection !== selectedCollection ||
      lastContextRef.current.sortBy !== sortBy
    ) {
      setDisplayLimit(6);
      lastContextRef.current = { collection: selectedCollection, sortBy };
    }
    syncLibraryPage();
  }, [selectedCollection, sortBy, displayLimit, syncLibraryPage, setDisplayLimit]);

  const visible = useMemo(() => {
    if (deferredSearchQuery.trim()) {
      return localVocab.filter((v) =>
        v.text.toLowerCase().includes(deferredSearchQuery.toLowerCase()),
      );
    }
    return localVocab;
  }, [localVocab, deferredSearchQuery]);

  const totalInCollection = useMemo(() => {
    if (selectedCollection === "all") return stats?.all || 0;
    if (selectedCollection === "trash") return stats?.trash || 0;
    const c = stats?.collections?.find((c) => c.name === selectedCollection);
    return c ? c.count : 0;
  }, [stats, selectedCollection]);

  const gridMemo = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visible.map((v) => (
          <DraggableCard key={v.id} item={v} activeDragItem={activeDragItem}>
            {(isDragging) => (
              <div
                onClick={() => setSelectedCard(v)}
                className={`group relative bg-surface border border-border/10 rounded-[16px] p-6 hover:border-accent/40 transition-all cursor-pointer shadow-xl shadow-black/10 flex flex-col min-h-[180px] ${isDragging ? "opacity-50 grayscale" : ""}`}
              >
                {/* Badge/Category */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center border border-border/5">
                      <FileText className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                      {v.collection || "Unsorted"}
                    </span>
                  </div>
                  {v.metadata?.band && (
                    <div className="px-2 py-1 bg-accent/10 border border-accent/20 rounded-[6px] flex items-center gap-1">
                      <Brain className="h-2.5 w-2.5 text-accent" />
                      <span className="text-[9px] font-black text-accent uppercase">
                        Band {v.metadata.band}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-[14px] font-black text-text leading-tight group-hover:text-accent transition-colors line-clamp-2">
                    {v.text}
                  </h3>
                  <div className="text-[11px] text-muted leading-relaxed line-clamp-3 font-medium opacity-60">
                    <ReactMarkdown>
                      {v.definition || "No neural content extracted."}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-6 pt-4 border-t border-border/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted/40" />
                      <span className="text-[9px] font-bold text-muted/60 uppercase">
                        {new Date(v.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    {selectedCollection === "trash" && (
                      <button
                        onClick={(i_e) => {
                          i_e.stopPropagation();
                          activeApi.updateVocabItem(v.id, {
                            ...v,
                            archived: false,
                          }).then(() => {
                            setLocalVocab(prev => prev.filter(item => item.id !== v.id));
                            if (onUpdateStats) onUpdateStats();
                            showToast("Restored from Void", "success");
                          });
                        }}
                        className="p-1.5 hover:bg-emerald-500/10 text-muted/20 hover:text-emerald-500 transition-all rounded-[5px]"
                        title="Restore"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
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
    [visible, activeDragItem, activeApi, onUpdateStats, selectedCollection, showToast],
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
            <div className="max-w-[1400px] mx-auto min-h-[400px] flex flex-col relative">
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-[20px]"
                  >
                    <PulseLoader message="Synchronizing Neural Archive..." />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full flex-1 flex flex-col transition-all duration-500 ${loading ? "grayscale opacity-30 pointer-events-none" : ""}`}
              >
                  {/* Industrial Control Bar */}
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <h2 className="text-[18px] font-black text-text uppercase tracking-tight">
                          Research Vault
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                            {selectedCollection}
                          </span>
                          <span className="text-[8px] text-muted/40 font-bold uppercase">
                            / {totalInCollection} Items
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCloudPull}
                        disabled={loading}
                        className={`h-10 px-6 rounded-full border border-border/10 flex items-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest ${loading ? "bg-accent/10 text-accent animate-pulse" : "bg-surface-2 text-muted hover:text-accent hover:border-accent/30"}`}
                      >
                        <RefreshCcw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                        <span>
                          {loading ? "Syncing..." : "Sync Cloud"}
                        </span>
                      </button>
                    </div>
                  </div>

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
