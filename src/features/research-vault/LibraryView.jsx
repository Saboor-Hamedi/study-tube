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
import { truncateWords } from "../../utils/textUtils";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
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
                  className={`w-full h-auto min-h-[150px] flex flex-col transition-all duration-500 border rounded-[5px] overflow-hidden ${v.archived ? "border-red-500/20 bg-red-500/5" : "border-border bg-surface shadow-sm hover:border-accent/40"} relative group`}
                >
                  {/* Body: Content & Context */}
                  <div className="p-3 flex-1 flex flex-col gap-2 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-accent shrink-0 opacity-40" />
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted truncate opacity-60">
                        Neural Archive
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h4 className="text-[12px] font-black text-text leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {truncateWords(v.text, 15)}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                          {new Date(v.date).toLocaleDateString()}
                        </span>
                        {v.videoTitle && (
                          <span className="text-[7px] font-black text-accent/40 uppercase tracking-widest truncate">
                            • {v.videoTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Beautiful Slim Footer */}
                  <div className="px-3 py-1.5 bg-surface-2/30 border-t border-border/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[6px] font-black text-muted/30 uppercase tracking-[0.2em]">
                        Diagnostic Node
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Beautiful Small Score Badge */}
                      {(v.band || v.metadata?.band || v.diagnostics?.ielts) && (
                        <span className="flex items-center gap-1 text-[8px] font-black text-accent bg-accent/5 px-1.5 py-0.5 border border-accent/10 uppercase tracking-widest rounded-[2px]">
                          B{v.band || v.metadata?.band || v.diagnostics?.ielts}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 border-l border-border/10 pl-3">
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
                                  showToast(
                                    "Fragment Decommissioned",
                                    "success",
                                  );
                              }
                            } catch (err) {
                              console.error("Purge failure:", err);
                            }
                          }}
                          className={`p-1 transition-all ${v.archived ? "text-red-500" : "text-muted/20 hover:text-red-500"}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExpand(v);
                          }}
                          className="p-1 text-accent hover:brightness-110 transition-all"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
    <div className="h-full flex flex-col bg-surface text-text p-1 font-sans relative overflow-hidden select-text">
      <div className="flex-1 overflow-y-auto custom-scroll ">
        <div className="pb-20">
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
