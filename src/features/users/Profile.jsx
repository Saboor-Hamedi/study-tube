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
  Library as LibraryIcon,
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
} from "lucide-react";
import PulseLoader from "../research-vault/PulseLoader";
import LibraryTrash from "./LibraryTrash";
import LibraryView from "../research-vault/LibraryView";
import DeleteModal from "../research-vault/DeleteModal";

export default function Profile({
  vocab = [],
  setVocab,
  onExpand,
  api = window.youtubeAPI,
}) {
  const [activeTab, setActiveTab] = useState("forge");
  const [forgeContent, setForgeContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNeuralScanning, setIsNeuralScanning] = useState(false);
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
    {
      id: 4,
      student: "Alex M.",
      title: "Industrial Revolution Impact",
      status: "Pending",
      time: "3h ago",
      tab: "submissions",
    },
    {
      id: 5,
      student: "David L.",
      title: "Quantum Physics Introduction",
      status: "In Review",
      time: "6h ago",
      tab: "reviews",
    },
    {
      id: 6,
      student: "Lisa V.",
      title: "Digital Marketing Trends",
      status: "Completed",
      time: "2d ago",
      tab: "archive",
    },
  ];

  // AI ANALYSIS ENGINE (Industrial Forensic Pipeline)
  const handleDeepAnalyze = async () => {
    if (!forgeContent) return;

    setIsNeuralScanning(true);
    await new Promise((r) => setTimeout(r, 1500));

    const content = forgeContent.trim();
    const words = content.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = content.length;
    const highlights = [];

    // 1. SPELLING & PUNCTUATION
    const patternRegex = /\b\w*(\w)\1{1,}\b/gi;
    let patternMatch;
    while ((patternMatch = patternRegex.exec(content)) !== null) {
      const word = patternMatch[0].toLowerCase();
      const legitimateDoubles = [
        "better",
        "apple",
        "common",
        "grammar",
        "academic",
        "furthermore",
        "nevertheless",
        "been",
        "will",
        "all",
        "well",
        "see",
        "look",
        "book",
        "need",
        "feel",
        "seem",
        "keep",
        "school",
        "today",
        "success",
        "opportunity",
        "every",
        "think",
        "class",
        "process",
        "assess",
        "across",
        "addition",
        "address",
        "apply",
        "assist",
        "assume",
        "attach",
        "between",
        "cannot",
        "carry",
        "collect",
        "connect",
        "current",
        "decision",
        "degree",
        "differ",
        "effect",
        "effort",
        "error",
        "essay",
        "essential",
        "follow",
        "happen",
        "issue",
        "letter",
        "little",
        "matter",
        "message",
        "middle",
        "necessary",
        "occur",
        "offer",
        "office",
        "official",
        "pass",
        "passage",
        "possible",
        "press",
        "pressure",
        "professor",
        "progress",
        "really",
        "recall",
        "small",
        "staff",
        "still",
        "street",
        "stress",
        "suppose",
        "tell",
        "unless",
        "upper",
      ];
      if (!legitimateDoubles.includes(word)) {
        highlights.push({
          start: patternMatch.index,
          end: patternMatch.index + patternMatch[0].length,
          type: "spelling",
          reason: "Linguistic Anomaly",
          suggestion: word.replace(/(.)\1{1,}$/, "$1"),
          explanation: "Redundant character repetition detected.",
        });
      }
    }

    const commonMistakes = [
      { m: "everyday", c: "every day" },
      { m: "sometime", c: "sometimes" },
      { m: "dont", c: "don't" },
      { m: "tech", c: "teach" },
      { m: "confuse", c: "confused" },
      { m: "studing", c: "studying" },
      { m: "easyer", c: "easier" },
      { m: "nobodye", c: "nobody" },
    ];
    commonMistakes.forEach((pair) => {
      const regex = new RegExp(`\\b${pair.m}\\b`, "gi");
      let match;
      while ((match = regex.exec(content)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + pair.m.length,
          type: "spelling",
          reason: "Spelling Anomaly",
          suggestion: pair.c,
          explanation: "Standard academic spelling mismatch.",
        });
      }
    });

    // 2. GRAMMAR & VERB AGREEMENT
    const grammarChecks = [
      {
        regex: /\b(i)\b/g,
        reason: "Capitalization",
        suggestion: "I",
        explanation: 'Personal pronoun "I" must be capitalized.',
      },
      {
        regex: /\b(i|you|we|they)\s+([a-z]+es|[a-z]+s)\b/gi,
        reason: "Verb Agreement",
        suggestion: "Verb Fix",
        explanation: "Subject-verb agreement mismatch for plural pronoun.",
      },
      {
        regex: /\b(he|she|it)\s+([a-z]{3,})(?<!s|es)\b/gi,
        reason: "Verb Agreement",
        suggestion: "Verb Fix",
        explanation: "Singular subject requires third-person verb form.",
      },
      {
        regex: /\b(are|is)\b\s+not\b\s+\w+ing\b/gi,
        reason: "Verb Form",
        suggestion: "Verb Fix",
        explanation: "Check verb tense consistency.",
      },
    ];
    grammarChecks.forEach((check) => {
      let match;
      while ((match = check.regex.exec(content)) !== null) {
        if (!highlights.find((h) => h.start === match.index)) {
          highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: "grammar",
            reason: check.reason,
            suggestion: check.suggestion,
            explanation: check.explanation,
          });
        }
      }
    });

    // 3. DICTION & TONE
    const dictionChecks = [
      {
        regex: /\b(very|extremely|really|quite)\b/gi,
        type: "diction",
        reason: "Weak Adverb",
        suggestion: "Omit",
        explanation: "Weak adverbs reduce academic impact.",
      },
      {
        regex: /\b(things|stuff|nice|good|bad)\b/gi,
        type: "diction",
        reason: "Vague Diction",
        suggestion: "Specific Term",
        explanation: "Replace vague terms with precise academic vocabulary.",
      },
      {
        regex: /\b(is|am|are|was|were|be|been|being)\b\s+\w+ed\b/gi,
        type: "tone",
        reason: "Passive Voice",
        suggestion: "Active Voice",
        explanation: "Active voice is preferred for academic clarity.",
      },
    ];
    dictionChecks.forEach((check) => {
      let match;
      while ((match = check.regex.exec(content)) !== null) {
        if (!highlights.find((h) => h.start === match.index)) {
          highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: check.type,
            reason: check.reason,
            suggestion: check.suggestion,
            explanation: check.explanation,
          });
        }
      }
    });

    const spellCount = highlights.filter((h) => h.type === "spelling").length;
    const gramCount = highlights.filter((h) => h.type === "grammar").length;
    const dictionCount = highlights.filter((h) => h.type === "diction").length;
    const toneCount = highlights.filter((h) => h.type === "tone").length;

    const academicHits = words.filter((w) =>
      [
        "furthermore",
        "nevertheless",
        "consequently",
        "methodology",
        "empirical",
        "theoretical",
      ].includes(w.toLowerCase().replace(/[.,]/g, "")),
    ).length;
    const gramScore = Math.max(0, 100 - (gramCount + spellCount) * 5);
    const academicScore = Math.min(
      100,
      academicHits * 15 + Math.min(25, wordCount / 4),
    );
    const readabilityIndex = Math.min(100, (charCount / (wordCount || 1)) * 8);
    const writingScore = Math.round(
      gramScore * 0.4 + academicScore * 0.4 + readabilityIndex * 0.2,
    );

    setDiagnostics({
      grammar: Math.round(gramScore),
      spelling: spellCount,
      diction: dictionCount,
      tone: toneCount,
      academic: Math.round(academicScore),
      index: Math.round(readabilityIndex),
      writing: Math.max(0, Math.round(writingScore)),
      highlights,
      marketTrends: words
        .filter((w) => w.length > 6)
        .slice(0, 4)
        .map((w) => `${w.charAt(0).toUpperCase() + w.slice(1)} Context Found`),
    });

    setIsNeuralScanning(false);
    setIsAnalyzing(true);
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case "grammar":
        return "bg-blue-500";
      case "diction":
        return "bg-orange-500";
      case "tone":
        return "bg-purple-500";
      case "spelling":
        return "bg-red-500";
      default:
        return "bg-accent";
    }
  };

  const getCategoryBg = (type) => {
    switch (type) {
      case "grammar":
        return "bg-blue-500/10";
      case "diction":
        return "bg-orange-500/10";
      case "tone":
        return "bg-purple-500/10";
      case "spelling":
        return "bg-red-500/10";
      default:
        return "bg-accent/10";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col bg-surface-2/30 border-r border-border overflow-hidden">
          {/* TABS HEADER */}
          <div className="h-14 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
            <div className="flex gap-4 h-full">
              <button
                onClick={() => setActiveTab("forge")}
                className={`flex items-center gap-3 pr-4 border-r border-border/20 group transition-all h-full ${activeTab === "forge" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${activeTab === "forge" ? "bg-accent border-accent" : "bg-accent/10 border-accent/20"}`}
                >
                  <User
                    className={`h-3 w-3 ${activeTab === "forge" ? "text-white" : "text-accent"}`}
                  />
                </div>
                <span
                  className={`text-[11px] font-black tracking-widest uppercase ${activeTab === "forge" ? "text-accent" : "text-text"}`}
                >
                  Saboor
                </span>
              </button>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-full relative flex items-center gap-1.5 transition-all ${activeTab === tab.id ? "text-accent" : "text-muted hover:text-text"}`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="profile-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === "forge" ? (
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
                                    className={`absolute -top-3 -right-2 w-4 h-4 rounded-full ${getCategoryColor(hl.type)} text-white text-[8px] font-black flex items-center justify-center shadow-lg cursor-help`}
                                    title={`Anomaly ID: ${i + 1}`}
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

                  {/* MINI BOTTOM HUD */}
                  {isAnalyzing && (
                    <div className="px-6 py-3 border-t border-border/10 bg-surface flex items-center justify-between gap-6 shrink-0">
                      <div className="flex items-center gap-6 ml-auto">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-text/80 uppercase">
                            Draft 2 dari 3
                          </span>
                          <span className="text-[8px] font-bold text-muted/60 uppercase tracking-tighter">
                            Deadline: 30 Mei 2024
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[8px] font-black rounded-[4px] uppercase border border-orange-500/20">
                          Perlu Revisi
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SYNCED FOOTER METRICS */}
                  <div className="h-14 px-6 border-t border-border/10 bg-surface-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      {[
                        {
                          label: "ACADEMIC",
                          score: diagnostics.academic,
                          color: "text-purple-500",
                        },
                        {
                          label: "GRAMMAR",
                          score: diagnostics.grammar,
                          color: "text-blue-500",
                        },
                        {
                          label: "INDEX",
                          score: diagnostics.index,
                          color: "text-green-500",
                        },
                        {
                          label: "WRITING",
                          score: diagnostics.writing,
                          color: "text-accent",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="h-10 px-3 bg-surface-3 border border-border/5 rounded-[6px] flex flex-col justify-center gap-0.5"
                        >
                          <span className="text-[6px] font-black text-muted/60 uppercase tracking-[0.2em]">
                            {item.label}
                          </span>
                          <span
                            className={`text-[11px] font-black ${item.color}`}
                          >
                            {item.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[8px] font-black text-muted/30 uppercase tracking-[0.2em]">
                      Neural Synthesis Grid
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
                  {essays
                    .filter((e) => e.tab === activeTab)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-surface border border-border rounded-[8px] flex items-center justify-between group hover:border-accent/40 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center border border-border">
                            <FileText className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                          </div>
                          <div>
                            <h4 className="text-[12px] font-black text-text">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                              {item.student}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted group-hover:text-accent" />
                      </div>
                    ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[380px] shrink-0 bg-surface flex flex-col border-l border-border">
          <div className="h-14 px-4 border-b border-border flex items-center justify-between bg-surface-3/30 shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-[11px] font-black tracking-widest uppercase">
                Neural Feedback Hub
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                Active Scan
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll flex flex-col">
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

              <div className="space-y-6">
                {diagnostics.highlights.length > 0 ? (
                  diagnostics.highlights.map((hl, i) => {
                    const word = forgeContent.substring(hl.start, hl.end);
                    return (
                      <div
                        key={i}
                        className="relative bg-surface border border-border/10 rounded-[12px] p-5 shadow-xl hover:shadow-2xl transition-all group/card overflow-hidden"
                      >
                        <div
                          className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor(hl.type)}`}
                        />
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black ${getCategoryColor(hl.type)} text-white shadow-lg`}
                          >
                            {i + 1}
                          </div>
                          <div className="flex items-center gap-2 opacity-40">
                            <Maximize2 className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              Scope: {word.length} chars
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 opacity-40">
                              <Type className="h-2.5 w-2.5" />
                              <span className="text-[7px] font-black uppercase tracking-widest">
                                Issue
                              </span>
                            </div>
                            <span className="text-[13px] font-bold text-text line-through opacity-60 italic">
                              {word}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 opacity-40">
                              <Info className="h-2.5 w-2.5" />
                              <span className="text-[7px] font-black uppercase tracking-widest">
                                Reasoning
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-text/80 leading-tight block">
                              {hl.reason}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 opacity-40">
                              <CheckCircle className="h-2.5 w-2.5 text-green-500" />
                              <span className="text-[7px] font-black uppercase tracking-widest">
                                Correction
                              </span>
                            </div>
                            <span className="text-[13px] font-black text-green-500">
                              {hl.suggestion}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 opacity-40">
                              <Sparkles className="h-2.5 w-2.5 text-accent" />
                              <span className="text-[7px] font-black uppercase tracking-widest">
                                Explanation
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-text/60 leading-tight block italic">
                              "{hl.explanation}"
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center bg-surface-2/30 rounded-[12px] border border-dashed border-border/20">
                    <span className="text-[11px] text-muted/40 italic font-medium">
                      System nominal. No neural anomalies detected.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-surface shrink-0 flex gap-3">
            <button
              onClick={() => {
                if (isAnalyzing) setIsAnalyzing(false);
                else handleDeepAnalyze();
              }}
              disabled={isNeuralScanning || (!forgeContent && !isAnalyzing)}
              className={`flex-1 h-11 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[9px] uppercase tracking-[0.15em] shadow-xl ${isNeuralScanning ? "bg-accent/20 text-accent animate-pulse" : isAnalyzing ? "bg-surface-3 text-text border border-border/10 hover:bg-surface-4" : "bg-accent text-white hover:brightness-110 shadow-accent/20"}`}
            >
              {isNeuralScanning ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : isAnalyzing ? (
                <>
                  <Pencil className="h-4 w-4" /> Edit Draft
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Terapkan Saran
                </>
              )}
            </button>
            <button className="flex-1 h-11 rounded-[10px] border border-accent/20 text-accent hover:bg-accent/5 transition-all font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center">
              Send to Student
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
