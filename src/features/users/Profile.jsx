import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  MessageSquare,
  FileText,
  ChevronRight,
  Sparkles,
  Brain,
  Clock,
  CheckCircle,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Book,
  Activity,
  Layout,
  Trash2,
  Pencil,
  AlertCircle,
  ClipboardCheck,
  Zap,
  Info,
  Type,
  Maximize2,
  Archive,
  Library,
} from "lucide-react";
import PulseLoader from "../research-vault/PulseLoader";
import LibraryTrash from "./LibraryTrash";
import LibraryView from "../research-vault/LibraryView";
import DeleteModal from "../research-vault/DeleteModal";
import { useRigor } from "../../hooks/useRigor";

export default function Profile({
  vocab = [],
  setVocab,
  onExpand,
  api = window.youtubeAPI,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const [forgeContent, setForgeContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { analyze, isNeuralScanning, getCategoryColor, getCategoryBg } =
    useRigor();
  const [displayLimit, setDisplayLimit] = useState(6);
  const [isAppending, setIsAppending] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Library State for LibraryView integration
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [stats, setStats] = useState({
    all: vocab.length,
    trash: 0,
    collections: [],
  });

  const searchInputRef = useRef(null);
  const historyRef = useRef(null);

  const [diagnostics, setDiagnostics] = useState({
    grammar: 100,
    spelling: 0,
    diction: 0,
    tone: 0,
    academic: 0,
    index: 0,
    writing: 0,
    highlights: [],
    marketTrends: [
      "Linguistic Precision Up",
      "Academic Synthesis Demand",
      "Neural Drafting Trends",
      "Peer Review Latency",
    ],
  });

  const [essays, setEssays] = useState([]);

  const tabs = [
    { id: "profile", label: "Research Profile", icon: User },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "library", label: "Library", icon: Library },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  // AI ANALYSIS ENGINE (Industrial Forensic Pipeline)
  const handleSaveDraft = async () => {
    if (!forgeContent.trim()) return;

    const draftId = Date.now().toString();
    const newDraft = {
      id: draftId,
      text: forgeContent.split("\n")[0].substring(0, 40) + "...",
      definition: forgeContent,
      collection: "__neural_drafts__",
      date: new Date().toISOString(),
      student: "Me (Neural Draft)",
      status: "Saved",
      band: diagnostics.ielts || "N/A",
      diagnostics: { ...diagnostics },
    };

    try {
      if (api.saveVocabItem) {
        await api.saveVocabItem(newDraft);
        setVocab([newDraft, ...vocab]);
        if (showToast)
          showToast("Neural Draft Archived to Database", "success");
      }
    } catch (err) {
      console.error("Draft persistence failure", err);
      if (showToast) showToast("Persistence Failed", "error");
    }
  };

  const handleDeleteDraft = async (e, id) => {
    e.stopPropagation();
    try {
      if (api.deleteVocabItem) {
        await api.deleteVocabItem(id);
        setVocab(vocab.filter((v) => v.id !== id));
        if (showToast) showToast("Draft Eradicated from Database", "success");
      }
    } catch (err) {
      console.error("Draft deletion failure", err);
    }
  };

  const handleLoadDraft = (draft) => {
    setForgeContent(draft.definition || draft.content || "");
    if (draft.diagnostics) setDiagnostics(draft.diagnostics);
    setActiveTab("profile");
    // Auto-analyze on load
    handleDeepAnalyze();
  };
  const handleDeepAnalyze = async () => {
    const results = await analyze(forgeContent);
    if (results) {
      setDiagnostics(results.diagnostics);
      setIsAnalyzing(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col bg-surface-2/30 border-r border-border overflow-hidden">
          {/* TABS HEADER */}
          <div className="h-12 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[12px] font-black tracking-tight leading-tight ${activeTab === tab.id ? "text-text" : "text-muted"}`}
                        >
                          {tab.id === "profile" ? "Saboor" : tab.label}
                        </span>
                        {activeTab === tab.id && (
                          <span className="text-[9px] font-black text-muted/30 border-l border-border/20 pl-2">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {tab.id === "profile" && (
                        <span className="text-[9px] font-black text-accent bg-accent/10 px-1 py-0.5 rounded-[3px] mt-0.5 tracking-tight">
                          Neural Analyst
                        </span>
                      )}
                      {tab.id !== "profile" && (
                        <span className="text-[9px] font-bold text-muted/40 mt-0.5">
                          Workspace
                        </span>
                      )}
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

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === "profile" ? (
                <motion.div
                  key="forge"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto custom-scroll p-12">
                    {isAnalyzing ? (
                      <div className="space-y-8 max-w-5xl mx-auto">
                        <div className="text-[18px] text-text/90 leading-[2.2] font-light tracking-wide whitespace-pre-wrap font-outfit select-text">
                          {(() => {
                            let lastIndex = 0;
                            const elements = [];
                            const sorted = [...diagnostics.highlights].sort(
                              (a, b) => a.start - b.start,
                            );
                            sorted.forEach((hl, i) => {
                              elements.push(
                                forgeContent.substring(lastIndex, hl.start),
                              );
                              elements.push(
                                <span
                                  key={i}
                                  className={`relative inline-block px-1 rounded-[4px] mx-0.5 ${getCategoryBg(hl.type)}`}
                                >
                                  <span
                                    onClick={() => {
                                      const el = document.getElementById(
                                        `anomaly-${i + 1}`,
                                      );
                                      if (el)
                                        el.scrollIntoView({
                                          behavior: "smooth",
                                          block: "center",
                                        });
                                    }}
                                    className={`absolute -top-3 -right-2 w-4 h-4 rounded-full ${getCategoryColor(hl.type)} text-white text-[8px] font-black flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform z-10`}
                                    title={`${hl.reason} (ID: ${i + 1})`}
                                  >
                                    {i + 1}
                                  </span>
                                  <span
                                    className={`font-bold ${getCategoryColor(hl.type).replace("bg-", "text-")}`}
                                  >
                                    {forgeContent.substring(hl.start, hl.end)}
                                  </span>
                                </span>,
                              );
                              lastIndex = hl.end;
                            });
                            elements.push(forgeContent.substring(lastIndex));
                            return elements;
                          })()}
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={forgeContent}
                        onChange={(e) => setForgeContent(e.target.value)}
                        className="w-full h-full bg-transparent border-none text-[16px] text-text/90 leading-[1.8] font-light tracking-wide outline-none resize-none caret-accent selection:bg-accent/20 font-outfit"
                        placeholder="Initialize academic drafting pipeline..."
                        autoFocus
                      />
                    )}
                  </div>

                  {/* SYNCED FOOTER (STATS ON LEFT, BUTTONS ON RIGHT) */}
                  <div className="px-6 py-4 border-t border-border/10 bg-surface-2/50 shrink-0 h-[86px] flex items-center">
                    <div className="grid grid-cols-4 gap-3 w-full">
                      {[
                        {
                          label: "Grammar",
                          score: diagnostics.grammar,
                          icon: CheckCircle,
                          color: "text-blue-500",
                          bg: "bg-blue-500/5",
                          border: "border-blue-500/10",
                        },
                        {
                          label: "Academic",
                          score: diagnostics.academic,
                          icon: GraduationCap,
                          color: "text-purple-500",
                          bg: "bg-purple-500/5",
                          border: "border-purple-500/10",
                        },
                        {
                          label: "Index",
                          score: diagnostics.index,
                          icon: Activity,
                          color: "text-green-500",
                          bg: "bg-green-500/5",
                          border: "border-green-500/10",
                        },
                        {
                          label: "Writing",
                          score: diagnostics.writing,
                          icon: Zap,
                          color: "text-accent",
                          bg: "bg-accent/5",
                          border: "border-accent/10",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className={`px-3 py-2.5 rounded-[10px] border ${stat.bg} ${stat.border} flex items-center justify-between transition-all hover:scale-[1.02] cursor-default shadow-sm`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-[4px] ${stat.bg.replace("/5", "/20")}`}>
                              <stat.icon className={`h-3 w-3 ${stat.color}`} />
                            </div>
                            <span className="text-[8px] font-black text-muted uppercase tracking-widest">
                              {stat.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-0.5">
                            <span className={`text-[15px] font-black leading-none ${stat.color}`}>
                              {stat.score}
                            </span>
                            <span className="text-[8px] font-bold text-muted/40">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "trash" ? (
                <LibraryTrash
                  api={api}
                  onRestore={() => {}}
                  onDeletePermanent={() => {}}
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
                  showToast={(msg) => console.log(msg)}
                  stats={stats}
                  onExpand={onExpand}
                  searchInputRef={searchInputRef}
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
                <div className="p-6 space-y-4 overflow-y-auto custom-scroll">
                  {vocab
                    .filter((item) => item.collection === "__neural_drafts__")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-surface border border-border rounded-[8px] flex items-center justify-between group hover:border-accent/40 transition-all cursor-pointer"
                        onClick={() => handleLoadDraft(item)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center border border-border">
                            <FileText className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                          </div>
                          <div>
                            <h4 className="text-[12px] font-black text-text">
                              {item.text}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-muted font-bold uppercase tracking-widest">
                                {item.student || "Neural Draft"}
                              </span>
                              {item.band && (
                                <span className="text-[8px] font-black text-accent px-1.5 py-0.5 bg-accent/5 rounded-[4px] border border-accent/10">
                                  BAND {item.band}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadDraft(item);
                            }}
                            className="h-8 px-3 bg-surface-3 border border-border/10 rounded-[6px] text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                          >
                            Restore
                          </button>
                          <button
                            onClick={(e) => handleDeleteDraft(e, item.id)}
                            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-all"
                            title="Delete Draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[380px] shrink-0 bg-surface flex flex-col border-l border-border">
          <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-[12px] font-black tracking-tight">
                Neural Feedback Hub
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span className="text-[10px] font-black text-accent tracking-tight">
                Active scan
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll flex flex-col">
            {/* PRIMARY NEURAL BAND (TOP) */}
            {diagnostics.ielts && (
              <div className="px-4 pt-4 pb-2 border-b border-border/5 bg-surface-2/30">
                <div className="p-4 bg-gradient-to-br from-accent/10 to-emerald-500/10 border border-accent/20 rounded-[12px] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <GraduationCap className="h-12 w-12" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-accent uppercase tracking-[0.2em]">
                        Neural Band Equivalent
                      </p>
                      <h4 className="text-[16px] font-black text-text uppercase tracking-tight">
                        {diagnostics.ieltsLabel} User
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-[24px] font-black text-accent leading-none">
                        {diagnostics.ielts}
                      </div>
                      <p className="text-[7px] font-black text-accent/40 uppercase tracking-widest">
                        Band Score
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/5 flex items-center justify-between">
                    <div className="h-1 flex-1 bg-surface-3 rounded-full overflow-hidden mr-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(parseFloat(diagnostics.ielts) / 9) * 100}%`,
                        }}
                        className="h-full bg-accent"
                      />
                    </div>
                    <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest whitespace-nowrap">
                      Path to Band 9
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SYNCED HUB METRICS (2 ROWS) */}
            <div className="p-4 border-b border-border bg-surface-2/30 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Grammar",
                    score: diagnostics.grammar,
                    icon: CheckCircle,
                    color: "text-blue-500",
                    bg: "bg-blue-500/5",
                    border: "border-blue-500/10",
                  },
                  {
                    label: "Academic",
                    score: diagnostics.academic,
                    icon: GraduationCap,
                    color: "text-purple-500",
                    bg: "bg-purple-500/5",
                    border: "border-purple-500/10",
                  },
                  {
                    label: "Index",
                    score: diagnostics.index,
                    icon: Activity,
                    color: "text-green-500",
                    bg: "bg-green-500/5",
                    border: "border-green-500/10",
                  },
                  {
                    label: "Writing",
                    score: diagnostics.writing,
                    icon: Zap,
                    color: "text-accent",
                    bg: "bg-accent/5",
                    border: "border-accent/10",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`p-3 rounded-[8px] border ${stat.bg} ${stat.border} flex flex-col gap-2 transition-all hover:scale-[1.02] cursor-default`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded-[4px] ${stat.bg.replace("/5", "/20")}`}
                      >
                        <stat.icon className={`h-3 w-3 ${stat.color}`} />
                      </div>
                      <span className="text-[7px] font-black text-muted uppercase tracking-widest">
                        {stat.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className={`text-[16px] font-black leading-none ${stat.color}`}
                      >
                        {stat.score}
                      </span>
                      <span className="text-[8px] font-bold text-muted/40">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FEEDBACK HUB */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-accent" />
                  Explainable Feedback
                </h3>
                <span className="text-[9px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {diagnostics.highlights.length} Anomalies
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {diagnostics.highlights.length > 0 ? (
                  diagnostics.highlights.map((hl, i) => {
                    const word = forgeContent.substring(hl.start, hl.end);
                    return (
                      <div
                        key={i}
                        id={`anomaly-${i + 1}`}
                        className="relative bg-surface border border-border/10 rounded-[12px] p-4 shadow-xl hover:shadow-2xl transition-all group/card overflow-hidden"
                      >
                        <div
                          className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor(hl.type)}`}
                        />
                        <div className="flex items-start justify-between mb-1.5">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${getCategoryColor(hl.type)} text-white shadow-sm`}
                          >
                            {i + 1}
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-widest opacity-30">
                            {hl.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[7px] font-black uppercase tracking-widest opacity-30 shrink-0 w-10">
                              Issue
                            </span>
                            <span className="text-[11px] font-bold text-text line-through opacity-40 italic truncate">
                              {word}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[7px] font-black uppercase tracking-widest opacity-30 shrink-0 w-10">
                              Logic
                            </span>
                            <span className="text-[9px] font-medium text-text/80 leading-tight">
                              {hl.reason}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[7px] font-black uppercase tracking-widest opacity-30 shrink-0 w-10 text-green-500">
                              Fix
                            </span>
                            <span className="text-[11px] font-black text-green-500 truncate">
                              {hl.suggestion}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2 pt-1 border-t border-border/5">
                            <span className="text-[8px] font-black opacity-30 shrink-0 w-10 text-accent">
                              Audit
                            </span>
                            <span className="text-[9px] font-medium text-text/50 leading-tight italic line-clamp-2">
                              "{hl.explanation}"
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-12 text-center bg-surface-2/30 rounded-[12px] border border-dashed border-border/20">
                    <span className="text-[11px] text-muted/40 italic font-medium">
                      System nominal. No neural anomalies detected.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-surface shrink-0 flex gap-3 h-[86px] items-center">
            <button
              onClick={() => {
                if (isAnalyzing) setIsAnalyzing(false);
                else handleDeepAnalyze();
              }}
              disabled={isNeuralScanning || (!forgeContent && !isAnalyzing)}
              className={`flex-1 h-11 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[11px] tracking-tight shadow-xl ${isNeuralScanning ? "bg-accent/20 text-accent animate-pulse" : isAnalyzing ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4" : "bg-accent text-white hover:brightness-110 shadow-accent/20"}`}
            >
              {isNeuralScanning ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : isAnalyzing ? (
                <>
                  <Pencil className="h-4 w-4" /> Edit draft
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Terapkan saran
                </>
              )}
            </button>
            <button
              onClick={handleSaveDraft}
              className="flex-1 h-11 rounded-[10px] border border-accent/20 text-accent hover:bg-accent/5 transition-all font-black text-[11px] tracking-tight flex items-center justify-center gap-2"
            >
              <Archive className="h-3.5 w-3.5" /> Archive research
            </button>
          </div>
        </div>
      </div>
      <DeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => setItemToDelete(null)}
      />
    </div>
  );
}
