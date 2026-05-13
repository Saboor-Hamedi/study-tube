import React from "react";
import { Plus, ChevronUp } from "lucide-react";

/**
 * StreamControls - Unified Load More & Collapse System
 * Standardized for Library Vault and Research Archive
 */
export default function StreamControls({
  currentLimit,
  totalItems,
  onLoadMore,
  onCollapse,
  increment = 12,
  initialLimit = 6,
}) {
  const hasMore = totalItems > currentLimit;
  const canCollapse = currentLimit > initialLimit;

  if (!hasMore && !canCollapse) return null;

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {hasMore && (
          <button
            onClick={() => onLoadMore(increment)}
            className="h-8 px-5 flex items-center gap-2 bg-surface-2 border border-border/10 text-muted/60 hover:text-accent hover:border-accent/30 transition-all rounded-[5px] shadow-sm group"
          >
            <Plus className="h-2.5 w-2.5 group-hover:rotate-90 transition-all" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">
              Load
            </span>
          </button>
        )}
        
        {canCollapse && (
          <button
            onClick={() => onCollapse(initialLimit)}
            className="h-8 px-5 flex items-center bg-transparent border border-transparent hover:border-red-500/20 text-muted/30 hover:text-red-400 transition-all rounded-[5px]"
          >
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">
              Collapse
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
