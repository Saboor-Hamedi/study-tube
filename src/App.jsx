import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { FileText } from "lucide-react";
import Activitybar from "./components/Activitybar";
import VideoView from "./features/video-intel/VideoView";
import LibraryView from "./features/research-vault/LibraryView";
import CopilotView from "./features/neural-chat/CopilotView";
import SettingsView from "./features/settings/SettingsView";
import Profile from "./features/users/Profile";
import EditorView from "./features/editor/EditorView";
import InsightDetailView from "./features/research-vault/InsightDetailView";
import Header from "./components/Header";
import InsightCaptureModal from "./features/research-vault/InsightCaptureModal";
import GlobalNeuralMenu from "./features/neural-chat/GlobalNeuralMenu";
import { motion, AnimatePresence } from "framer-motion";
import Notification from "./components/Notification";
import { useStore } from "./store/useStore";
import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import GrammarView from "./features/grammar/GrammarView";

export default function App() {
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [activeDragItem, setActiveDragItem] = useState(null);

  const [grammars, setGrammars] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const {
    vocabStats,
    setVocabStats,
    savePath,
    setSavePath,
    view,
    setView,
    selectedResearchNode,
    setSelectedResearchNode,
    vocab,
    setVocab,
    collections,
    setCollections,
    selectedCollection,
    setSelectedCollection,
    chatHistory,
    setChatHistory,
    sortBy,
    setSortBy,
    displayLimit,
    setDisplayLimit,
    isCopilotOpen,
    setIsCopilotOpen,
    isCopilotCollapsed,
    setIsCopilotCollapsed,
    isCaptureOpen,
    setIsCaptureOpen,
    copilotContext,
    setCopilotContext,
    videoQuery,
    setVideoQuery,
    videoResults,
    setVideoResults,
    videoPreview,
    setVideoPreview,
    videoTranscript,
    setVideoTranscript,
    loadingTranscript,
    setLoadingTranscript,
    toast,
    setToast,
    theme,
    setTheme,
    libQuery,
    setLibQuery,
    libResults,
    setLibResults,
    isLibSearching,
    setIsLibSearching,
    libHistory,
    setLibHistory,
    isLibHistoryOpen,
    setIsLibHistoryOpen,
    libSelectedIndex,
    setLibSelectedIndex,
    isVideoBusy,
    setIsVideoBusy,
    showToast,
  } = useStore();

  const searchInputRef = useRef(null);
  const libHistoryRef = useRef(null);
  const api = window.youtubeAPI;

  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailSaveTrigger, setDetailSaveTrigger] = useState(0);

  const syncHistory = useCallback(async () => {
    if (!api) return;
    try {
      const log = await api.getSearchLog();
      setLibHistory(log || []);
    } catch (err) {
      console.error("History Sync Failure", err);
    }
  }, [api]);

  const syncStats = useCallback(async () => {
    if (!api) return;
    try {
      const stats = await api.getLibraryStats();
      setVocabStats(stats);
    } catch (err) {
      console.error("Failed to sync neural density", err);
    }
  }, [api]);

  const updateStatsOptimistically = useCallback(
    (oldCollection, newCollection) => {
      setVocabStats((prev) => {
        if (!prev)
          return { total: 1, collections: [{ name: newCollection, count: 1 }] };

        let collections = [...(prev.collections || [])];

        // Update Old
        if (oldCollection) {
          collections = collections.map((c) =>
            c.name === oldCollection
              ? { ...c, count: Math.max(0, c.count - 1) }
              : c,
          );
        }

        // Update New
        const exists = collections.find((c) => c.name === newCollection);
        if (exists) {
          collections = collections.map((c) =>
            c.name === newCollection ? { ...c, count: c.count + 1 } : c,
          );
        } else if (newCollection) {
          collections.push({ name: newCollection, count: 1 });
        }

        return { ...prev, collections };
      });
    },
    [],
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveDragItem(null);

      if (!over) return;

      if (active.data.current?.type === "chat-message") {
        const item = active.data.current;
        const targetCollection =
          over.id === "unorganized" ? null : over.id === "all" ? null : over.id;

        try {
          const cleanText = item.content.replace(/[#*`~_\[\]()]/g, "").trim();
          const firstSentence =
            cleanText.split(/[.!?\n]/).filter((s) => s.trim().length > 0)[0] ||
            "Neural Insight";
          const finalTitle =
            firstSentence.length > 50
              ? firstSentence.slice(0, 50) + "..."
              : firstSentence;

          const newEntry = {
            id: new Date().toISOString(),
            text: finalTitle,
            definition: item.content,
            collection: targetCollection || "",
            date: new Date().toISOString(),
            videoTitle: "AI Research Insight",
            loading: false,
          };

          await api.saveVocabItem(newEntry);
          updateStatsOptimistically(null, targetCollection);
          setVocab((prev) => [newEntry, ...prev]);
          showToast(
            `Insight archived to ${targetCollection || "Root"}`,
            "success",
          );
        } catch (err) {
          showToast("Capture failed", "error");
        }
        return;
      }

      if (active.data.current?.date) {
        const item = active.data.current;
        const itemId = item.id || item.date;
        const targetCollection =
          over.id === "unorganized" ? null : over.id === "all" ? null : over.id;

        if (item.collection === targetCollection) return;

        try {
          const updated = { ...item, collection: targetCollection };
          await api.saveVocabItem(updated);
          updateStatsOptimistically(item.collection, targetCollection);
          setVocab((prev) =>
            prev.map((v) => ((v.id || v.date) === itemId ? updated : v)),
          );
          showToast(
            `Insight migrated to ${over.id === "unorganized" ? "Unorganized" : over.id === "all" ? "Root" : over.id}`,
            "success",
          );
          syncStats();
        } catch (err) {
          console.error("Failed to persist drag-migration", err);
          showToast("Neural Archiving Failed", "error");
        }
      }
    },
    [api, setVocab, showToast, syncStats],
  );

  const commitToHistory = async (q) => {
    const query = q?.trim();
    if (!query) return;
    try {
      await api.addSearchLog(query);
      await syncHistory();
    } catch (err) {
      console.error("Archival Persistence Error", err);
    }
  };
  // Grammar
  useEffect(() => {
    const initGrammars = async () => {
      try {
        const data = await api.checkGrammar();
        console.log("Grammars loaded:", data);
        setGrammars(data);
      } catch (err) {
        console.error("Failed to load grammars", err);
      }
    };

    if (api) initGrammars();
  }, [api]);
  const removeFromHistory = async (q) => {
    try {
      await api.deleteSearchLog(q);
      await syncHistory();
    } catch (err) {
      console.error("History Eradication Failure", err);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Erase all search discovery logs?")) return;
    try {
      await api.clearSearchLog();
      setLibHistory([]);
      setIsLibHistoryOpen(false);
    } catch (err) {
      console.error("Chronology Purge Failure", err);
    }
  };

  useEffect(() => {
    if (!api) return;

    // Initial Hydration
    if (api.getTheme)
      api
        .getTheme()
        .then(setTheme)
        .catch(() => {});
    api
      .loadVocab()
      .then((list) => setVocab(list || []))
      .catch(() => {});
    api
      .loadCollections()
      .then((list) =>
        setCollections(
          (list || []).filter((c) => c && typeof c === "string" && c.trim()),
        ),
      )
      .catch(() => {});

    syncStats();
    syncHistory();

    const pulse = setInterval(syncStats, 30000);
    return () => clearInterval(pulse);
  }, [api, syncStats, syncHistory]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    api.setTheme(next);
  };

  // Neural Transition Guard: Prevents sidebar-to-overlay jump scares during navigation
  useEffect(() => {
    if (view === "vocab" || view === "search" || view === "settings") {
      setIsCopilotOpen(false);
      setCopilotContext(null);
    }
  }, [view, setIsCopilotOpen, setCopilotContext]);

  const addVocab = async (item) => {
    const basicItem = {
      ...item,
      id: new Date().toISOString(),
      date: item.date || new Date().toISOString(),
      loading: !item.skipAI && !item.definition,
    };

    // Initial Save Bridge
    await api.saveVocabItem(basicItem);
    syncStats();
    setVocab((prev) => [basicItem, ...prev]);
    showToast(
      `Saved "${item.text.length > 30 ? item.text.slice(0, 30) + "..." : item.text}"`,
    );

    // If we have a manual definition or skipAI is locked, we exit early
    if (item.skipAI || item.definition) return;

    // Background Neural Enrichment
    try {
      const entry = await api.explainWord({
        text: item.text,
        videoTitle: item.videoTitle,
      });
      const enriched = { ...basicItem, ...entry, loading: false };
      await api.saveVocabItem(enriched);
      syncStats();
      setVocab((prev) =>
        prev.map((v) => (v.id === basicItem.id ? enriched : v)),
      );
    } catch (e) {
      console.error("AI Enrichment failed", e);
    }
  };

  const handleOpenCopilot = useCallback(
    (ctx) => {
      setCopilotContext(ctx);
      setIsCopilotOpen(true);
    },
    [setCopilotContext, setIsCopilotOpen],
  );

  const handleCloseCopilot = useCallback(() => {
    setIsCopilotOpen(false);
    setCopilotContext(null);
  }, [setIsCopilotOpen, setCopilotContext]);

  const handleGlobalExport = async () => {
    if (vocab.length === 0) return;
    try {
      const result = await api.exportDossier({
        name: "Full_Research_Archive",
        items: vocab,
      });
      if (result.success) {
        showToast(
          `Full Dossier Exported: ${result.filePath.split(/[\\\/]/).pop()}`,
          "success",
        );
      }
    } catch (err) {
      showToast("Global Export Protocol Failed", "error");
    }
  };

  const videoProps = {
    savePath,
    setSavePath,
    onAddVocab: addVocab,
    query: videoQuery,
    setQuery: setVideoQuery,
    results: videoResults,
    setResults: setVideoResults,
    preview: videoPreview,
    setPreview: setVideoPreview,
    transcript: videoTranscript,
    setTranscript: setVideoTranscript,
    loadingTranscript,
    setLoadingTranscript,
    showToast,
    searchInputRef,
    busy: isVideoBusy,
    setBusy: setIsVideoBusy,
  };

  const libraryProps = {
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
    stats: vocabStats,
    onUpdateStats: updateStatsOptimistically,
    searchQuery: libQuery,
    setSearchQuery: setLibQuery,
    searchResults: libResults,
    setSearchResults: setLibResults,
    isSearching: isLibSearching,
    setIsSearching: setIsLibSearching,
    searchHistory: libHistory,
    setSearchHistory: setLibHistory,
    isHistoryOpen: isLibHistoryOpen,
    setIsHistoryOpen: setIsLibHistoryOpen,
    searchInputRef,
    historyRef: libHistoryRef,
    onExpand: (item) => {
      setSelectedResearchNode(item);
      setView("research-detail");
    },
  };

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans transition-colors duration-500 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex w-full h-full flex-row">
        {/* <Activitybar
          view={view}
          setView={setView}
          onExport={handleGlobalExport}
          theme={theme}
          onToggleTheme={toggleTheme}
          stats={vocabStats}
          onOpenGrammar={() => setView("grammar")}
        /> */}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header
            view={view}
            setView={setView}
            item={selectedResearchNode}
            theme={theme}
            onToggleTheme={toggleTheme}
            videoSearch={
              view === "search"
                ? {
                    ...videoProps,
                    onSearch: () =>
                      window.dispatchEvent(
                        new CustomEvent("video-search-trigger"),
                      ),
                  }
                : null
            }
            librarySearch={
              view === "vocab" ||
              view === "research-detail" ||
              view === "editor" ||
              view === "grammar"
                ? {
                    ...libraryProps,
                    query: libQuery,
                    setQuery: setLibQuery,
                    history: libHistory,
                    results: libResults,
                    isSearching: isLibSearching,
                    onSelect: (item) => {
                      setSelectedResearchNode(item);
                      setView("research-detail");
                      commitToHistory(item.text);
                      setIsLibHistoryOpen(false);
                      setLibSelectedIndex(-1);
                    },
                    syncHistory,
                    removeFromHistory,
                    clearHistory,
                    selectedIndex: libSelectedIndex,
                    setSelectedIndex: setLibSelectedIndex,
                  }
                : null
            }
          />

          <div className="flex-1 flex flex-row overflow-hidden relative">
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={(e) => setActiveDragItem(e.active.data.current)}
              onDragEnd={handleDragEnd}
            >
              <Sidebar
                view={view}
                setView={setView}
                collections={collections}
                selectedCollection={selectedCollection}
                setSelectedCollection={setSelectedCollection}
                handleDeleteCollection={async (name) => {
                  await api.disbandCollection(name);
                  setCollections(collections.filter((c) => c !== name));
                  if (selectedCollection === name)
                    setSelectedCollection("all");
                  syncStats();
                }}
                handleRenameCollection={async (old, next) => {
                  await api.migrateCollection(old, next);
                  setCollections(
                    collections.map((c) => (c === old ? next : c)),
                  );
                  if (selectedCollection === old) setSelectedCollection(next);
                  syncStats();
                }}
                handleCreateCollection={async (name) => {
                  if (!name.trim()) return;
                  const next = [...collections, name.trim()];
                  await api.saveCollections(next);
                  setCollections(next);
                  setIsCreatingCollection(false);
                  setNewCollectionName("");
                  syncStats();
                }}
                isCreatingCollection={isCreatingCollection}
                setIsCreatingCollection={setIsCreatingCollection}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
                stats={vocabStats}
                sortBy={sortBy}
                setSortBy={setSortBy}
                side="left"
                showTrash={true}
                onExport={handleGlobalExport}
                theme={theme}
                onToggleTheme={toggleTheme}
              />

              <main className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {view === "search" && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <VideoView {...videoProps} />
                    </motion.div>
                  )}
                  {view === "vocab" && (
                    <motion.div
                      key="vocab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 overflow-y-auto scrollbar-thin"
                    >
                      <LibraryView
                        {...libraryProps}
                        activeDragItem={activeDragItem}
                        onExpand={(item) => {
                          setSelectedResearchNode(item);
                          setView("research-detail");
                        }}
                      />
                    </motion.div>
                  )}
                  {view === "research-detail" && (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-row overflow-hidden bg-background"
                    >
                      <div className="flex-1 overflow-hidden">
                        <InsightDetailView
                          item={selectedResearchNode}
                          setView={setView}
                          showToast={showToast}
                          api={api}
                          onClose={() => {
                            setView("vocab");
                            setIsCopilotCollapsed(true);
                          }}
                          onOpenCopilot={handleOpenCopilot}
                          collections={collections}
                          selectedCollection={selectedCollection}
                          setSelectedCollection={setSelectedCollection}
                          isCopilotOpen={isCopilotOpen}
                          isCopilotCollapsed={isCopilotCollapsed}
                          onOpenCapture={() => setIsCaptureOpen(true)}
                          isEditing={isEditingDetail}
                          setIsEditing={setIsEditingDetail}
                          saveTrigger={detailSaveTrigger}
                          onUpdate={async (updated) => {
                            await api.saveVocabItem(updated);
                            setSelectedResearchNode(updated);
                            syncStats();
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                  {view === "editor" && (
                    <motion.div
                      key="editor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-row overflow-hidden"
                    >
                      <div className="flex-1 overflow-hidden">
                        <EditorView
                          api={api}
                          showToast={showToast}
                          onOpenCopilot={handleOpenCopilot}
                        />
                      </div>
                    </motion.div>
                  )}
                  {view === "settings" && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 overflow-y-auto"
                    >
                      <SettingsView
                        api={api}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                        onExport={handleGlobalExport}
                        showToast={showToast}
                        onClose={() => setView("search")}
                      />
                    </motion.div>
                  )}
                  {view === "profile" && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <Profile {...libraryProps} />
                    </motion.div>
                  )}
                  {view === "grammar" && (
                    <motion.div
                      key="grammar"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 overflow-y-auto"
                    >
                      <GrammarView grammars={grammars} setView={setView} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>

              {/* UNIFIED GLOBAL COPILOT SIDEBAR */}
              <CopilotView
                isOpen={isCopilotOpen && view !== "grammar"}
                onClose={handleCloseCopilot}
                onOpen={() => handleOpenCopilot(null)}
                api={api}
                showToast={showToast}
                sidebarMode={view !== "search" && view !== "settings"}
              />

              <DragOverlay
                dropAnimation={null}
                zIndex={500}
                modifiers={[snapCenterToCursor]}
              >
                {activeDragItem ? (
                  <div className="w-[160px] bg-surface-2 border border-accent p-1.5 shadow-2xl opacity-90 scale-90 pointer-events-none rounded-[5px]">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-accent/10 border border-accent/20 rounded-[3px]">
                        <FileText className="h-3 w-3 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[9px] font-black text-text uppercase tracking-widest truncate">
                          {activeDragItem.text || "Archiving Insight..."}
                        </h4>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      <InsightCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onInsert={addVocab}
        showToast={showToast}
        api={api}
      />

      {view !== "settings" && view !== "grammar" && (
        <GlobalNeuralMenu
          onOpenCapture={() => setIsCaptureOpen(true)}
          onOpenCopilot={() => {
            setCopilotContext(null);
            setIsCopilotOpen(true);
          }}
          stats={vocabStats}
          isCopilotOpen={isCopilotOpen}
          isCaptureOpen={isCaptureOpen}
          isCollapsed={isCopilotCollapsed}
          view={view}
          // Card Actions
          isEditing={isEditingDetail}
          onEdit={
            view === "research-detail" ? () => setIsEditingDetail(true) : null
          }
          onSave={
            view === "research-detail"
              ? () => setDetailSaveTrigger((t) => t + 1)
              : null
          }
          onClose={view === "research-detail" ? () => setView("vocab") : null}
        />
      )}

      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
