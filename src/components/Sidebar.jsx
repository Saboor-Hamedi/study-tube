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
    { id: "vocab", name: "Research Vault", icon: Library },
    { id: "editor", name: "Analytical Writing", icon: FileText },
    { id: "grammar", name: "Grammar Lab", icon: GraduationCap },
    { id: "ai-detection", name: "AI Detection", icon: Cpu },
    { id: "plagiarism", name: "Plagiarism", icon: Hash },
    { id: "report", name: "System Report", icon: BarChart2 },
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
        <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-3 space-y-8`}>
          
          {/* Primary Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Navigation</p>
              </div>
            )}
            {navItems.map((item) => {
              const active = view === item.id;
              return (
                <div key={item.id} className="group relative flex justify-center">
                  {!isCollapsed && active && (
                    <div className="absolute left-0 w-[1.5px] h-3 top-1/2 -translate-y-1/2 bg-accent opacity-100" />
                  )}
                  <button
                    onClick={() => setView?.(item.id)}
                    className={`flex items-center transition-all duration-200 text-left shrink-0 ${
                      isCollapsed
                        ? `w-10 h-10 justify-center rounded-full border-0 ${active ? "bg-accent/10 text-accent" : "text-muted/40 hover:bg-surface-3 hover:text-text"}`
                        : `w-full gap-3 px-3 py-2 rounded-[5px] border border-transparent ${active ? "bg-accent/10 text-accent font-bold" : "text-muted hover:bg-surface-3 hover:text-text"}`
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : "opacity-40 group-hover:opacity-100"}`} />
                    {!isCollapsed && <span className="text-[11px] font-black truncate flex-1">{item.name}</span>}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[10px] font-black opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[120]">
                        {item.name}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Collections Section */}
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Collections</p>
                <button 
                  onClick={() => setIsCreatingCollection(true)}
                  className="p-1 h-5 w-5 flex items-center justify-center bg-surface-3 hover:bg-accent hover:text-white text-muted transition-all duration-300 rounded-sm"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="space-y-1">
              {collections.map((c) => (
                <DroppableFolder 
                  key={c}
                  id={c}
                  isCollapsed={isCollapsed}
                  active={selectedCollection === c}
                  onClick={() => {
                    setSelectedCollection?.(c);
                    if (view !== 'vocab') setView?.('vocab');
                  }}
                  count={getCount(c)}
                />
              ))}
            </div>

            {isCreatingCollection && !isCollapsed && (
              <div className="mx-1 mt-2 p-2 border border-accent/20 bg-accent/[0.02] rounded-sm">
                <input 
                  autoFocus
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCollection(newCollectionName)}
                  placeholder="New collection..."
                  className="w-full bg-background border border-border px-2 py-1.5 text-[10px] text-text outline-none focus:border-accent/30 transition-all"
                />
                <div className="flex gap-1 mt-2">
                  <button 
                    onClick={() => handleCreateCollection(newCollectionName)} 
                    className="flex-1 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all rounded-sm"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => setIsCreatingCollection(false)} 
                    className="px-3 py-1 bg-surface-3 text-muted text-[9px] font-black uppercase tracking-widest hover:text-text transition-all border border-border rounded-sm"
                  >
                    X
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <SidebarFooter isCollapsed={isCollapsed} setView={setView} />
      </div>
    </motion.div>
  );
}
