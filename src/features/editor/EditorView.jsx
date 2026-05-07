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

import { api } from "./../../utils/api-bridge";

export default function EditorView({ showToast, onOpenCopilot }) {
  const { isCopilotOpen, setCopilotContext } = useStore();
  const editorInstance = useRef(null);
  const editorContainerRef = useRef(null);
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

      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = "";
      }

      const editor = new EditorJS({
        holder: editorContainerRef.current || "editorjs",
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
      isInitializingRef.current = false;
    };
  }, [api, syncToCopilot]);

  // Handle the refine event from the Neural Copilot view
  // This will refine the editor content
  const handleNeuralRefine = useCallback(async () => {
    if (!editorInstance.current || isRefining) return;
    try {
      const data = await editorInstance.current.save();

      // Ensure there's actual text content to refine
      const hasContent =
        data.blocks &&
        data.blocks.some((b) => {
          if (b.type === "list") return b.data.items && b.data.items.length > 0;
          const text = b.data.text || b.data.caption || "";
          const stripped = text.replace(/<[^>]*>?/gm, "").trim();
          return stripped.length > 0;
        });

      if (!hasContent) {
        showToast("Editor is empty. Add text to refine.", "warning");
        return;
      }

      setIsRefining(true);
      showToast("Neural Forge Active: Refining Draft...", "info");

      const refinedBlocks = await api.refineNotes({ blocks: data.blocks });
      if (refinedBlocks) {
        editorInstance.current.render({ blocks: refinedBlocks });
        await api.saveNotes({ blocks: refinedBlocks });
        showToast("Neural Correction Applied", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Neural Forge Interrupted: " + e.message, "error");
    } finally {
      setIsRefining(false);
    }
  }, [isRefining, showToast, api]);

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
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-border/20 bg-surface">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent/10 text-accent rounded-[5px]">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[14px] font-black text-text tracking-tight">
              Neural synthesis
            </p>
            <p className="text-[9px] text-muted font-bold tracking-tight">
              Drafting laboratory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNeuralRefine}
            disabled={isRefining}
            className={`p-1.5 rounded-[5px] transition-all ${isRefining ? "bg-accent/20 text-accent cursor-wait" : "text-muted hover:text-accent hover:bg-accent/10"}`}
            title="Neural Forge: Polish Draft"
          >
            {isRefining ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-[5px] transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
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
            <div className="prose prose-invert prose-lg max-w-none editor-js-override">
              <div
                ref={editorContainerRef}
                id="editorjs"
                className="min-h-[200px]"
              />
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
