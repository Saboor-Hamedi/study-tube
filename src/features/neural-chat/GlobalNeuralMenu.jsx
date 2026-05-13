import { motion } from "framer-motion";
import { Pencil, X, Save, Plus } from "lucide-react";

export default function GlobalNeuralMenu({
  onOpenCapture,
  stats,
  isCopilotOpen,
  isCaptureOpen,
  view,
  isCollapsed,
  // Card Detail Props
  isEditing,
  onEdit,
  onSave,
  onClose,
}) {
  const sidebarOffset = !isCopilotOpen ? 70 : isCollapsed ? 70 : 395;

  return (
    <motion.div
      initial={false}
      animate={{
        right: sidebarOffset,
        top: "50%",
        translateY: "-50%",
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed z-[250] flex flex-col items-end gap-2 p-1.5 bg-background/40 backdrop-blur-md rounded-[8px] border border-border/10 shadow-2xl"
    >
      {onEdit && (
        <>
          {isEditing ? (
            <button
              onClick={onSave}
              className="p-1.5 bg-emerald-500 text-white hover:brightness-110 transition-all rounded-[4px] shadow-sm"
              title="Save Synthesis"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={onEdit}
              className="p-1.5 bg-surface-3 border border-border/10 text-muted hover:text-text hover:bg-surface transition-all rounded-[4px] shadow-sm"
              title="Edit Insight"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}

      <button
        onClick={onOpenCapture}
        className="p-1.5 rounded-[4px] bg-[var(--accent)] flex items-center justify-center shadow-sm border border-white/10 relative overflow-visible hover:brightness-110 transition-all"
        title="Forge Insight"
      >
        <Plus className="h-3.5 w-3.5 text-white" />

        {stats?.total > 0 && !onEdit && (
          <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[var(--success)] text-white text-[7px] font-black rounded-full border border-[var(--background)] flex items-center justify-center shadow-lg">
            {stats.total}
          </div>
        )}
      </button>

      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 bg-surface-3 border border-border/10 text-muted hover:text-red-500 hover:bg-red-500/10 transition-all rounded-[4px] shadow-sm"
          title="Close View"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
