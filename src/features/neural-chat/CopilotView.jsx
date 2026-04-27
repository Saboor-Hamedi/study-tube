import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  User,
  ChevronRight,
  X,
  Square,
  Brain,
  Plus,
  RefreshCcw,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { DraggableCard } from "../research-vault/DraggableCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default memo(function CopilotView({
  isOpen,
  onClose,
  vocab,
  setVocab,
  collections,
  setCollections,
  selectedCollection,
  setSelectedCollection,
  contextItem,
  messages,
  setMessages,
  api,
  showToast,
  sidebarMode = false,
  isCollapsed = false,
  setIsCollapsed = () => {},
}) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // ── LOGIC HANDLERS ──────────────────────────────────────────────────

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  const scrollToBottom = (force = false) => {
    if (force || isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: force ? "smooth" : "auto" });
    }
  };

  useEffect(() => {
    if (isOpen || sidebarMode) {
      scrollToBottom(messages.length > 0 && messages[messages.length-1].role === "user");
    }
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isTyping && isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isTyping, isAtBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const assistantIdx = newMessages.length;
    setInput("");
    setIsTyping(true);
    isTypingRef.current = true;

    let currentContent = "";
    let unsubscribe = null;

    try {
      unsubscribe = api.onChatChunk(({ content }) => {
        if (!isTypingRef.current) return;
        currentContent += content;
        setMessages((cm) =>
          cm.map((msg, idx) =>
            idx === assistantIdx ? { ...msg, content: currentContent } : msg,
          ),
        );
      });

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const systemPrompt = contextItem
        ? `You are the StudyTube Neural Assistant and Professional English Editor.
Analyze the following content: "${contextItem.text}"
CONTEXT CONTENT:
${contextItem.definition}

MISSION:
Evaluate the writing quality, grammar, and vocabulary. Identify specific linguistic mistakes and provide high-fidelity corrections.

${
  contextItem.type === "editor"
    ? "CRITICAL: Wrap any structural corrections in [REFINED_BLOCKS] ... [/REFINED_BLOCKS] using JSON format matching EditorJS. provide a 'Neural Draft Score' (0-100)."
    : contextItem.type === "insight"
      ? "CRITICAL: Provide a 'Writing Fidelity Score' (0-100) based on grammar, impact, and clarity. Format your feedback using industrial bullet points for mistakes."
      : "Format: industrial, concise, bullet points if needed."
}`
        : null;

      const history = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const finalMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...history]
        : history;

      await api.chatWithAIStream({
        messages: finalMessages,
        context: contextItem
          ? `Neural Node: ${contextItem.text}`
          : "Global Research Copilot",
      });
    } catch (e) {
      console.error("Neural stream failure", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `[SYSTEM_ALERT] ${e.message}` },
      ]);
    } finally {
      if (unsubscribe) unsubscribe();
      setIsTyping(false);
      isTypingRef.current = false;
    }
  };

  const handleStop = async () => {
    setIsTyping(false);
    isTypingRef.current = false;
    try {
      if (api.stopAI) await api.stopAI();
    } catch (e) {
      console.warn("api.stopAI failed or not implemented", e);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [activeDragMessage, setActiveDragMessage] = useState(null);

  const handleDragEnd = async (event) => {
    const { active } = event;
    setActiveDragMessage(null);
    if (active?.data.current?.type === "chat-message") {
      const item = active.data.current;
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
          text: finalTitle,
          definition: item.content,
          collection:
            selectedCollection === "all" ? "" : selectedCollection || "",
          date: new Date().toISOString(),
          videoTitle: "AI Research Insight",
          loading: false,
        };
        const newList = [newEntry, ...vocab];
        setVocab(newList);
        await api.saveVocab(newList);
        showToast(
          `Insight archived to ${selectedCollection || "Archive Root"}`,
        );
      } catch (err) {
        showToast("Capture failed", "error");
      }
    }
  };

  // ── SHARED RENDER COMPONENTS ───────────────────────────────────────

  const renderHeader = (isSidebar) => (
    <div className="h-14 shrink-0 px-5 border-b border-border/20 flex items-center justify-between bg-surface">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-white rounded-[5px]">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[13px] font-black text-text tracking-tight uppercase">
            Neural Co-Pilot
          </p>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-1 w-1 ${contextItem ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "bg-success shadow-[0_0_5px_var(--success)]"} rounded-full animate-pulse`}
            />
            <p className="text-[8px] text-muted font-bold uppercase tracking-[0.1em] truncate max-w-[120px]">
              {contextItem ? `Linked: ${contextItem.text}` : "Neural Stream Active"}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={isSidebar ? () => setIsCollapsed(true) : onClose}
        className="p-1.5 text-muted hover:text-text hover:bg-surface-2 rounded-[5px] transition-all"
      >
        {isSidebar ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </button>
    </div>
  );

  const renderMessages = (padding = "p-4") => (
    <div 
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto ${padding} space-y-4 scrollbar-thin bg-gradient-to-b from-[var(--background)] to-[var(--surface)]`}
    >
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
          <div className="p-5 bg-[var(--surface-2)] rounded-full border border-[var(--border)]">
            <Sparkles className="h-10 w-10 text-[var(--accent)]/30" />
          </div>
          <div className="max-w-[200px]">
            <p className="text-[10px] font-black text-[var(--text)] uppercase tracking-[0.3em] mb-1">
              Intelligence Layer Active
            </p>
            <p className="text-[8px] text-[var(--muted)] leading-relaxed uppercase tracking-widest">
              Inquiry pending. Request neural synthesis.
            </p>
          </div>
        </div>
      )}
      {messages.map((m, i) => {
        if (m.role === "assistant" && !m.content.trim()) return null;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className={`flex items-start gap-3 max-w-[95%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`shrink-0 p-1 rounded-full border ${m.role === "user" ? "bg-indigo-500/10 border-indigo-500/10" : "bg-emerald-500/10 border-emerald-500/10"}`}>
                {m.role === "user" ? <User className="h-3 w-3 text-indigo-400" /> : <Sparkles className="h-3 w-3 text-emerald-400" />}
              </div>
              <div
                className={`max-w-[90%] rounded-[8px] px-3 py-2.5 text-[12px] leading-[1.6] font-light select-text
                ${
                  m.role === "user"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-3)] text-[var(--text)] border border-[var(--border)]"
                }`}
              >
                {m.role === "assistant" ? (
                  <DraggableCard
                    id={`msg-${i}`}
                    v={{ ...m, type: "chat-message" }}
                    useHandle={true}
                  >
                    {({ listeners, attributes }) => (
                      <div className="group/msg relative cursor-text select-text w-full">
                        <div className="prose prose-sm max-w-none prose-p:text-[12px] prose-p:leading-[1.6] prose-p:text-[var(--text)] prose-p:mb-3 prose-strong:text-[var(--accent)] prose-code:bg-[var(--surface-2)] prose-code:p-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <div
                            {...listeners}
                            {...attributes}
                            className="p-1.5 bg-transparent hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 border border-[var(--accent)]/20 rounded-[5px]"
                          >
                            <GripVertical className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              Archive
                            </span>
                          </div>

                          {contextItem?.type === "editor" &&
                            m.content.includes("[REFINED_BLOCKS]") && (
                              <button
                                onClick={() => {
                                  try {
                                    const match = m.content.match(
                                      /\[REFINED_BLOCKS\]([\s\S]*?)\[\/REFINED_BLOCKS\]/,
                                    );
                                    if (match?.[1]) {
                                      const blocks = JSON.parse(match[1]);
                                      window.dispatchEvent(
                                        new CustomEvent(
                                          "editor:apply-correction",
                                          { detail: { blocks } },
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    showToast("Block Parse Failure", "error");
                                  }
                                }}
                                className="p-1.5 bg-[var(--success)]/10 hover:bg-[var(--success)] text-[var(--success)] hover:text-white transition-all flex items-center gap-2 border border-[var(--success)]/20 rounded-[5px]"
                              >
                                <RefreshCcw className="h-3 w-3" />
                                <span className="text-[8px] font-black uppercase tracking-widest">
                                  Apply
                                </span>
                              </button>
                            )}
                        </div>
                      </div>
                    )}
                  </DraggableCard>
                ) : (
                  m.content
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      {isTyping && (
        <div className="flex items-center gap-3 text-[var(--accent)] animate-pulse">
          <div className="p-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">
            Synthesizing...
          </span>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );

  const renderInput = (isSidebar) => (
    <div className={`${isSidebar ? 'p-2' : 'p-4'} bg-[var(--surface-3)] border-t border-[var(--border)]`}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[6px] p-1 flex items-center gap-1.5 focus-within:border-[var(--accent)]/40 transition-all group/input">
          <div className="flex-shrink-0 p-1.5 bg-[var(--surface-3)] rounded-[4px] border border-[var(--border)] ml-0.5 cursor-pointer hover:bg-[var(--surface-1)] transition-colors">
            <Plus className="h-3 w-3 text-[var(--muted)] group-hover/input:text-[var(--accent)] transition-colors" />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                isTyping ? handleStop() : handleSend();
              }
            }}
            placeholder={isTyping ? "SYNTHESIZING..." : "DIRECTIVE..."}
            className="flex-1 bg-transparent px-2 py-1.5 text-[12px] leading-[1.2] font-medium text-[var(--text)] outline-none placeholder:text-[var(--muted)]/30 placeholder:uppercase placeholder:tracking-[0.2em] resize-none min-h-[30px] max-h-[160px] scrollbar-none display-flex align-center"
            rows={1}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isTyping ? handleStop() : handleSend();
            }}
            className={`flex-shrink-0 p-1.5 rounded-[4px] transition-all active:scale-95 ${
              isTyping
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : input.trim()
                  ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]"
                  : "bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]"
            }`}
          >
            {isTyping ? <Square className="h-3 w-3 fill-current" /> : <Send className="h-3 w-3 fill-current" />}
          </button>
        </div>
      </div>
    </div>
  );

  // ── FINAL RENDERING ────────────────────────────────────────────────

  if (sidebarMode) {
    return (
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 52 : 320 }}
        className="h-full border-l border-[var(--border)] bg-[var(--surface-2)] flex flex-col relative shrink-0 overflow-hidden"
      >
        {isCollapsed ? (
          <div className="h-14 flex flex-col items-center justify-center border-b border-border/20 bg-surface">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-[5px] text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-sm"
              title="Expand Neural Copilot"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {renderHeader(true)}
            {renderMessages("p-4")}
            {renderInput(true)}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/40 backdrop-blur-md z-[150]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
            className={`fixed top-0 right-0 h-full w-full lg:w-[340px] bg-[var(--background)] border-l border-[var(--border)] shadow-2xl z-[151] flex flex-col overflow-hidden will-change-transform ${contextItem?.type === "editor" ? "shadow-none" : ""}`}
          >
            <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={(e) => setActiveDragMessage(e.active.data.current)}>
              {renderHeader(false)}
              {renderMessages("p-6")}
              {renderInput(false)}
              
              <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
                {activeDragMessage ? (
                  <div className="pointer-events-none flex items-center gap-2 bg-[var(--surface-3)] border border-[var(--accent)] py-1 px-3 shadow-2xl w-[160px] opacity-95 rounded-[5px]">
                    <GripVertical className="h-3 w-3 text-[var(--accent)]" />
                    <p className="text-[9px] font-black text-[var(--text)] uppercase tracking-widest truncate">
                      Archiving...
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
