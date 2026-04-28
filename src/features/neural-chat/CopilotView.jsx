import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  User,
  ChevronRight,
  X,
  Square,
  Bot,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { useStore } from "./../../store/useStore";
import { formatNeuralText } from "../../utils/neuralFormat";

// ── MINIMALIST TEXT-ONLY MESSAGE ─────────────────────────────────────
const NeuralChatMessage = memo(({ message, index, isStreaming }) => {
  const isAI = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex flex-col gap-1.5 ${isAI ? "" : "items-end"}`}
    >
      <div
        className={`flex items-center gap-2 ${isAI ? "" : "flex-row-reverse opacity-40 group-hover:opacity-100 transition-opacity"}`}
      >
        <div
          className={`h-4 w-4 flex items-center justify-center rounded-full border border-border/10 ${isAI ? "bg-accent/10 text-accent" : "bg-surface-3 text-muted"}`}
        >
          {isAI ? <Bot className="h-2 w-2" /> : <User className="h-2 w-2" />}
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/40">
          {isAI ? "Neural Assistant" : "Researcher"}
        </span>
      </div>

      <div
        className={`max-w-full p-0.5 rounded-[5px] transition-all ${isAI ? "" : "bg-surface-3/30 border border-border/5 px-3 py-2"}`}
      >
        <div
          className="neural-report select-text cursor-text"
          dangerouslySetInnerHTML={{
            __html: formatNeuralText(message.content),
          }}
        />
        {isStreaming && isAI && (
          <span className="inline-block w-1 h-3 bg-accent/40 animate-pulse ml-1" />
        )}
      </div>
    </motion.div>
  );
});

export default memo(function CopilotView({
  isOpen,
  onClose,
  api,
  showToast,
  sidebarMode = false,
}) {
  // ATOMIC STORE SUBSCRIPTION
  const {
    chatHistory: messages,
    setChatHistory: setMessages,
    copilotContext: contextItem,
    isCopilotCollapsed: isCollapsed,
    setIsCopilotCollapsed: setIsCollapsed,
  } = useStore();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: "user", content: input };
    const assistantMsg = { role: "assistant", content: "" };
    const assistantIdx = messages.length + 1;

    setMessages([...messages, userMsg, assistantMsg]);
    setInput("");
    setIsTyping(true);
    isTypingRef.current = true;

    const systemPrompt = contextItem
      ? `You are the StudyTube Neural Assistant and IELTS Examiner.

PRIMARY TARGET FOR AUDIT: "${contextItem.definition}"
NODE TITLE: "${contextItem.text}"

USER INSTRUCTION/COMMAND: "${input}"

DIAGNOSTIC MANDATE:
Focus your "Neural Audit" EXCLUSIVELY on the PRIMARY TARGET text provided above. Your goal is to score and correct the research content from the document, using the User Instruction only as a guide for your focus.

REQUIRED FORMAT (STRICT):
🧠 IELTS NEURAL AUDIT
📊 Band: [Score]
📝 Summary
[Summary text]
━━━ 🔍 Key Corrections ━━━
1. ❌ "[Original sentence from text]"
   ✅ "[Corrected, natural version]"
   ⚠️ [Issues list]
2. ❌ "[Original sentence]"
   ✅ "[Corrected version]"
   ⚠️ [Issue list]
━━━ 🚀 Vocabulary Boost ━━━
[Vocabulary words]
(Use single newlines ONLY. No empty lines between sections.)`
      : null;

    const finalMessagesForAI = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: userMsg.role, content: userMsg.content },
    ];

    const contentRef = { current: "" };
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 150;
    let unsubscribe = null;

    try {
      unsubscribe = api.onChatChunk(({ content }) => {
        if (!isTypingRef.current) return;
        contentRef.current += content;
        const now = Date.now();
        if (now - lastUpdate > UPDATE_INTERVAL) {
          lastUpdate = now;
          const snapContent = contentRef.current;
          // Atomic functional update for maximum speed and stability
          setMessages((cm) =>
            cm.map((msg, idx) =>
              idx === assistantIdx ? { ...msg, content: snapContent } : msg,
            ),
          );
        }
      });

      const docContext = contextItem?.definition
        ? `[SUBJECT_PRIORITY_RULE: FOCUS ONLY ON ANALYZING THE DOCUMENT BELOW. TREAT USER CHAT AS COMMANDS TO BE PERFORMED ON THIS TEXT.]\n\n[RESEARCH_DOCUMENT_START]\n${contextItem.definition}\n[RESEARCH_DOCUMENT_END]`
        : "";

      await api.chatWithAIStream({
        messages: finalMessagesForAI,
        context: docContext,
      });
    } catch (e) {
      console.error("Neural stream failure", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `[SYSTEM_ALERT] ${e.message}` },
      ]);
    } finally {
      if (unsubscribe) unsubscribe();
      const finalContent = contentRef.current;
      setMessages((cm) =>
        cm.map((msg, idx) =>
          idx === assistantIdx ? { ...msg, content: finalContent } : msg,
        ),
      );
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
      console.warn(e);
    }
  };

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
              className={`h-1 w-1 ${contextItem ? "bg-emerald-400" : "bg-success"} rounded-full animate-pulse`}
            />
            <p className="text-[8px] text-muted font-bold uppercase tracking-[0.1em] truncate max-w-[120px]">
              {contextItem
                ? `Linked: ${contextItem.text}`
                : "Neural Stream Active"}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={isSidebar ? () => setIsCollapsed(true) : onClose}
        className="p-1.5 text-muted hover:text-text hover:bg-surface-2 rounded-[5px] transition-all"
      >
        {isSidebar ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </button>
    </div>
  );

  const renderMessagesList = (padding) => (
    <div
      className={`flex-1 overflow-y-auto ${padding} space-y-6 scrollbar-thin bg-gradient-to-b from-background to-surface`}
    >
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
          <div className="p-5 bg-surface-2 rounded-full border border-border">
            <Sparkles className="h-10 w-10 text-accent/30" />
          </div>
          <div className="max-w-[200px]">
            <p className="text-[10px] font-black text-text uppercase tracking-[0.3em] mb-1">
              Intelligence Layer Active
            </p>
            <p className="text-[8px] text-muted leading-relaxed uppercase tracking-widest">
              Inquiry pending. Request neural synthesis.
            </p>
          </div>
        </div>
      )}
      {messages.map((m, i) => (
        <NeuralChatMessage
          key={i}
          message={m}
          index={i}
          isStreaming={isTyping && i === messages.length - 1}
        />
      ))}
    </div>
  );

  const renderInput = () => (
    <div className="p-4 border-t border-border/20 bg-surface/80 backdrop-blur-xl">
      <div className="relative group transition-all">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-emerald-500/20 rounded-[10px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <div className="relative flex flex-col bg-surface-2 border border-border/40 rounded-[8px] focus-within:border-accent/40 transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Neural inquiry..."
            className="w-full bg-transparent border-none focus:ring-0 text-[12px] text-text placeholder:text-muted/40 px-3 py-2.5 pr-12 resize-none max-h-[200px] scrollbar-none outline-none focus:none"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
            {isTyping ? (
              <button
                onClick={handleStop}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg flex items-center justify-center"
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 bg-accent text-white rounded-full hover:shadow-lg disabled:opacity-30 transition-all flex items-center justify-center"
              >
                <Send className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (sidebarMode) {
    return (
      <motion.div
        initial={false}
        animate={{
          width: !isOpen ? 0 : isCollapsed ? 52 : 380,
          opacity: !isOpen ? 0 : 1,
        }}
        className="h-full border-l border-border bg-surface-2 flex flex-col relative shrink-0 overflow-hidden"
      >
        {isCollapsed ? (
          <div className="h-14 flex flex-col items-center justify-center border-b border-border/20 bg-surface">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-[5px] text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {renderHeader(true)}
            {renderMessagesList("px-5 py-4")}
            {renderInput()}
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
            className="fixed top-0 right-0 h-full w-full lg:w-[420px] bg-background border-l border-border shadow-2xl z-[151] flex flex-col overflow-hidden will-change-transform"
          >
            {renderHeader(false)}
            {renderMessagesList("px-5 py-4")}
            {renderInput()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
