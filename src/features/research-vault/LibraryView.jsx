import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  FolderPlus,
  ChevronRight,
  Filter,
  MoreVertical,
  Download,
  Award,
  BookOpen,
  Calendar,
  Grid,
  List,
  Library,
  ChevronDown,
  X,
  History,
  FileText,
} from "lucide-react";
import DraggableCard from "./DraggableCard";
import PulseLoader from "./PulseLoader";
import StreamControls from "../../components/StreamControls";

const LibraryView = ({
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
  onExpand,
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
}) => {
  const [loading, setLoading] = useState(false);
  const [deferredSearchQuery, setDeferredSearchQuery] = useState(searchQuery);

  // Sync deferred query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredVocab = useMemo(() => {
    let filtered = [...vocab];

    // Archive / Trash filter handled by collection system
    if (selectedCollection !== "all") {
      filtered = filtered.filter((v) => v.collection === selectedCollection);
    } else {
      // "all" shows everything not archived and not in trash
      filtered = filtered.filter(
        (v) => !v.archived && v.collection !== "trash",
      );
    }

    if (deferredSearchQuery) {
      const q = deferredSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.text?.toLowerCase().includes(q) ||
          v.videoTitle?.toLowerCase().includes(q) ||
          v.metadata?.videoTitle?.toLowerCase().includes(q),
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      return 0;
    });
  }, [vocab, selectedCollection, deferredSearchQuery, sortBy]);

  const totalInCollection = filteredVocab.length;

  const renderGrid = useMemo(() => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
        {filteredVocab.slice(0, displayLimit).map((v) => (
          <div key={v.id} className="relative group">
            <DraggableCard
              id={v.id}
              v={v}
              onExpand={() => onExpand(v)}
              onDelete={async () => {
                try {
                  if (api?.archiveVocabItem) {
                    await api.archiveVocabItem(v.id);
                    setVocab(vocab.filter((item) => item.id !== v.id));
                    if (showToast)
                      showToast("Neural Fragment Moved to Trash", "success");
                  }
                } catch (err) {
                  console.error("Purge failure:", err);
                }
              }}
            >
              {(visible) => (
                <div
                  className={`w-full flex-1 flex flex-col transition-all duration-500 rounded-[12px] overflow-hidden border ${v.archived ? "border-red-500/20 bg-red-500/5" : "border-border bg-white dark:bg-surface shadow-sm hover:border-accent/40"}`}
                >
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-text leading-tight group-hover:text-accent transition-colors">
                          {v.text}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold text-muted uppercase tracking-widest shrink-0 opacity-40">
                            {new Date(v.date).toLocaleDateString()}
                          </span>
                          {v.videoTitle && (
                            <span className="text-[9px] font-black text-accent truncate opacity-80 uppercase tracking-widest">
                              {v.videoTitle}
                            </span>
                          )}
                          {(v.band || v.metadata?.band || v.diagnostics?.ielts || v.metadata?.diagnostics?.ielts) && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10 uppercase tracking-widest shrink-0">
                              <Award className="h-2.5 w-2.5" /> Band{" "}
                              {v.band || v.metadata?.band || v.diagnostics?.ielts || v.metadata?.diagnostics?.ielts}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-[8px] bg-surface-2 flex items-center justify-center border border-border shrink-0">
                        <FileText className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/10">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExpand(v);
                          }}
                          className="h-6 px-3 bg-surface-3 border border-border/10 text-muted text-[8px] font-black uppercase tracking-widest rounded-[4px] hover:bg-accent hover:text-white transition-all"
                        >
                          Open
                        </button>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (api?.archiveVocabItem) {
                              await api.archiveVocabItem(v.id);
                              setVocab(
                                vocab.filter((item) => item.id !== v.id),
                              );
                              if (showToast)
                                showToast("Fragment Decommissioned", "success");
                            }
                          } catch (err) {
                            console.error("Purge failure:", err);
                          }
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
          </div>
        ))}
      </div>
    );
  }, [filteredVocab, displayLimit, onExpand, api, setVocab, vocab, showToast]);

  return (
    <div className="h-full flex flex-col bg-surface border border-border rounded-[8px] text-text font-sans relative overflow-hidden select-text">
      {/* Standardized Control Bar - Hidden on small screens, Full Width */}
      <div className="hidden md:flex h-12 px-4 border-b border-border items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Library className="h-4 w-4 text-accent" />
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] font-black tracking-tight uppercase">
              Research Vault
            </h2>
            <span className="text-[8px] text-muted/40 font-bold uppercase">
              / {selectedCollection} ({totalInCollection})
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll ">
        <div className="p-3 md:p-6 pb-128">
          <div className="max-w-[1400px] mx-auto relative ">
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className=" absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"
                >
                  <PulseLoader message="Synchronizing Library..." />
                </motion.div>
              )}
            </AnimatePresence>

            {renderGrid}

            {/* Unified Stream Controls */}
            <StreamControls
              currentLimit={displayLimit}
              totalItems={filteredVocab.length}
              onLoadMore={() => setDisplayLimit((prev) => prev + 12)}
              onCollapse={() => setDisplayLimit(6)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryView;
