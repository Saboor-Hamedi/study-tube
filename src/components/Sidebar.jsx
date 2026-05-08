import {
  Plus,
  Library,
  FileText,
  Maximize2,
  Trash2,
  Pencil,
  Check,
  Brain,
  ChevronLeft,
  ChevronRight,
  Hash,
  Folder,
  Calendar,
  Type,
  Star,
  Search,
  Settings,
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
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";

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
  const [pinnedItems, setPinnedItems] = useState([]);

  const handleCollectionSelect = (id) => {
    setSelectedCollection?.(id);
    if (view !== "vocab") {
      setView?.("vocab");
    }
  };

  const startRename = (name) => {
    setRenamingId(name);
    setNewCollectionName("");
    setRenamingValue(name);
  };

  const submitRename = () => {
    if (renamingValue.trim() && renamingValue !== renamingId) {
      handleRenameCollection?.(renamingId, renamingValue.trim());
    }
    setRenamingId(null);
  };

  const getCount = (id) => {
    if (!stats) return "...";
    if (id === "all") return stats.all || 0;
    if (id === "trash") return stats.trash || 0;
    const c = stats.collections?.find((c) => c.name === id);
    return c ? c.count : 0;
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 52 : 208 }}
      className={`h-full ${side === "left" ? "border-r" : "border-l"} border-border bg-surface-2 flex flex-col relative transition-colors duration-500`}
    >
      {/* Structural Toggle Hub - Elevated for zero-collision navigation */}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-3 transition-all duration-300 ${isCollapsed ? "space-y-4" : "space-y-8"}`}
        >
          {/* Main Navigation Hub */}
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="px-2">
                <p className="text-[10px] font-black text-muted/20">
                  Navigation
                </p>
              </div>
            )}
            <div className="space-y-1">
              {[
                { id: "home", name: "Home", icon: LayoutGrid },
                { id: "search", name: "Video Intel", icon: Search },
                { id: "vocab", name: "Research Vault", icon: Library },
                { id: "class", name: "My Class", icon: GraduationCap },
                { id: "editor", name: "Analytical Writing", icon: FileText },
                { id: "assignment", name: "Writing Assignment", icon: Pencil },
                { id: "review", name: "Review Assignment", icon: Check },
                { id: "grammar", name: "Grammar list", icon: GraduationCap },
                { id: "ai-detection", name: "AI Detection", icon: Cpu },
                { id: "plagiarism", name: "Plagiarism", icon: Hash },
                { id: "report", name: "Report", icon: BarChart2 },
              ].map((item) => {
                const active = view === item.id;
                return (
                  <div
                    key={item.id}
                    className="group relative flex justify-center"
                  >
                    {!isCollapsed && (
                      <div
                        className={`absolute left-0 w-[1.5px] h-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${active ? "bg-blue-400 opacity-100" : "bg-transparent opacity-0"}`}
                      />
                    )}
                    <button
                      onClick={() => setView?.(item.id)}
                      style={
                        isCollapsed ? { width: "40px", height: "40px" } : {}
                      }
                      className={`flex items-center transition-all duration-200 text-left shrink-0 ${
                        isCollapsed
                          ? `justify-center rounded-full border-0 ${active ? "bg-blue-500/10 text-blue-400" : "text-muted/40 hover:bg-surface-3 hover:text-text"}`
                          : `w-full gap-3 px-3 py-2 rounded-[5px] border border-transparent ${active ? "bg-blue-500/10 text-blue-400 font-bold" : "text-muted hover:bg-surface-3 hover:text-text"}`
                      }`}
                    >
                      <item.icon
                        className={`h-3.5 w-3.5 shrink-0 ${active ? "text-blue-400" : "opacity-40 group-hover:opacity-100"}`}
                      />
                      {!isCollapsed && (
                        <span className="text-[11px] font-black truncate flex-1">
                          {item.name}
                        </span>
                      )}
                      {isCollapsed && (
                        <div
                          className={`absolute ${side === "left" ? "left-full ml-4" : "right-full mr-4"} px-3 py-1.5 bg-text text-background text-[10px] font-black opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[120]`}
                        >
                          {item.name}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collections & Folders */}
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="px-2 flex items-center justify-between group/title">
                <p className="text-[10px] font-black text-muted/20 uppercase tracking-widest">
                  Collections
                </p>
                <button
                  onClick={() => setIsCreatingCollection(true)}
                  className="p-1 hover:bg-accent/10 text-muted/20 hover:text-accent transition-all rounded-[3px]"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            )}

            <div className="space-y-1">
              {/* Special Folders */}
              {[
                { id: "all", name: "All Research", icon: Library },
                { id: "__neural_drafts__", name: "Neural Archive", icon: Brain },
                { id: "trash", name: "Trash", icon: Trash2 },
              ].map((folder) => {
                const active = selectedCollection === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleCollectionSelect(folder.id)}
                    className={`w-full group relative flex items-center transition-all duration-200 px-3 py-2 rounded-[5px] border border-transparent ${active ? "bg-accent/5 text-accent font-bold" : "text-muted hover:bg-surface-3 hover:text-text"}`}
                  >
                    <folder.icon
                      className={`h-3.5 w-3.5 shrink-0 mr-3 ${active ? "text-accent" : "opacity-40 group-hover:opacity-100"}`}
                    />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="text-[11px] font-black truncate">
                          {folder.name}
                        </span>
                        <span className="text-[9px] font-mono opacity-30 group-hover:opacity-100">
                          {getCount(folder.id)}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="h-px bg-border/5 mx-2 my-2" />

              {/* User Collections */}
              {collections?.map((name) => (
                <DroppableFolder
                  key={name}
                  id={name}
                  active={selectedCollection === name}
                  onClick={() => handleCollectionSelect(name)}
                  isCollapsed={isCollapsed}
                >
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="text-[11px] font-black truncate">
                      {name}
                    </span>
                    <span className="text-[9px] font-mono opacity-30 group-hover:opacity-100">
                      {getCount(name)}
                    </span>
                  </div>
                </DroppableFolder>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`px-3 border-t border-border bg-surface-3 transition-colors duration-500 flex flex-col justify-center h-[72px] ${isCollapsed ? "items-center" : ""}`}
        >
          <div className="flex flex-col gap-1 w-full">
            <button
              onClick={() => setView("settings")}
              style={isCollapsed ? { width: "40px", height: "40px" } : {}}
              className={`flex items-center transition-all duration-200 text-left ${
                isCollapsed
                  ? "justify-center rounded-full text-muted/40 hover:bg-surface-2 hover:text-text"
                  : "w-full gap-3 px-3 py-2 rounded-[5px] text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              {!isCollapsed && (
                <span className="text-[11px] font-black">Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
