import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef } from "react";
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
} from "lucide-react";
import LibraryTrash from "./LibraryTrash";
import LibraryView from "../research-vault/LibraryView";
import DeleteModal from "../research-vault/DeleteModal";
import GrammarForensicView from "../grammar/GrammarForensicView";

export default function Profile({
  vocab = [],
  setVocab,
  onExpand,
  api = window.youtubeAPI,
  showToast,
  displayLimit,
  setDisplayLimit,
}) {
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
  
  const forensicNodes = vocab.filter(v => v.collection === "__neural_drafts__").length;
  
  // Persistent Forge State
  const [forgeContent, setForgeContent] = useState("");
  const [forgeDiagnostics, setForgeDiagnostics] = useState({
    grammar: 100, academic: 0, index: 0, writing: 0, highlights: [], ielts: null, ieltsLabel: null
  });
  const [isForgeAnalyzing, setIsForgeAnalyzing] = useState(false);

  const searchInputRef = useRef(null);
  const historyRef = useRef(null);

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
                <span className={`text-[12px] font-black tracking-tight leading-tight ${activeTab === tab.id ? "text-text" : "text-muted"}`}>
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
              />
            </motion.div>
          ) : (
            <motion.div
              key="other-tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              <div className="flex-1 flex flex-col bg-surface-2/30 border-r border-border overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  {activeTab === "trash" ? (
                    <LibraryTrash api={api} onRestore={() => {}} onDeletePermanent={() => {}} />
                  ) : activeTab === "library" ? (
                    <LibraryView
                      vocab={vocab} setVocab={setVocab}
                      collections={collections} setCollections={setCollections}
                      selectedCollection={selectedCollection} setSelectedCollection={setSelectedCollection}
                      sortBy={sortBy} setSortBy={setSortBy}
                      displayLimit={displayLimit} setDisplayLimit={setDisplayLimit}
                      api={api} showToast={showToast}
                      onExpand={onExpand}
                      searchInputRef={searchInputRef}
                      searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                      searchResults={searchResults} setSearchResults={setSearchResults}
                      isSearching={isSearching} setIsSearching={setIsSearching}
                      searchHistory={searchHistory} setSearchHistory={setSearchHistory}
                      isHistoryOpen={isHistoryOpen} setIsHistoryOpen={setIsHistoryOpen}
                      historyRef={historyRef}
                    />
                  ) : (
                    <div className="p-8 space-y-4 overflow-y-auto custom-scroll">
                      {vocab
                        .filter((item) => item.collection === "__neural_drafts__")
                        .map((item) => (
                          <div
                            key={item.id}
                            className="p-4 bg-surface border border-border rounded-[12px] flex items-center justify-between group hover:border-accent/40 transition-all cursor-pointer"
                            onClick={() => handleLoadDraft(item)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center border border-border">
                                <FileText className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                              </div>
                              <div>
                              <h4 className="text-[12px] font-black text-text">{item.text}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] text-muted font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                                {(item.band || item.diagnostics?.ielts) && (
                                  <span className="flex items-center gap-1 text-[9px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                    <Award className="h-2.5 w-2.5" /> Band {item.band || item.diagnostics?.ielts}
                                  </span>
                                )}
                              </div>
                            </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleLoadDraft(item); }}
                                className="h-8 px-4 bg-surface-3 border border-border/10 rounded-[6px] text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                              >
                                Open
                              </button>
                              <button
                                onClick={(e) => handleDeleteDraft(e, item.id)}
                                className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN - Stats (Only for non-forge tabs) */}
              <div className="w-[380px] shrink-0 bg-surface flex flex-col border-l border-border">
                <div className="h-12 px-6 border-b border-border flex items-center bg-surface-3/30 shrink-0">
                  <Activity className="h-4 w-4 text-accent mr-3" />
                  <h2 className="text-[12px] font-black tracking-tight uppercase">System Status</h2>
                </div>
                <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scroll">
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Linguistic Mastery</h3>
                    <div className="space-y-6">
                      {[
                        { label: "Academic Depth", value: 88, color: "bg-blue-500" },
                        { label: "Vocabulary Density", value: 74, color: "bg-emerald-500" },
                        { label: "Syntactic Rigor", value: 92, color: "bg-accent" },
                      ].map(bar => (
                        <div key={bar.label} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-text/70">{bar.label}</span>
                            <span className="text-text tabular-nums">{bar.value}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${bar.value}%` }} 
                              className={`h-full ${bar.color} rounded-full`} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-accent/5 border border-accent/10 rounded-[16px] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent text-white rounded-[8px]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[11px] font-black text-text uppercase">Research Quota</h4>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Weekly Achievement</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[32px] font-black text-accent tracking-tighter">{forensicNodes}/20</span>
                        <span className="text-[10px] font-black text-muted uppercase">Nodes</span>
                    </div>
                    <div className="h-1 w-full bg-accent/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (forensicNodes / 20) * 100)}%` }}
                          className="h-full bg-accent rounded-full" 
                        />
                    </div>
                  </div>
                </div>
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
