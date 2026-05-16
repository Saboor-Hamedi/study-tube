import {
  Plus,
  Library,
  FileText,
  Maximize2,
  Trash2,
  Pencil,
  Check,
  Brain,
  Hash,
  Folder,
  Calendar,
  Type,
  Star,
  Search,
  Sun,
  Moon,
  FileDown,
  GraduationCap,
  User as UserIcon,
  BarChart2,
  Cpu,
  ClipboardCheck,
  LayoutGrid,
} from "lucide-react";
import { DroppableFolder } from "../features/research-vault/DraggableCard";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";

export default function Sidebar({
  view,
  setView,
  collections,
  selectedCollection,
  setSelectedCollection,
  handleDeleteCollection,
  handleRenameCollection,
  handleCreateCollection,
  isCreatingCollection,
  setIsCreatingCollection,
  newCollectionName,
  setNewCollectionName,
  showTrash = false,
  stats,
  sortBy,
  setSortBy,
  side = "left",
  onExport,
  theme,
  onToggleTheme,
}) {
  const {
    isSidebarCollapsed: isCollapsed,
    setIsSidebarCollapsed: setIsCollapsed,
  } = useStore();
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 800) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    if (window.innerWidth <= 800) {
      setIsCollapsed(true);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  const getCount = (id) => {
    if (!stats) return "...";
    if (id === "all") return stats.all || 0;
    if (id === "trash") return stats.trash || 0;
    const c = stats.collections?.find((c) => c.name === id);
    return c ? c.count : 0;
  };

  const navItems = [
    { id: "home", name: "Home", icon: LayoutGrid },
    { id: "search", name: "Video Intel", icon: Search },
    { id: "class", name: "My Class", icon: GraduationCap },
    { id: "vocab", name: "Research Vault", icon: Library },
    { id: "editor", name: "Analytical Writing", icon: FileText },
    { id: "assignment", name: "Writing Assignment", icon: Pencil },
    { id: "review", name: "Review Assignment", icon: Check },
    { id: "grammar", name: "Grammar Lab", icon: GraduationCap },
    { id: "ai-detection", name: "AI Detection", icon: Cpu },
    { id: "plagiarism", name: "Plagiarism", icon: Hash },
    { id: "documentation", name: "System Docs", icon: Library },
    { id: "report", name: "Report", icon: BarChart2 },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 52 : 208 }}
      className={`h-full ${side === "left" ? "border-r" : "border-l"} border-border bg-surface-2 flex flex-col relative transition-colors duration-500`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        side={side}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-3 space-y-8`}
        >
          {/* Primary Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">
                  Navigation
                </p>
              </div>
            )}
            {navItems.map((item) => {
              const active = view === item.id;
              return (
                <div
                  key={item.id}
                  className="group relative flex justify-center"
                >
                  {!isCollapsed && active && (
                    <div className="absolute left-0 w-[1.5px] h-3 top-1/2 -translate-y-1/2 bg-accent opacity-100" />
                  )}
                  <button
                    onClick={() => setView?.(item.id)}
                    className={`flex items-center transition-all duration-200 text-left shrink-0 ${
                      isCollapsed
                        ? `w-10 h-10 justify-center rounded-full border-0  ${active ? "bg-accent/10 text-accent" : "text-muted/40 hover:bg-accent/10 hover:text-accent "}`
                        : `w-full gap-3 px-3 py-2 rounded-[5px] border border-transparent ${active ? "bg-accent/10 text-accent font-black bg-gray-200" : "text-muted hover:bg-gray-200 hover:text-accent"}`
                    }`}
                  >
                    <item.icon
                      className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : "opacity-40 group-hover:opacity-100"}`}
                    />
                    {!isCollapsed && (
                      <span className="text-[11px] font-black truncate flex-1">
                        {item.name}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-black opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[120] uppercase tracking-widest">
                        {item.name}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <SidebarFooter isCollapsed={isCollapsed} setView={setView} />
      </div>
    </motion.div>
  );
}
