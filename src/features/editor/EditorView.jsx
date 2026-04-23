import { useEffect, useRef, useState, useCallback } from "react";
import EditorJS from "@editorjs/editorjs";
import { useStore } from "./../../store/useStore";
import "./../../editor.css";
import { FileText, Save, Trash2, Loader2, Sparkles } from "lucide-react";
import DeleteModal from "../research-vault/DeleteModal";

// Import Tools
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import Marker from "@editorjs/marker";

export default function EditorView({ api, showToast }) {
  const { isCopilotOpen, setCopilotContext } = useStore();
  const editorInstance = useRef(null);
  const isInitializingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const autoSaveTimer = useRef(null);
  const isCopilotOpenRef = useRef(isCopilotOpen);

  useEffect(() => {
    isCopilotOpenRef.current = isCopilotOpen;
  }, [isCopilotOpen]);

  useEffect(() => {
    const initEditor = async () => {
      if (editorInstance.current || isInitializingRef.current) return;
      isInitializingRef.current = true;

      // Load existing notes from JSON
      let savedData = {};
      try {
        savedData = await api.loadNotes();
      } catch (e) {
        console.error("Failed to load neural notes", e);
      }

      const editor = new EditorJS({
        holder: "editorjs",
        placeholder:
          "Protocol: Initializing neural drafting... (Click to type)",
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: { defaultStyle: "unordered" },
          },
          checklist: { class: Checklist, inlineToolbar: true },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: "Insert Quote",
              captionPlaceholder: "Source",
            },
          },
          code: Code,
          marker: Marker,
        },
        data: (savedData && Array.isArray(savedData.blocks)) ? savedData : { blocks: [] },
        onReady: () => {
          setIsInitializing(false);
          // Explicitly enable spellcheck on the contenteditable area
          const holder = document.getElementById("editorjs");
          if (holder) {
            const editorBody = holder.querySelector(
              '.ce-paragraph, .ce-header, [contenteditable="true"]',
            );
            if (editorBody) editorBody.setAttribute("spellcheck", "true");
          }
          console.log("[SYSTEM] Editor.js Interface Stabilized");
        },
        onChange: () => {
          // Debounced Auto-Save Engine
          if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
          autoSaveTimer.current = setTimeout(async () => {
            if (
              editorInstance.current &&
              typeof editorInstance.current.save === "function"
            ) {
              try {
                const data = await editorInstance.current.save();
                await api.saveNotes(data);
                if (isCopilotOpenRef.current) {
                  syncToCopilot(data.blocks);
                }
                console.log("[AUTO-SYNC] Research session persisted");
              } catch (e) {
                console.warn("[AUTO-SYNC] Persistence interrupted", e);
              }
            }
          }, 3000); // Auto-save after 3 seconds of inactivity
        },
      });

      editorInstance.current = editor;
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
  }, []);

  const handleNeuralRefine = async () => {
    if (!editorInstance.current || isRefining) return;

    if (!api || typeof api.refineNotes !== "function") {
      showToast("Neural Bridge Not Ready: Restart App", "error");
      return;
    }

    setIsRefining(true);
    showToast("Neural Forge: Analyzing grammar...", "accent");

    try {
      const currentData = await editorInstance.current.save();
      const refinedBlocks = await api.refineNotes({
        blocks: currentData.blocks,
      });

      if (refinedBlocks && refinedBlocks.length > 0) {
        editorInstance.current.render({ blocks: refinedBlocks });
        await api.saveNotes({ blocks: refinedBlocks });
        showToast("Draft Polished & Synchronized", "success");
      }
    } catch (error) {
      console.error("Refinement failed:", error);
      showToast("Neural Forge Interrupted", "error");
    } finally {
      setIsRefining(false);
    }
  };

  // Global Command Stream Listeners
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
        console.error("Failed to apply correction", e);
        showToast("Correction Application Failed", "error");
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

  // Context Awareness Loop
  const syncToCopilot = useCallback(
    async (blocks) => {
      if (!setCopilotContext) return;
      try {
        // Format blocks for AI comprehension
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
    if (!isCopilotOpen || !editorInstance.current) return;
    editorInstance.current.save().then((data) => syncToCopilot(data.blocks));
  }, [isCopilotOpen, syncToCopilot]);

  useEffect(() => {
    if (!api || typeof api.onRefineTrigger !== "function") return;
    const cleanup = api.onRefineTrigger(() => {
      handleNeuralRefine();
    });
    return cleanup;
  }, [handleNeuralRefine, api]);

  const handleClear = async () => {
    if (!editorInstance.current) return;

    // Safety Bridge Check
    if (api && typeof api.saveNotes === "function") {
      try {
        await api.saveNotes({ blocks: [] });
      } catch (e) {
        console.error("Failed to clear remote notes", e);
      }
    }

    try {
      if (
        editorInstance.current.blocks &&
        typeof editorInstance.current.blocks.clear === "function"
      ) {
        editorInstance.current.blocks.clear();
      } else {
        editorInstance.current.render({ blocks: [] });
      }
    } catch (e) {
      console.warn("UI Clear error", e);
    }

    setShowDeleteModal(false);
    showToast("Editor Cleared");
  };

  return (
    <div className={`flex flex-row h-full bg-background animate-in fade-in duration-500 overflow-hidden transition-all duration-500`}>
      {/* Editor Container */}
      <div className={`flex-1 overflow-y-auto scrollbar-thin px-8 py-10 transition-all duration-500 relative ${isCopilotOpen ? 'lg:pr-6 lg:pl-8' : 'lg:px-16 xl:px-24'}`}>
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
                Synchronizing Neural Workspace...
              </span>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-12 opacity-30">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              Neural Text Interface
            </span>
          </div>

          <div
            className="prose prose-invert prose-lg max-w-none 
            prose-p:text-text/90 prose-p:leading-relaxed 
            prose-headings:text-text prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider
            editor-js-override"
          >
            <div id="editorjs" className="min-h-[200px]" />
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleClear}
        title="Erase Neural Notes"
        message="This action will permanently purge all blocks from the current research editor. This cannot be undone."
      />
    </div>
  );
}
