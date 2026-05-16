import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RefreshCcw, AlertCircle, Loader2 } from "lucide-react";
import DeleteModal from "../research-vault/DeleteModal";

const LibraryTrash = ({ api, showToast, onRestore, onDeletePermanent }) => {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isPurgingAll, setIsPurgingAll] = useState(false);
  const [isRestoringAll, setIsRestoringAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      if (api?.loadVocab) {
        const vocab = await api.loadVocab(true);
        // Robust filter: handle both boolean and integer (0/1) flags
        const trashed = vocab.filter(
          (item) =>
            item.archived === 1 ||
            item.archived === true ||
            item.collection === "trash",
        );
        setTrashItems(trashed);
      }
    } catch (err) {
      console.error("Failed to load neural trash:", err);
      if (showToast) showToast("Trash Retrieval Failed", "error");
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const filteredItems = trashItems.filter(
    (item) =>
      item.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.videoTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleRestore = async (item) => {
    try {
      if (onRestore) {
        await onRestore(item);
        setTrashItems((prev) => prev.filter((i) => i.id !== item.id));
        if (showToast) showToast("Fragment Restored to Archive", "success");
      }
    } catch (err) {
      if (showToast) showToast("Restoration Failure", "error");
    }
  };

  const handleDelete = async (id) => {
    setItemToDelete(id);
  };

  return (
    <div className="flex flex-col h-full bg-surface p-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="pb-20 min-h-full flex flex-col">
          {/* Global Trash Actions */}
          {trashItems.length > 0 && (
            <div className="flex items-center justify-end gap-2 mb-3 px-2">
              <span className="text-[8px] text-muted/40 font-bold uppercase tracking-widest mr-auto">
                {trashItems.length} Decommissioned Nodes
              </span>
              <button
                onClick={() => setIsRestoringAll(true)}
                className="h-7 px-3 bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-accent/20 hover:bg-accent/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCcw className="h-2.5 w-2.5" />
                Recover
              </button>
              <button
                onClick={() => setIsPurgingAll(true)}
                className="h-7 px-3 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="h-2.5 w-2.5" />
                Delete
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex-1 py-20 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent/40" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted/40">
                Synchronizing Void...
              </span>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-auto min-h-[150px] flex flex-col transition-all duration-500 border rounded-[5px] overflow-hidden border-border/10 bg-surface-2/50 group hover:border-red-500/20 transition-all cursor-pointer relative shadow-sm"
                  >
                    {/* Body: Content & Context */}
                    <div className="p-3 flex-1 flex flex-col gap-2 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-3 w-3 text-red-500 shrink-0 opacity-40" />
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted truncate opacity-60">
                          Decommissioned Node
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h4 className="text-[12px] font-black text-text leading-snug group-hover:text-red-500 transition-colors line-clamp-2">
                          {item.text || "Neural Fragment"}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-black text-muted/40 uppercase tracking-widest">
                            {item.date || "Unknown Date"}
                          </span>
                          {item.videoTitle && (
                            <span className="text-[7px] font-black text-red-500/40 uppercase tracking-widest truncate">
                              • {item.videoTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Beautiful Slim Footer */}
                    <div className="px-3 py-1.5 bg-red-500/5 border-t border-red-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[6px] font-black text-red-500/30 uppercase tracking-[0.2em]">
                          Disposal Stream
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Beautiful Small Score Badge (if exists) */}
                        {(item.band ||
                          item.metadata?.band ||
                          item.diagnostics?.ielts) && (
                          <span className="flex items-center gap-1 text-[8px] font-black text-red-500 bg-red-500/5 px-1.5 py-0.5 border border-red-500/10 uppercase tracking-widest rounded-[2px]">
                            B
                            {item.band ||
                              item.metadata?.band ||
                              item.diagnostics?.ielts}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 border-l border-border/10 pl-3">
                          <button
                            onClick={() => handleRestore(item)}
                            className="p-1 text-accent hover:text-accent/80 transition-all"
                            title="Restore Fragment"
                          >
                            <RefreshCcw className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-500 hover:text-red-400 transition-all"
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1 py-20 flex flex-col items-center justify-center text-center space-y-3 opacity-20">
              <Trash2 className="h-12 w-12 text-muted" />
              <div className="space-y-1 mx-auto">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">
                  The Void is Empty
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Permanent Erasure"
        message="This fragment will be purged from existence. Recover is impossible."
        onConfirm={async () => {
          if (itemToDelete) {
            await onDeletePermanent(itemToDelete);
            setTrashItems((prev) =>
              prev.filter((item) => item.id !== itemToDelete),
            );
          }
          setItemToDelete(null);
        }}
      />

      <DeleteModal
        isOpen={isRestoringAll}
        onClose={() => setIsRestoringAll(false)}
        title="Global Restoration"
        message="Return ALL decommissioned research nodes to the active library?"
        confirmLabel="Execute Restore"
        variant="info"
        onConfirm={async () => {
          for (const item of trashItems) {
            await onRestore(item);
          }
          setTrashItems([]);
          setIsRestoringAll(false);
        }}
      />

      <DeleteModal
        isOpen={isPurgingAll}
        onClose={() => setIsPurgingAll(false)}
        title="Global Decommission"
        message="Erase ALL decommissioned research nodes? This protocol is final."
        confirmLabel="Confirm Purge"
        variant="danger"
        onConfirm={async () => {
          for (const item of trashItems) {
            if (api?.deleteVocabItem) {
              await api.deleteVocabItem(item.id);
            }
          }
          setTrashItems([]);
          setIsPurgingAll(false);
          if (showToast) showToast("Neural Vault Purged", "success");
        }}
      />
    </div>
  );
};

export default LibraryTrash;
