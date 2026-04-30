import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, RefreshCcw, Search, Trash,
  AlertCircle, ChevronRight
} from "lucide-react";
import DeleteModal from "../research-vault/DeleteModal";

export default function LibraryTrash({ api, onRestore, onDeletePermanent }) {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isPurgingAll, setIsPurgingAll] = useState(false);
  const [isRestoringAll, setIsRestoringAll] = useState(false);

  const loadTrash = async () => {
    setLoading(true);
    try {
      // Use the paginated loader with 'trash' criteria
      const items = await api.loadVocabPage({ 
        collection: 'trash', 
        limit: 100,
        sortBy: 'newest'
      });
      setTrashItems(items || []);
    } catch (err) {
      console.error("Trash load failure", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const filteredItems = trashItems.filter(item => 
    item.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestore = async (item) => {
    try {
      await onRestore(item);
      setTrashItems(prev => prev.filter(p => p.id !== item.id));
    } catch (err) {
      console.error("Restore failure", err);
    }
  };

  const handleDelete = async (id) => {
    setItemToDelete(id);
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* HEADER: INDUSTRIAL AUDIT STYLE */}
      <div className="h-20 px-12 border-b border-border/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-500/10 rounded-[4px]">
            <Trash2 className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-text tracking-tight uppercase">Neural Trash</h2>
            <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Decommissioned Research Fragments</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {trashItems.length > 0 && (
            <>
              <button 
                onClick={() => setIsRestoringAll(true)}
                className="h-8 px-4 bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-accent/20 hover:bg-accent/20 transition-all flex items-center gap-2"
              >
                <RefreshCcw className="h-3 w-3" />
                Restore All
              </button>
              <button 
                onClick={() => setIsPurgingAll(true)}
                className="h-8 px-4 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Purge Vault
              </button>
            </>
          )}
          <button 
            onClick={loadTrash}
            className="p-2 hover:bg-surface-3 text-muted hover:text-text rounded-[4px] transition-all"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CONTENT: ALIGNED WITH LIBRARY VAULT STYLE */}
      <div className="flex-1 overflow-y-auto p-8 custom-scroll">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent/40" />
             <span className="text-[9px] font-black uppercase tracking-widest text-muted/40">Synchronizing Void...</span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between p-5 bg-surface border border-border hover:border-accent/40 transition-all rounded-[10px] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500/10 group-hover:bg-red-500/60 transition-colors" />

                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center shrink-0">
                      <Trash2 className="h-5 w-5 text-muted group-hover:text-red-500 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-black text-text tracking-tight group-hover:text-accent transition-colors uppercase">
                        {item.text || "Neural Fragment"}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                          {item.videoTitle || "Unknown Source"}
                        </span>
                        <span className="text-[10px] text-muted">•</span>
                        <span className="text-[10px] text-muted font-medium italic">
                          {item.date || "Unknown Date"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleRestore(item)}
                        className="h-7 px-3 bg-accent/5 text-accent text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-accent/10 hover:bg-accent/10 transition-all flex items-center gap-1.5"
                        title="Restore Fragment"
                      >
                        <RefreshCcw className="h-2.5 w-2.5" />
                        Restore
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="h-7 px-3 bg-red-500/5 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-red-500/10 hover:bg-red-500/10 transition-all flex items-center gap-1.5"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Erase
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <DeleteModal 
              isOpen={!!itemToDelete}
              onClose={() => setItemToDelete(null)}
              title="Permanent Erasure"
              message="This fragment will be purged from existence. Recover is impossible."
              onConfirm={async () => {
                if (itemToDelete) {
                  await onDeletePermanent(itemToDelete);
                  setTrashItems(prev => prev.filter(item => item.id !== itemToDelete));
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
                  await api.deleteVocabItem(item.id);
                }
                setTrashItems([]);
                setIsPurgingAll(false);
              }}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
            <Trash className="h-16 w-16 mb-6 font-thin" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-black uppercase tracking-[0.4em]">Entropy Zero</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em]">All fragments purged or restored</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
