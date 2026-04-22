import {
  Search,
  BookOpen,
  Settings,
  Sparkles,
  FileDown,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Activitybar({
  view,
  setView,
  onExport,
  theme,
  onToggleTheme,
}) {
  const mainTabs = [
    { id: "search", label: "Discover", icon: Search },
    { id: "vocab", label: "Library", icon: BookOpen },
    { id: "editor", label: "Research Editor", icon: FileText },
    { id: "copilot", label: "Research Assist", icon: Sparkles },
  ];

  const bottomTabs = [{ id: "settings", label: "Settings", icon: Settings }];

  const renderTab = (tab) => {
    const active = view === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => setView(tab.id)}
        className={`relative w-12 h-12 flex items-center justify-center  transition-all duration-300 group ${active ? "bg-accent/10 text-accent" : "text-muted/40 hover:bg-surface-2 hover:text-text"}`}
      >
        <tab.icon className="h-5 w-5 transition-transform group-hover:scale-110" />

        {/* Active Indicator Line */}
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-2 w-0.5 h-8 bg-accent"
          />
        )}

        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-bold uppercase tracking-widest  opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-50">
          {tab.label}
        </div>
      </button>
    );
  };

  return (
    <div className="w-[68px] h-full shrink-0 bg-surface-3 border-r border-border flex flex-col items-center pt-1 pb-6 relative z-[100] transition-colors duration-500">
      <div className="flex flex-col gap-6 w-full items-center">
        {mainTabs.map(renderTab)}
      </div>

      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        <button
          onClick={onToggleTheme}
          className="relative w-12 h-12 flex items-center justify-center  transition-all duration-300 group text-muted/40 hover:bg-accent/10 hover:text-accent border border-transparent hover:border-accent/20"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-bold uppercase tracking-widest  opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-50">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </div>
        </button>

        <button
          onClick={onExport}
          className="relative w-12 h-12 flex items-center justify-center  transition-all duration-300 group text-muted/40 hover:bg-accent/10 hover:text-accent border border-transparent hover:border-accent/20"
        >
          <FileDown className="h-5 w-5" />
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-bold uppercase tracking-widest  opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-50">
            Export Dossier
          </div>
        </button>
        {bottomTabs.map(renderTab)}
      </div>
    </div>
  );
}
