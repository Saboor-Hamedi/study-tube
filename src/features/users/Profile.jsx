import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Trash2,
  Archive,
  Library,
  FileText,
  Clock,
  Activity,
  Award,
  Zap,
  BookOpen,
  Plus,
} from "lucide-react";
import LibraryTrash from "./LibraryTrash";
import LibraryView from "../research-vault/LibraryView";
import DeleteModal from "../research-vault/DeleteModal";
import GrammarForensicView from "../grammar/GrammarForensicView";
import PulseLoader from "../research-vault/PulseLoader";
import SystemStatus from "./SystemStatus";

import { api as bridgeApi } from "../../utils/api-bridge";

export default function Profile({
  vocab = [],
  setVocab,
  onExpand,
  api: passedApi,
  showToast,
  displayLimit,
  setDisplayLimit,
  onOpenCapture,
}) {
  const api = passedApi || bridgeApi;
  const [activeTab, setActiveTab] = useState("profile");

  // Library State for LibraryView integration
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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

  const searchInputRef = useRef(null);
  const historyRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit((prev) => prev + 6);
      setLoadingMore(false);
    }, 600);
  };

  const handleCollapse = () => {
    setDisplayLimit(6);
  };

  const tabs = [
    { id: "profile", label: "Research Profile", icon: User },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "library", label: "Library", icon: Library },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const handleLoadDraft = (draft) => {
    setInitialForgeData(draft);
    setActiveTab("profile");
  };

  const handleDeleteDraft = async (e, id) => {
    e.stopPropagation();
    try {
      if (api.deleteVocabItem) {
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
      <div className="h-12 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0 z-20">
        <div className="flex gap-4 h-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 pr-6 border-r border-border/20 group transition-all h-full relative ${activeTab === tab.id ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            >
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${activeTab === tab.id ? "bg-accent border-accent shadow-[0_0_10px_rgba(255,107,0,0.2)]" : "bg-surface-3 border-border"}`}
              >
                <tab.icon
                  className={`h-2.5 w-2.5 ${activeTab === tab.id ? "text-white" : "text-muted"}`}
                />
              </div>
              <div className="flex flex-col items-start text-left">
                <span
                  className={`text-[12px] font-black tracking-tight leading-tight ${activeTab === tab.id ? "text-text" : "text-muted"}`}
                >
                  {tab.id === "profile" ? "Saboor" : tab.label}
                </span>
                <span className="text-[9px] font-bold text-muted/40 mt-0.5 uppercase tracking-tighter">
                  {tab.id === "profile" ? "Forensic Forge" : "Workspace"}
                </span>
              </div>
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
              className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-visible"
            >
              {/* On mobile, SystemStatus comes first in the column flow */}
              <div className="block md:hidden px-3 pt-3 shrink-0">
                <SystemStatus forensicNodes={forensicNodes} />
              </div>

              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="flex-1 relative md:overflow-y-auto scrollbar-thin">
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
                    <div className="p-3 md:p-5 space-y-2.5 overflow-y-auto custom-scroll">
                      {vocab.slice(0, displayLimit).map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-surface border border-border rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group hover:border-accent/40 transition-all cursor-pointer"
                          onClick={() => handleLoadDraft(item)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center border border-border shrink-0">
                              <FileText className="h-3 w-3 text-muted group-hover:text-accent transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[10px] font-black text-text truncate break-all">
                                {item.text?.split(/\s+/).slice(0, 10).join(" ")}
                                {item.text?.split(/\s+/).length > 10
                                  ? "..."
                                  : ""}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] text-muted font-bold uppercase tracking-widest shrink-0">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                                {(item.band ||
                                  item.metadata?.band ||
                                  item.diagnostics?.ielts ||
                                  item.metadata?.diagnostics?.ielts) && (
                                  <span className="flex items-center gap-1 text-[8px] font-black text-accent bg-accent/10 px-1 py-0.5 rounded uppercase tracking-widest shrink-0">
                                    <Award className="h-2 w-2" /> Band{" "}
                                    {item.band ||
                                      item.metadata?.band ||
                                      item.diagnostics?.ielts ||
                                      item.metadata?.diagnostics?.ielts}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:justify-end shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadDraft(item);
                              }}
                              className="flex-1 sm:flex-none h-6 px-2 bg-surface-3 border border-border/10 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all whitespace-nowrap"
                            >
                              Open
                            </button>
                            <button
                              onClick={(e) => handleDeleteDraft(e, item.id)}
                              className="p-1 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-[4px] transition-all"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Load More / Collapse System */}
                      <div className="mt-6 mb-4 flex flex-col items-center gap-4">
                        {loadingMore ? (
                          <PulseLoader message="Analyzing Archive..." />
                        ) : (
                          <div className="flex items-center gap-3">
                            {vocab.length > displayLimit && (
                              <button
                                onClick={handleLoadMore}
                                className="group h-8 px-4 flex items-center gap-1.5 bg-surface-2 border border-border/10 text-muted/60 hover:text-accent hover:border-accent/30 transition-all rounded-full"
                              >
                                <Plus className="h-2.5 w-2.5 group-hover:rotate-90 transition-transform duration-500" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                                  Load more
                                </span>
                              </button>
                            )}

                            {displayLimit > 6 && (
                              <button
                                onClick={handleCollapse}
                                className="h-8 px-4 flex items-center bg-transparent border border-transparent hover:border-red-500/20 text-muted/30 hover:text-red-400 transition-all rounded-full"
                              >
                                <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                                  Collapse
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* On desktop, SystemStatus is the right sidebar */}
              <div className="hidden md:block">
                <SystemStatus forensicNodes={forensicNodes} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <DeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => setItemToDelete(null)}
      />
    </div>
  );
}
