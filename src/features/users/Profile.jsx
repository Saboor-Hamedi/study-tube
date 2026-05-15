import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Trash2,
  Archive as ArchiveIcon,
  Library as LibraryIcon,
  Award,
  FileText,
  ChevronRight,
} from "lucide-react";
import LibraryTrash from "./LibraryTrash";
import LibraryView from "../research-vault/LibraryView";
import DeleteModal from "../research-vault/DeleteModal";
import WritingView from "../writing/WritingView";
import PulseLoader from "../research-vault/PulseLoader";
import SystemStatus from "./SystemStatus";
import StreamControls from "../../components/StreamControls";
import { truncateWords } from "../../utils/textUtils";

const Profile = ({
  vocab,
  setVocab,
  onExpand,
  api,
  showToast,
  displayLimit,
  setDisplayLimit,
  onOpenCapture,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSyncing, setIsSyncing] = useState(false);

  // Library State for LibraryView integration
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyRef = useRef(null);

  useEffect(() => {
    // Neural Hydration: Sync collections and stats for the embedded LibraryView
    const hydrate = async () => {
      if (!api) return;
      try {
        const list = await api.loadCollections();
        setCollections(
          (list || []).filter((c) => c && typeof c === "string" && c.trim()),
        );
      } catch (err) {
        console.error("[PROFILE] Collection Hydration Failure:", err);
      }
    };
    hydrate();
  }, [api]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "insights", label: "Archive", icon: FileText },
    { id: "library", label: "Library", icon: LibraryIcon },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const handleCollapse = () => {
    setDisplayLimit(6);
  };

  const [loadingMore, setLoadingMore] = useState(false);
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit((prev) => prev + 6);
      setLoadingMore(false);
    }, 600);
  };

  const handleLoadDraft = (item) => {
    setInitialForgeData(item);
    setActiveTab("profile");
  };

  const [isHistoryOpenState, setIsHistoryOpenState] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [initialForgeData, setInitialForgeData] = useState(null);

  const forensicNodes = vocab.filter(
    (v) => v.collection === "__neural_drafts__" && !v.archived,
  ).length;

  // Persistent Forge State
  const [forgeContent, setForgeContent] = useState("");
  const [forgeDiagnostics, setForgeDiagnostics] = useState({
    grammar: 100,
    academic: 0,
    index: 0,
    writing: 0,
    highlights: [],
    ielts: null,
    ieltsLabel: null,
  });
  const [isForgeAnalyzing, setIsForgeAnalyzing] = useState(false);

  const handleDeleteDraft = async (e, id) => {
    e.stopPropagation();
    try {
      if (api?.archiveVocabItem) {
        await api.archiveVocabItem(id);
        // Soft delete: update local state archived flag
        setVocab(vocab.map((v) => (v.id === id ? { ...v, archived: 1 } : v)));
        if (showToast) showToast("Draft Moved to Trash", "success");
      }
    } catch (err) {
      console.error("Draft archiving failure", err);
    }
  };

  return (
    <div className="h-full flex flex-row bg-background text-text overflow-hidden font-sans select-text">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TABS HEADER - SHARED */}
        <div className="h-10 px-3 border-b border-border bg-surface flex items-center justify-start gap-2 shrink-0 z-20">
          <div className="flex h-full items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "sync") {
                    handleSync();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 border-r border-border/10 group transition-all h-full relative ${activeTab === tab.id ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
              >
                <tab.icon
                  className={`h-2.5 w-2.5 ${activeTab === tab.id ? "text-accent" : "text-muted"} group-hover:text-accent transition-all ${tab.id === "sync" && isSyncing ? "animate-spin text-accent" : ""}`}
                />
                <span
                  className={`text-[9px] font-black tracking-tight leading-tight uppercase ${activeTab === tab.id ? "text-text" : "text-muted"} group-hover:text-text transition-all`}
                >
                  {tab.id === "profile" ? "Saboor" : tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profile-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "profile" ? (
              <motion.div
                key="profile-forge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 h-full"
              >
                <WritingView
                  api={api}
                  showToast={showToast}
                  initialData={initialForgeData}
                  content={forgeContent}
                  setContent={setForgeContent}
                  diagnostics={forgeDiagnostics}
                  setDiagnostics={setForgeDiagnostics}
                  isAnalyzing={isForgeAnalyzing}
                  setIsAnalyzing={setIsForgeAnalyzing}
                  onSaveDraft={(draft) => {
                    setVocab([draft, ...vocab]);
                  }}
                  onOpenCapture={onOpenCapture}
                />
              </motion.div>
            ) : (
              <motion.div
                key="other-tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden md:gap-3">
                  {/* Global Mobile Diagnostics - Anchored at the top */}
                  <div className="block md:hidden shrink-0">
                    <SystemStatus
                      forensicNodes={forensicNodes}
                      hideMetrics={activeTab !== "profile"}
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {activeTab === "trash" ? (
                      <LibraryTrash
                        api={api}
                        showToast={showToast}
                        onRestore={async (item) => {
                          if (api?.restoreVocabItem) {
                            await api.restoreVocabItem(item.id);
                            // Optimistically update the global vocab state
                            setVocab((prev) =>
                              prev.map((v) =>
                                v.id === item.id ? { ...v, archived: 0 } : v,
                              ),
                            );
                          }
                        }}
                        onDeletePermanent={async (id) => {
                          if (api?.deleteVocabItem) {
                            await api.deleteVocabItem(id);
                            // Remove from global vocab state
                            setVocab((prev) => prev.filter((v) => v.id !== id));
                          }
                        }}
                      />
                    ) : activeTab === "library" ? (
                      <LibraryView
                        vocab={vocab}
                        setVocab={setVocab}
                        collections={collections}
                        setCollections={setCollections}
                        selectedCollection={selectedCollection}
                        setSelectedCollection={setSelectedCollection}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        displayLimit={displayLimit}
                        setDisplayLimit={setDisplayLimit}
                        api={api}
                        showToast={showToast}
                        onExpand={onExpand}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchResults={searchResults}
                        setSearchResults={setSearchResults}
                        isSearching={isSearching}
                        setIsSearching={setIsSearching}
                        searchHistory={searchHistory}
                        setSearchHistory={setSearchHistory}
                        isHistoryOpen={isHistoryOpen}
                        setIsHistoryOpen={setIsHistoryOpen}
                        historyRef={historyRef}
                      />
                    ) : (
                      <div className="flex flex-col h-full bg-surface overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scroll">
                          <div className="p-1 w-full pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                              {vocab
                                .filter((v) => !v.archived)
                                .slice(0, displayLimit)
                                .map((item) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-auto min-h-[150px] flex flex-col transition-all duration-500 border rounded-[5px] overflow-hidden border-border/10 bg-surface-2/50 group hover:border-blue-500/20 transition-all cursor-pointer relative shadow-sm"
                                    onClick={() => handleLoadDraft(item)}
                                  >
                                    {/* Body: Content & Context */}
                                    <div className="p-3 flex-1 flex flex-col gap-2 min-w-0 pr-4">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-3 w-3 text-blue-400 shrink-0 opacity-40" />
                                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted truncate opacity-60">
                                          Neural Draft
                                        </span>
                                      </div>

                                      <div className="min-w-0 space-y-1">
                                        <h4 className="text-[12px] font-black text-text leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                                          {truncateWords(item.text, 15)}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                                            {new Date(
                                              item.date,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-[9px] text-muted leading-relaxed opacity-60 line-clamp-2">
                                          {item.definition ||
                                            "No additional context available for this forensic node."}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Beautiful Slim Footer */}
                                    <div className="px-3 py-1.5 bg-surface-3/30 border-t border-border/10 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[6px] font-black text-muted/30 uppercase tracking-[0.2em]">
                                          Diagnostic Node
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        {/* Beautiful Small Score Badge */}
                                        {(item.band ||
                                          item.metadata?.band ||
                                          item.diagnostics?.ielts) && (
                                          <span className="flex items-center gap-1 text-[8px] font-black text-accent bg-accent/5 px-1.5 py-0.5 border border-accent/10 uppercase tracking-widest rounded-[2px]">
                                            B
                                            {item.band ||
                                              item.metadata?.band ||
                                              item.diagnostics?.ielts}
                                          </span>
                                        )}

                                        <div className="flex items-center gap-1.5 border-l border-border/10 pl-3">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setItemToDelete(item.id);
                                            }}
                                            className="p-1 text-muted/20 hover:text-red-500 transition-all"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleLoadDraft(item);
                                            }}
                                            className="p-1 text-blue-400 hover:text-blue-300 transition-all"
                                          >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                            </div>

                            {/* Unified Stream Controls */}
                            <StreamControls
                              currentLimit={displayLimit}
                              totalItems={
                                vocab.filter((v) => !v.archived).length
                              }
                              onLoadMore={() =>
                                setDisplayLimit((prev) => prev + 6)
                              }
                              onCollapse={() => setDisplayLimit(6)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {itemToDelete && (
            <DeleteModal
              isOpen={!!itemToDelete}
              onClose={() => setItemToDelete(null)}
              onConfirm={async () => {
                if (itemToDelete) {
                  await handleDeleteDraft(
                    { stopPropagation: () => {} },
                    itemToDelete,
                  );
                  setItemToDelete(null);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* GLOBAL SIDEBAR - Anchored to Global Header */}
      <div
        id="writing-hub-portal"
        className="hidden md:block w-80 shrink-0 border-l border-border bg-surface overflow-y-auto custom-scroll"
      >
        {activeTab !== "profile" && (
          <SystemStatus forensicNodes={forensicNodes} hideMetrics />
        )}
      </div>
    </div>
  );
};

export default Profile;
