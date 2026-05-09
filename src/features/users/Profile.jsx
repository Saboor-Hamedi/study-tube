import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Trash2,
  Archive as ArchiveIcon,
  Library as LibraryIcon,
  FileText,
  Clock,
  Activity,
  Award,
  Zap,
  BookOpen,
  Plus,
  RefreshCcw,
} from "lucide-react";
import LibraryTrash from "./LibraryTrash";
import LibraryView from "../research-vault/LibraryView";
import DeleteModal from "../research-vault/DeleteModal";
import GrammarForensicView from "../grammar/GrammarForensicView";
import PulseLoader from "../research-vault/PulseLoader";
import SystemStatus from "./SystemStatus";

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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "insights", label: "Archive", icon: FileText },
    { id: "library", label: "Library", icon: LibraryIcon },
    { id: "sync", label: "Sync", icon: RefreshCcw },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const handleSync = async () => {
    if (api?.pullFromCloud && !isSyncing) {
      setIsSyncing(true);
      try {
        const result = await api.pullFromCloud();
        if (result?.success) {
          const updated = await api.loadVocab();
          setVocab(updated || []);
          if (showToast)
            showToast(
              `Writella Cloud Synchronized: ${result.count || 0} items`,
              "success",
            );
        } else {
          if (showToast) showToast("Cloud Connection Refused", "error");
        }
      } catch (err) {
        if (showToast) showToast("Sync Failure", "error");
      } finally {
        setIsSyncing(false);
      }
    }
  };

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
    (v) => v.collection === "__neural_drafts__",
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
      if (api?.deleteVocabItem) {
        await api.deleteVocabItem(id);
        setVocab(vocab.filter((v) => v.id !== id));
        if (showToast) showToast("Draft Eradicated", "success");
      }
    } catch (err) {
      console.error("Draft deletion failure", err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      {/* TABS HEADER - SHARED */}
      <div className="h-10 px-3 border-b border-border bg-surface flex items-center justify-start gap-4 shrink-0 z-20">
        <div className="flex h-full">
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
                {tab.id === "profile" ? "Saboor" : tab.id === "sync" && isSyncing ? "Syncing..." : tab.label}
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
              <GrammarForensicView
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
              className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden"
            >
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Global Mobile Diagnostics - Anchored at the top */}
                  <div className="block md:hidden px-3 pt-3 shrink-0">
                    <SystemStatus forensicNodes={forensicNodes} />
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {activeTab === "trash" ? (
                      <LibraryTrash api={api} showToast={showToast} />
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
                      <div className="flex flex-col h-full min-h-0 overflow-hidden">
                        {/* Standardized Insights Header - Full Width */}
                        <div className="hidden md:flex h-12 px-4 border-b border-border bg-surface-3/30 items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-accent" />
                            <div className="flex items-center gap-2">
                              <h2 className="text-[12px] font-black tracking-tight uppercase">
                                Archive
                              </h2>
                              <span className="text-[8px] text-muted/40 font-bold uppercase">
                                / Diagnostic Archive Flow
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scroll">
                          <div className="px-3 md:p-8 space-y-3 max-w-5xl mx-auto w-full pt-4 md:pt-8 pb-20">
                            {vocab.slice(0, displayLimit).map((item) => (
                              <div
                                key={item.id}
                                className="p-3 sm:p-4 bg-surface border border-border rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-accent/40 transition-all cursor-pointer shadow-sm"
                                onClick={() => handleLoadDraft(item)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-[8px] bg-surface-2 flex items-center justify-center border border-border shrink-0">
                                    <FileText className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-[13px] font-bold text-text truncate break-all group-hover:text-accent transition-colors">
                                      {item.text?.split(/\s+/).slice(0, 10).join(" ")}
                                      {item.text?.split(/\s+/).length > 10 ? "..." : ""}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[9px] text-muted font-bold uppercase tracking-widest shrink-0 opacity-40">
                                        {new Date(item.date).toLocaleDateString()}
                                      </span>
                                      {(item.band || item.metadata?.band || item.diagnostics?.ielts || item.metadata?.diagnostics?.ielts) && (
                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10 uppercase tracking-widest shrink-0">
                                          <Award className="h-2.5 w-2.5" /> Band{" "}
                                          {item.band || item.metadata?.band || item.diagnostics?.ielts || item.metadata?.diagnostics?.ielts}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 sm:justify-end shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLoadDraft(item);
                                    }}
                                    className="h-6 px-3 bg-surface-3 border border-border/10 text-muted text-[8px] font-black uppercase tracking-widest rounded-[4px] hover:bg-accent hover:text-white transition-all"
                                  >
                                    Open
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete(item.id);
                                    }}
                                    className="p-1.5 text-muted/30 hover:text-red-500 hover:bg-red-500/5 rounded-[4px] transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Load More System */}
                            <div className="mt-8 flex flex-col items-center gap-4">
                              {loadingMore ? (
                                <PulseLoader message="Analyzing Archive..." />
                              ) : (
                                <div className="flex items-center gap-3">
                                  {vocab.length > displayLimit && (
                                    <button
                                      onClick={handleLoadMore}
                                      className="h-8 px-5 flex items-center gap-2 bg-surface-2 border border-border/10 text-muted/60 hover:text-accent hover:border-accent/30 transition-all rounded-[5px] shadow-sm"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                                        Load more
                                      </span>
                                    </button>
                                  )}
                                  {displayLimit > 6 && (
                                    <button
                                      onClick={handleCollapse}
                                      className="h-8 px-5 flex items-center bg-transparent border border-transparent hover:border-red-500/20 text-muted/30 hover:text-red-400 transition-all rounded-[5px]"
                                    >
                                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                                        Contract
                                      </span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnostics Sidebar (Desktop Only) */}
              <div className="hidden md:block w-80 shrink-0 border-l border-border/10 overflow-y-auto custom-scroll">
                <SystemStatus forensicNodes={forensicNodes} />
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
                await handleDeleteDraft({ stopPropagation: () => {} }, itemToDelete);
                setItemToDelete(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
