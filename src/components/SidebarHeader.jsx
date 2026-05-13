import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SidebarHeader({ isCollapsed, setIsCollapsed, side }) {
  return (
    <button
      onClick={() => setIsCollapsed(!isCollapsed)}
      className={`absolute ${side === "left" ? "-right-3" : "-left-3"} top-4 w-6 h-6 bg-surface-3 border border-border rounded-full flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-all z-[150] shadow-xl`}
    >
      {isCollapsed ? (
        side === "left" ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )
      ) : side === "left" ? (
        <ChevronLeft className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </button>
  );
}
