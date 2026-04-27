import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function GlobalNeuralMenu({
  onOpenCapture,
  stats,
  isCopilotOpen,
  isCaptureOpen,
  view,
  isCollapsed,
}) {
  const isSidebarView = view === "editor" || view === "research-detail";

  // Width logic: only matters if Copilot is open
  let copilotWidth = 0;
  if (isSidebarView) {
    copilotWidth = isCollapsed ? 52 : 320;
  } else {
    copilotWidth = 340;
  }

  return (
    <motion.div
      initial={false}
      animate={{
        // Only shift LEFT if Copilot is open
        right: isCopilotOpen ? copilotWidth + 16 : 10,
        // Only shift UP if Copilot is open (to avoid blocking input)
        // If only Capture modal is open, we can move up a little or stay down
        bottom: isCopilotOpen ? 110 : isCaptureOpen ? 80 : 50,
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed z-[250] flex flex-col items-end"
    >
      <motion.button
        onClick={onOpenCapture}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-9 h-9 rounded-[8px] bg-[var(--accent)] flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] border border-white/10 relative overflow-visible"
        title="Forge Insight"
      >
        <Plus className="h-4 w-4 text-white" />

        {stats?.total > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[var(--success)] text-white text-[7px] font-black rounded-full border border-[var(--background)] flex items-center justify-center shadow-lg">
            {stats.total}
          </div>
        )}
      </motion.button>
    </motion.div>
  );
}
