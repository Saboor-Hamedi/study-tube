import { useEffect, useRef, useState, useCallback } from "react";
import EditorJS from "@editorjs/editorjs";
import { useStore } from "./../../store/useStore";
import "./../../editor.css";
import { FileText, Trash2, Loader2, Sparkles } from "lucide-react";
import DeleteModal from "../research-vault/DeleteModal";

// Import Tools
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import Marker from "@editorjs/marker";

export default function EditorView({ api, showToast, onOpenCopilot }) {
  const { isCopilotOpen, setCopilotContext } = useStore();
  const editorInstance = useRef(null);
  const isInitializingRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const autoSaveTimer = useRef(null);
  const isCopilotOpenRef = useRef(isCopilotOpen);

  useEffect(() => {
    isCopilotOpenRef.current = isCopilotOpen;
  }, [isCopilotOpen]);

  const syncToCopilot = useCallback(
    async (blocks) => {
      if (!setCopilotContext) return;
      try {
        const textContent = blocks
          .map((b) => {
            if (b.type === "header")
              return `${"#".repeat(b.data.level)} ${b.data.text}`;
            if (b.type === "list")
              return b.data.items.map((i) => `- ${i}`).join("\n");
            return b.data.text || "";
          })
          .join("\n\n");

        setCopilotContext({
          id: "editor-current",
          text: "Editor Draft",
          definition: textContent,
          blocks: blocks,
          type: "editor",
        });
      } catch (e) {
        console.warn("Context sync failed", e);
      }
    },
    [setCopilotContext],
  );

  useEffect(() => {
    const initEditor = async () => {
      if (editorInstance.current || isInitializingRef.current) return;
      isInitializingRef.current = true;

      let savedData = {};
      try {
        savedData = await api.loadNotes();
      } catch (e) {
        console.error("Failed to load notes", e);
      }

      const editor = new EditorJS({
        holder: "editorjs",
        placeholder: "Neural drafting active...",
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: { levels: [1, 2, 3, 4], defaultLevel: 2 },
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: { defaultStyle: "unordered" },
          },
          checklist: { class: Checklist, inlineToolbar: true },
          quote: { class: Quote, inlineToolbar: true },
          code: Code,
          marker: Marker,
        },
        data:
          savedData && Array.isArray(savedData.blocks)
            ? savedData
            : { blocks: [] },
        onReady: () => {
          setIsInitializing(false);
          editorInstance.current = editor;
        },
        onChange: () => {
          if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
          autoSaveTimer.current = setTimeout(async () => {
            if (
              editorInstance.current &&
              typeof editorInstance.current.save === "function"
            ) {
              try {
                const data = await editorInstance.current.save();
                await api.saveNotes(data);
                if (isCopilotOpenRef.current) syncToCopilot(data.blocks);
              } catch (e) {
                console.warn(e);
              }
            }
          }, 1000);
        },
      });
    };

    initEditor();
    return () => {
      if (
        editorInstance.current &&
        typeof editorInstance.current.destroy === "function"
      ) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [api, syncToCopilot]);

  const handleNeuralRefine = useCallback(async () => {
    if (!editorInstance.current || isRefining) return;
    setIsRefining(true);
    try {
      const data = await editorInstance.current.save();
      window.dispatchEvent(
        new CustomEvent("editor:start-refine", {
          detail: { blocks: data.blocks },
        }),
      );
    } catch (e) {
      showToast("Neural Forge Interrupted", "error");
    } finally {
      setIsRefining(false);
    }
  }, [isRefining, showToast]);

  useEffect(() => {
    const handleRefineEvent = () => handleNeuralRefine();
    const handleClearEvent = () => setShowDeleteModal(true);
    window.addEventListener("editor:refine", handleRefineEvent);
    window.addEventListener("editor:clear", handleClearEvent);
    return () => {
      window.removeEventListener("editor:refine", handleRefineEvent);
      window.removeEventListener("editor:clear", handleClearEvent);
    };
  }, [handleNeuralRefine]);

  const handleApplyCorrection = useCallback(
    async (event) => {
      const { blocks } = event.detail || {};
      if (!blocks || !editorInstance.current) return;
      try {
        editorInstance.current.render({ blocks });
        await api.saveNotes({ blocks });
        showToast("Neural Correction Applied", "success");
      } catch (e) {
        console.error(e);
      }
    },
    [api, showToast],
  );

  useEffect(() => {
    window.addEventListener("editor:apply-correction", handleApplyCorrection);
    return () =>
      window.removeEventListener(
        "editor:apply-correction",
        handleApplyCorrection,
      );
  }, [handleApplyCorrection]);

  const handleClear = async () => {
    if (!editorInstance.current) return;
    try {
      await api.saveNotes({ blocks: [] });
      editorInstance.current.render({ blocks: [] });
      showToast("Editor Cleared");
    } catch (e) {
      console.error(e);
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border/20 bg-surface">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent/10 text-accent rounded-[5px]">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[13px] font-black text-text tracking-tight uppercase">
              Neural Synthesis
            </p>
            <p className="text-[8px] text-muted font-bold uppercase tracking-[0.1em]">
              Drafting Laboratory
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-[5px] transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex flex-row flex-1 overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto scrollbar-thin px-8 py-10 transition-all relative ${isCopilotOpen ? "pr-[25px] pl-8" : "lg:px-16 xl:px-24"}`}
        >
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          )}
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-12 opacity-30">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                Neural Text Interface
              </span>
            </div>
            <div className="prose prose-invert prose-lg max-w-none editor-js-override">
              <div id="editorjs" className="min-h-[200px]" />
            </div>
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleClear}
        title="Erase Neural Notes"
        message="Purge all synthesis blocks?"
      />
    </div>
  );
}
