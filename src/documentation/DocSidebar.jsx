import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Library, 
  Search, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Zap,
  Target,
  Brain,
  Layers,
  FileText,
  ChevronDown,
  Info
} from "lucide-react";

const DocSidebar = ({ 
  docs, 
  currentIndex, 
  onSelect, 
  searchQuery, 
  setSearchQuery 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 800);
  const [expandedGroups, setExpandedGroups] = useState(["system", "guides", "api", "misc"]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 800) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const getRuleIcon = (name, index) => {
    const n = name.toLowerCase();
    if (n.includes("introduction")) return <Layers className="h-3.5 w-3.5" />;
    if (n.includes("ai-detection")) return <Brain className="h-3.5 w-3.5" />;
    if (n.includes("plagiarism")) return <Search className="h-3.5 w-3.5" />;
    if (n.includes("grammar")) return <FileText className="h-3.5 w-3.5" />;
    if (n.includes("infrastructure")) return <Zap className="h-3.5 w-3.5" />;
    if (n.includes("roadmap")) return <Target className="h-3.5 w-3.5" />;
    
    return <Info className="h-3.5 w-3.5" />;
  };

  // Define Hierarchy
  const groupedDocs = useMemo(() => {
    const categories = [
      { id: "system", name: "System Core", items: ["introduction.md"] },
      { id: "guides", name: "Usage Guides", prefix: "guide-" },
      { id: "api", name: "Technical API", prefix: "api-" },
      { id: "misc", name: "General Docs", prefix: "system-" }
    ];

    const result = categories.map(cat => {
      const children = docs.filter(d => {
        const name = d.name.toLowerCase();
        if (cat.items?.includes(name)) return true;
        if (cat.prefix && name.startsWith(cat.prefix)) return true;
        return false;
      });
      return { ...cat, children };
    });

    // Handle any leftovers
    const allCategorized = result.flatMap(c => c.children.map(ch => ch.name));
    const uncategorized = docs.filter(d => !allCategorized.includes(d.name));
    
    if (uncategorized.length > 0) {
      // Find the "General Docs" group or create one
      const miscIdx = result.findIndex(r => r.id === "misc");
      if (miscIdx !== -1) {
        result[miscIdx].children = [...result[miscIdx].children, ...uncategorized];
      } else {
        result.push({ id: "misc", name: "General Docs", children: uncategorized });
      }
    }

    // Filter out empty categories and return in strictly defined order
    return result.filter(r => r.children.length > 0);
  }, [docs]);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 52 : 300 }}
      className="bg-surface-2 flex flex-col border-l border-border h-full shrink-0 relative transition-colors duration-500 z-20"
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 w-6 h-6 bg-surface-3 border border-border rounded-full flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-all z-[150] shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Header */}
      {!isCollapsed && (
        <div className="h-12 px-6 flex items-center gap-3 shrink-0">
          <Library className="h-3.5 w-3.5 text-accent" />
          <h2 className="text-[11px] font-black tracking-tight uppercase select-text cursor-text">
            System Docs
          </h2>
        </div>
      )}
      {isCollapsed && (
        <div className="h-12 flex items-center justify-center shrink-0">
          <Library className="h-4 w-4 text-accent" />
        </div>
      )}

      {/* Search Layer */}
      <div className={`px-3 mb-4 ${isCollapsed ? "flex justify-center" : ""}`}>
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-3 text-muted hover:text-accent transition-all"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full bg-surface-3 border border-border/60 py-1.5 pl-8 pr-3 text-[11px] text-text outline-none focus:border-accent/40 transition-all rounded-[5px] select-text cursor-text"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted group-focus-within:text-accent transition-colors" />
          </div>
        )}
      </div>

      {/* Hierarchical Doc List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {groupedDocs.map((group) => (
          <div key={group.id} className="space-y-1">
            {!isCollapsed && (
              <button 
                onClick={() => toggleGroup(group.id)}
                className="w-full px-2 mb-2 flex items-center justify-between group/header"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20 group-hover/header:text-muted/40 transition-colors">
                  {group.name}
                </p>
                <ChevronDown className={`h-2.5 w-2.5 text-muted/20 transition-transform ${expandedGroups.includes(group.id) ? "" : "-rotate-90"}`} />
              </button>
            )}

            <AnimatePresence initial={false}>
              {(expandedGroups.includes(group.id) || isCollapsed) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {group.children.map((d) => {
                    const globalIdx = docs.indexOf(d);
                    const active = currentIndex === globalIdx;
                    return (
                      <div key={d.name} className="group relative flex justify-center">
                        {!isCollapsed && active && (
                          <div className="absolute left-0 w-[1.5px] h-3 top-1/2 -translate-y-1/2 bg-accent opacity-100" />
                        )}
                        
                        <button
                          onClick={() => onSelect(globalIdx)}
                          className={`flex items-center transition-all duration-200 text-left shrink-0 ${
                            isCollapsed
                              ? `w-10 h-10 justify-center rounded-full border-0 ${active ? "bg-accent/10 text-accent" : "text-muted/40 hover:bg-surface-3 hover:text-text"}`
                              : `w-full gap-3 px-3 py-2 rounded-[5px] border border-transparent ${active ? "bg-accent/10 text-accent font-black shadow-sm" : "text-muted hover:bg-surface-3 hover:text-text"}`
                          }`}
                        >
                          <div className={`shrink-0 ${active ? "text-accent" : "opacity-40 group-hover:opacity-100"}`}>
                            {getRuleIcon(d.name, globalIdx)}
                          </div>
                          
                          {!isCollapsed && (
                            <span className="text-[10px] font-black truncate flex-1 uppercase tracking-tight">
                              {d.name.replace(".md", "").replace(/-/g, " ")}
                            </span>
                          )}

                          {isCollapsed && (
                            <div className="absolute right-full mr-4 px-3 py-1.5 bg-text text-background text-[10px] font-black opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[200] uppercase tracking-widest">
                              {d.name.replace(".md", "").replace(/-/g, " ")}
                            </div>
                          )}

                          {!isCollapsed && active && (
                            <CheckCircle className="h-2.5 w-2.5 text-accent shrink-0" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {docs.length === 0 && !isCollapsed && (
          <div className="py-12 text-center opacity-10">
            <Library className="h-6 w-6 mx-auto mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest">Empty</p>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      {!isCollapsed && (
        <div className="px-5 py-3 border-t border-border bg-surface-3 h-[40px] flex items-center justify-between shrink-0">
          <span className="text-[8px] font-black text-muted/30 uppercase tracking-[0.2em]">
            System Nodes
          </span>
          <span className="text-[10px] font-black text-accent tabular-nums">
            {docs.length}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default DocSidebar;
