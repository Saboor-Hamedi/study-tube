import React from "react";
import { Settings } from "lucide-react";

export default function SidebarFooter({ isCollapsed, setView, view }) {
  return (
    <div
      className={`px-3 border-t border-border bg-surface-3 transition-colors duration-500 flex flex-col justify-center h-[40px] ${isCollapsed ? "items-center" : ""}`}
    >
      <div className={`flex flex-col gap-1 ${isCollapsed ? "" : "w-full"}`}>
        <button
          onClick={() => setView("settings")}
          style={isCollapsed ? { width: "32px", height: "32px" } : {}}
          className={`flex items-center transition-all duration-200 text-left ${
            isCollapsed
              ? `justify-center rounded-full ${view === "settings" ? "bg-accent/10 text-accent" : "text-muted/40 hover:bg-accent/10 hover:text-accent"}`
              : `w-full gap-3 px-3 py-2 rounded-[5px] ${view === "settings" ? "bg-accent/10 text-accent font-black" : "text-muted hover:bg-accent/10 hover:text-accent"}`
          }`}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && (
            <span className="text-[11px] font-black">Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}
