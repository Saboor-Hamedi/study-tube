import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
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
  Library as LibraryIcon,
  Activity,
  Layout,
  Trash2,
  Pencil,
} from "lucide-react";
import PulseLoader from "../research-vault/PulseLoader";
import LibraryTrash from "./LibraryTrash";
import DeleteModal from "../research-vault/DeleteModal";

export default function Profile({ vocab = [], setVocab, onExpand, api = window.youtubeAPI }) {
  const [activeTab, setActiveTab] = useState("forge");
  const [forgeContent, setForgeContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(6);
  const [isAppending, setIsAppending] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [diagnostics, setDiagnostics] = useState({
    grammar: 98,
    spelling: 0,
    academic: 85,
    index: 72,
    highlights: []
  });

  // AI ANALYSIS ENGINE (Manual Trigger)
  const handleDeepAnalyze = async () => {
    if (!forgeContent) return;
    
    setIsAnalyzing(true);
    
    // Simulate Neural Latency
    await new Promise(r => setTimeout(r, 1200));

    // Diagnostic Logic
    const content = forgeContent || "";
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characters = content.length;
    
    // 1. Detect Spelling
    const commonMistakes = ['thier', 'recieve', 'accomodate', 'definitly', 'occured', 'untill', 'definately', 'seperate', 'goverment'];
    const foundMistakes = [];
    commonMistakes.forEach(mistake => {
      const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        foundMistakes.push({ start: match.index, end: match.index + mistake.length, type: 'spelling' });
      }
    });

    // 2. Detect Grammar
    const passiveRegex = /\b(is|am|are|was|were|be|been|being)\b\s+\w+ed\b/gi;
    let gramMatch;
    while ((gramMatch = passiveRegex.exec(content)) !== null) {
      foundMistakes.push({ start: gramMatch.index, end: gramMatch.index + gramMatch[0].length, type: 'grammar' });
    }

    // 3. Calculate AI-Driven Scores
    const spellCount = foundMistakes.filter(m => m.type === 'spelling').length;
    const gramMistakes = foundMistakes.filter(m => m.type === 'grammar').length;
    
    const spellScore = spellCount;
    const gramScore = Math.min(100, Math.max(0, 100 - (gramMistakes * 5)));
    const academicScore = Math.min(95, 60 + (words / 10));
    const readabilityIndex = Math.min(100, 40 + (characters / 50));
    const writingScore = Math.min(100, (gramScore + academicScore + readabilityIndex) / 3);

    setDiagnostics({
      grammar: gramScore,
      spelling: spellScore,
      academic: Math.floor(academicScore),
      index: Math.floor(readabilityIndex),
      writing: Math.floor(writingScore),
      highlights: foundMistakes
    });
  };

  const truncate = (str, n = 20) => {
    if (!str) return "";
    const words = str.split(" ");
    return words.length > n ? words.slice(0, n).join(" ") + "..." : str;
  };

  const tabs = [
    { id: "reviews", label: "English 1A", icon: Clock },
    { id: "archive", label: "Draft 2", icon: CheckCircle },
    { id: "library", label: "Library", icon: Book },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const essays = [
    {
      id: 1,
      student: "Sarah J.",
      title: "The Impact of AI on Literature",
      status: "Pending",
      time: "2h ago",
      tab: "submissions",
    },
    {
      id: 2,
      student: "Michael K.",
      title: "Modernist Poetry Analysis",
      status: "In Review",
      time: "5h ago",
      tab: "reviews",
    },
    {
      id: 3,
      student: "Elena R.",
      title: "Shakespearean Sonnets",
      status: "Completed",
      time: "1d ago",
      tab: "archive",
    },
  ];

  const displayItems =
    activeTab === "library"
      ? vocab.map((v) => ({
          id: v.id,
          title: v.text || "Neural Fragment",
          student: v.collection || "General Vault",
          status: "In Vault",
          time: v.translation || "Resource Entry",
        }))
      : essays.filter((e) => e.tab === activeTab);

  const paginatedItems = displayItems.slice(0, displayLimit);

  const handleLoadMore = () => {
    setIsAppending(true);
    setTimeout(() => {
      setDisplayLimit((prev) => prev + 6);
      setIsAppending(false);
    }, 800);
  };

  const feedbacks = [
    {
      id: 1,
      user: "Sarah J.",
      text: "Thank you for the detailed comments on my draft!",
      time: "10m ago",
    },
    {
      id: 2,
      user: "Alex M.",
      text: "The suggested revisions for the thesis statement were helpful.",
      time: "2h ago",
    },
    {
      id: 3,
      user: "John D.",
      text: "When is the next office hour for essay planning?",
      time: "4h ago",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans">
      {/* ROW 2: SPLIT CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: STUDENT ESSAY SECTION */}
        <div className="flex-1 flex flex-col bg-surface-2/30">
          {/* TABS HEADER */}
          <div className="h-11 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
            <div className="flex gap-4 h-full">
              {/* IDENTITY CLUSTER */}
              <button 
                onClick={() => setActiveTab("forge")}
                className={`flex items-center gap-2 pr-4 border-r border-border/20 group transition-all h-full ${activeTab === "forge" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${activeTab === "forge" ? "bg-accent border-accent" : "bg-accent/10 border-accent/20 group-hover:border-accent/40"}`}>
                  <User className={`h-2.5 w-2.5 ${activeTab === "forge" ? "text-white" : "text-accent"}`} />
                </div>
                <div className="flex flex-col items-start relative">
                  <span className={`text-[9px] font-black tracking-widest leading-none uppercase transition-colors ${activeTab === "forge" ? "text-accent" : "text-text"}`}>
                    Saboor
                  </span>
                  {activeTab === "forge" && (
                    <motion.div 
                      layoutId="profile-tab"
                      className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-accent"
                    />
                  )}
                </div>
              </button>

              {tabs.map((tab, idx) => (
                <React.Fragment key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-full relative flex items-center gap-1.5 transition-all ${activeTab === tab.id ? "text-accent" : "text-muted hover:text-text"}`}
                  >
                    <tab.icon className="h-3 w-3" />
                    <span className="text-[9px] font-black tracking-widest uppercase">
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="profile-tab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      />
                    )}
                  </button>
                  {idx < tabs.length - 1 && (
                    <span className="text-[10px] text-border/20 font-thin self-center select-none">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* TIME & DATE CLUSTER */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-text tracking-widest uppercase">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
                <span className="text-[7px] font-bold text-accent uppercase tracking-[0.1em] opacity-60">
                  {new Date().toLocaleDateString([], {
                    weekday: "short",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="h-6 w-px bg-border/20" />
              <div className="px-2 py-1 bg-accent/5 border border-accent/10 rounded-[2px]">
                <span className="text-[8px] font-black text-accent uppercase tracking-widest">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scroll">
            <div className="h-full">
              <AnimatePresence mode="wait">
                {activeTab === "forge" ? (
                  <motion.div
                    key="forge"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 bg-surface flex flex-col">
                      <div className="flex items-center justify-between px-12 h-20 border-b border-border/10 shrink-0">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-accent/10 rounded-[4px]">
                            {isAnalyzing ? (
                              <Brain className="h-4 w-4 text-accent animate-pulse" />
                            ) : (
                              <Plus className="h-4 w-4 text-accent" />
                            )}
                          </div>
                          <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
                            {isAnalyzing ? "Neural Analysis Active" : "Drafting Pipeline"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (isAnalyzing) {
                                setIsAnalyzing(false);
                              } else {
                                handleDeepAnalyze();
                              }
                            }}
                            disabled={!forgeContent && !isAnalyzing}
                            className={`h-8 px-5 rounded-[4px] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                              isAnalyzing 
                                ? "bg-surface-3 text-text hover:bg-surface-4 border border-border/10" 
                                : "bg-accent text-white hover:brightness-110 shadow-lg shadow-accent/20"
                            }`}
                          >
                            {isAnalyzing ? (
                              <>
                                <Pencil className="h-3 w-3" />
                                Edit Draft
                              </>
                            ) : (
                              <>
                                <Brain className="h-3 w-3" />
                                Analyze Draft
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 w-full overflow-y-auto custom-scroll bg-surface relative">
                        {isAnalyzing ? (
                          <div 
                            className="w-full px-12 py-10 text-[16px] leading-[1.8] font-light tracking-wide whitespace-pre-wrap break-words select-text cursor-default neural-report"
                          >
                            {(() => {
                              if (!forgeContent) return <span className="text-muted/40 italic">Initialize drafting to begin analysis...</span>;
                              let lastIndex = 0;
                              const elements = [];
                              const sortedHighlights = [...diagnostics.highlights].sort((a, b) => a.start - b.start);

                              sortedHighlights.forEach((hl, i) => {
                                if (hl.start > lastIndex) {
                                  elements.push(forgeContent.substring(lastIndex, hl.start));
                                }
                                elements.push(
                                  <span 
                                    key={i} 
                                    className={`transition-all duration-300 px-0.5 rounded-[2px] ${
                                      hl.type === 'spelling' 
                                        ? 'bg-red-500/10 text-red-500 border-b border-red-500/30' 
                                        : 'bg-accent/10 text-accent border-b border-accent/30'
                                    }`}
                                  >
                                    {forgeContent.substring(hl.start, hl.end)}
                                  </span>
                                );
                                lastIndex = hl.end;
                              });
                              if (lastIndex < forgeContent.length) {
                                elements.push(forgeContent.substring(lastIndex));
                              }
                              return elements;
                            })()}
                          </div>
                        ) : (
                          <textarea
                            value={forgeContent}
                            onChange={(e) => setForgeContent(e.target.value)}
                            className="w-full h-full bg-transparent border-none px-12 py-10 text-[16px] text-text/90 leading-[1.8] font-light tracking-wide outline-none resize-none caret-accent selection:bg-accent/20"
                            placeholder="Initialize academic drafting pipeline..."
                            autoFocus
                          />
                        )}
                      </div>

                      <div className="h-14 px-6 border-t border-border/10 bg-surface-2 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          {[
                            { label: "ACADEMIC", score: diagnostics.academic.toString(), icon: GraduationCap, color: "text-accent" },
                            { label: "GRAMMAR", score: diagnostics.grammar.toString(), color: "text-green-500" },
                            { label: "INDEX", score: diagnostics.index.toString(), color: "text-orange-500" },
                            { label: "WRITING", score: diagnostics.writing?.toString() || "0", color: "text-accent" },
                            { label: "SPILL", score: diagnostics.spelling.toString(), color: "text-red-500/60" },
                          ].map((item) => (
                            <div 
                              key={item.label} 
                              className="group/metric h-10 px-3 bg-surface-3 border border-border/5 rounded-[6px] flex flex-col justify-center gap-0.5 hover:border-accent/20 hover:bg-surface-4 transition-all"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-[6px] font-black text-muted/60 uppercase tracking-[0.2em]">
                                  {item.label}
                                </span>
                                {item.icon && <item.icon className="h-2 w-2 text-accent/40" />}
                              </div>
                              <div className="flex items-end gap-1">
                                <span className={`text-[11px] font-black tracking-tight leading-none ${item.color}`}>
                                  {item.score}
                                  {item.label !== "SPILL" && <span className="text-[7px] ml-0.5 opacity-40">%</span>}
                                </span>
                                {/* MICRO INDICATOR */}
                                <div className="h-0.5 flex-1 min-w-[20px] bg-border/10 rounded-full overflow-hidden mb-[3px]">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: item.label === "SPILL" ? `${Math.min(parseFloat(item.score) * 10, 100)}%` : `${Math.min(parseFloat(item.score), 100)}%` }}
                                    className={`h-full ${item.color.replace('text-', 'bg-')}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 pl-6 border-l border-border/10 h-8">
                          <button className="flex flex-col items-end gap-0.5 group">
                            <span className="text-[7px] font-black text-muted/40 uppercase tracking-[0.2em] group-hover:text-accent transition-all">
                              Classification
                            </span>
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-accent/5 border border-accent/10 rounded-[4px]">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                              <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                                Pending
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === "trash" ? (
                  <motion.div
                    key="trash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <LibraryTrash 
                      api={window.youtubeAPI} 
                      onRestore={async (item) => {
                        await api.saveVocabItem({ ...item, archived: 0 });
                        if (setVocab) {
                          setVocab(prev => {
                            if (prev.find(v => v.id === item.id)) return prev;
                            return [item, ...prev];
                          });
                        }
                      }}
                      onDeletePermanent={async (id) => {
                        await window.youtubeAPI.deleteVocabItem(id);
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3 p-8"
                  >
                    {paginatedItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (activeTab === "library" && onExpand) {
                            const originalItem = vocab.find(
                              (v) => v.id === item.id,
                            );
                            if (originalItem) onExpand(originalItem);
                          }
                        }}
                        className={`group flex items-center justify-between p-5 bg-surface border border-border hover:border-accent/40 transition-all rounded-[10px] relative ${
                          activeTab === "library" ? "cursor-pointer" : ""
                        }`}
                      >
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-accent/10 group-hover:bg-accent transition-colors rounded-l-[10px]" />

                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center shrink-0">
                            {activeTab === "library" ? (
                              <LibraryIcon className="h-5 w-5 text-muted group-hover:text-accent transition-colors" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted group-hover:text-accent transition-colors" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-black text-text tracking-tight group-hover:text-accent transition-colors">
                              {truncate(item.title, 20)}
                            </h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                                {item.student}
                              </span>
                              <span className="text-[10px] text-muted">•</span>
                              <span className="text-[10px] text-muted font-medium italic">
                                {item.time}
                              </span>
                            </div>

                            {activeTab === "library" && (
                              <div className="flex items-center gap-1 mt-1 opacity-100 transition-all translate-y-0">
                                <span className="text-[7px] font-black text-accent uppercase tracking-[0.2em]">
                                  Read More
                                </span>
                                <ChevronRight className="h-2 w-2 text-accent" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          {activeTab !== "library" && (
                            <div className="flex flex-col items-end gap-1">
                              <div
                                className={`px-2 py-0.5 rounded-[2px] border ${
                                  item.status === "Completed"
                                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                                    : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                }`}
                              >
                                <span className="text-[8px] font-black uppercase tracking-widest">
                                  {item.status}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-muted/40 uppercase tracking-widest">
                                Global Status
                              </span>
                            </div>
                          )}

                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(openActionId === item.id ? null : item.id);
                              }}
                              className="p-2 text-muted hover:text-text hover:bg-surface-3 rounded-[4px] transition-all"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            
                            <AnimatePresence>
                              {openActionId === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-2 w-32 bg-surface-2 border border-border rounded-[6px] shadow-2xl z-[100] overflow-hidden"
                                >
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      if (activeTab === "library" && onExpand) {
                                        const originalItem = vocab.find(v => v.id === item.id);
                                        if (originalItem) onExpand(originalItem);
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-[10px] font-black text-left uppercase tracking-widest text-muted hover:text-accent hover:bg-accent/5 transition-all flex items-center gap-2"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </button>
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      if (activeTab === "library") {
                                        setItemToDelete(item.id);
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-[10px] font-black text-left uppercase tracking-widest text-muted hover:text-red-500 hover:bg-red-500/5 transition-all border-t border-border/10 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* DELETE CONFIRMATION MODAL */}
                    <DeleteModal 
                      isOpen={!!itemToDelete}
                      onClose={() => setItemToDelete(null)}
                      title="Archive Fragment"
                      message="Decommission this research node to the trash vault?"
                      onConfirm={async () => {
                        const originalItem = vocab.find(v => v.id === itemToDelete);
                        if (originalItem) {
                          await api.saveVocabItem({ ...originalItem, archived: 1 });
                          if (setVocab) {
                            setVocab(prev => prev.filter(v => v.id !== itemToDelete));
                          }
                        }
                        setItemToDelete(null);
                      }}
                    />

                    <div className="mt-8 flex flex-col items-center gap-6 pb-12">
                      {isAppending ? (
                        <PulseLoader message="Expanding Neural Archive..." />
                      ) : (
                        <div className="flex items-center gap-4">
                          {displayItems.length > displayLimit && (
                            <button
                              onClick={handleLoadMore}
                              className="group h-8 px-5 flex items-center gap-2 bg-surface border border-border/10 text-muted/60 hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all rounded-full"
                            >
                              <Plus className="h-2.5 w-2.5 group-hover:rotate-90 transition-transform duration-500" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                Load more
                              </span>
                            </button>
                          )}

                          {displayLimit > 6 && (
                            <button
                              onClick={() => setDisplayLimit(6)}
                              className="h-8 px-5 flex items-center bg-transparent border border-transparent hover:border-accent/10 text-muted/30 hover:text-accent/60 transition-all rounded-full"
                            >
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                collapsed
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

        {/* RIGHT COLUMN: FEEDBACK LOOP */}
        <div className="w-[320px] shrink-0 border-l border-border bg-surface flex flex-col">
          <div className="h-11 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-[10px] font-black tracking-widest">
                Feedback Loop
              </h2>
            </div>
            <div className="h-1.5 w-1.5 bg-accent rounded-full animate-pulse" />
          </div>

          {/* MIGRATED STATS */}
          <div className="p-5 border-b border-border bg-surface-2/50 grid grid-cols-2 gap-4 shrink-0">
            {[
              { label: "Essays Reviewed", value: "142" },
              { label: "Avg. Response", value: "4.2h" },
              { label: "Student Rating", value: "4.9/5" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="text-lg font-black text-text tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
            {feedbacks.map((fb) => (
              <motion.div
                key={fb.id}
                whileHover={{ x: -4 }}
                className="p-4 bg-surface-2 border border-border rounded-[8px] space-y-2 hover:border-accent/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-accent uppercase tracking-tight">
                    {fb.user}
                  </span>
                  <span className="text-[8px] font-bold text-muted uppercase tracking-widest">
                    {fb.time}
                  </span>
                </div>
                <p className="text-[11px] text-text/70 leading-relaxed italic">
                  "{fb.text}"
                </p>
                <div className="flex justify-start pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-3 w-3 text-accent rotate-180" />
                </div>
              </motion.div>
            ))}

            <button className="w-full py-3 border border-dashed border-border rounded-[8px] text-[9px] font-black text-muted uppercase tracking-widest hover:border-accent/30 hover:text-text transition-all">
              View All Communications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
