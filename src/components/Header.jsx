import {
  Library,
  Search as SearchIcon,
  Loader2,
  ChevronLeft,
  RefreshCcw,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useShortcuts } from "../utils/useShortcuts";
import Dropdow from "../features/users/Dropdow";
import Notifications from "../features/notifications/Notifications";

export default function Header({
  view,
  setView,
  librarySearch,
  videoSearch,
  item,
  theme,
  onToggleTheme,
}) {
  // ATOMIC COMMAND CENTER
  useShortcuts(librarySearch);

  const getHeaderTitle = () => {
    if (view === "vocab") return "Library View";
    if (view === "search") return "Video View";
    if (view === "research-detail") return "Details View";
    if (view === "copilot") return "Copilot View";
    if (view === "settings") return "Settings View";
    if (view === "editor") return "Editor View";
    return "Research Studio";
  };

  return (
    <div className="w-full shrink-0 flex items-center justify-between px-8 py-2.5 border-b border-border bg-surface z-[100] transition-colors duration-500 relative">
      {/* Left Rail (Fixed Width for Balance) */}
      <div className="flex items-center gap-4 flex-1 min-w-[100px]">
        <h1 className="text-[18px] font-bold text-accent tracking-tight select-none truncate">
          StudyHub
        </h1>
      </div>

      {/* Centered Search Rail */}
      <div className="flex-[2] max-w-lg px-4 min-w-[280px] transition-all">
        {(view === "vocab" ||
          view === "research-detail" ||
          view === "editor" ||
          view === "grammar") &&
          librarySearch && (
            <div className="relative group">
              <input
                ref={librarySearch.searchInputRef}
                type="text"
                value={librarySearch.query}
                onFocus={() => {
                  librarySearch.setIsHistoryOpen(true);
                  if (librarySearch.syncHistory) librarySearch.syncHistory();
                }}
                onKeyDown={(e) => {
                  const items = librarySearch.query.trim()
                    ? librarySearch.results
                    : librarySearch.history;
                  if (e.key === "Enter") {
                    if (
                      librarySearch.isHistoryOpen &&
                      librarySearch.selectedIndex >= 0 &&
                      items[librarySearch.selectedIndex]
                    ) {
                      const item = items[librarySearch.selectedIndex];
                      if (typeof item === "string") {
                        librarySearch.setQuery(item);
                        librarySearch.setIsHistoryOpen(false);
                      } else {
                        librarySearch.onSelect(item);
                        librarySearch.setIsHistoryOpen(false);
                      }
                      librarySearch.setSelectedIndex(-1);
                    } else if (
                      librarySearch.query.trim() &&
                      librarySearch.results.length > 0
                    ) {
                      librarySearch.onSelect(librarySearch.results[0]);
                      librarySearch.setIsHistoryOpen(false);
                    } else {
                      librarySearch.setIsHistoryOpen(false);
                    }
                  }
                  if (
                    e.key === "ArrowDown" &&
                    librarySearch.isHistoryOpen &&
                    items.length > 0
                  ) {
                    e.preventDefault();
                    librarySearch.setSelectedIndex(
                      (prev) => (prev + 1) % items.length,
                    );
                  }
                  if (
                    e.key === "ArrowUp" &&
                    librarySearch.isHistoryOpen &&
                    items.length > 0
                  ) {
                    e.preventDefault();
                    librarySearch.setSelectedIndex(
                      (prev) => (prev - 1 + items.length) % items.length,
                    );
                  }
                  if (e.key === "Escape") {
                    librarySearch.setIsHistoryOpen(false);
                    librarySearch.setSelectedIndex(-1);
                    e.currentTarget.blur();
                  }
                }}
                onChange={(e) => {
                  librarySearch.setQuery(e.target.value);
                  if (!librarySearch.isHistoryOpen)
                    librarySearch.setIsHistoryOpen(true);
                  librarySearch.setSelectedIndex(-1);
                }}
                placeholder="Search neural archive... (Ctrl+F)"
                className="w-full bg-surface-2/50 border border-border py-2 px-10 text-[11px] text-text outline-none focus:bg-surface-3 transition-all placeholder:text-muted/20 rounded-[4px] shadow-sm"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <SearchIcon
                  className={`h-3.5 w-3.5 transition-colors ${librarySearch.isSearching ? "text-accent animate-pulse" : "text-muted group-focus-within:text-accent"}`}
                />
              </div>

              <AnimatePresence>
                {librarySearch.isHistoryOpen && (
                  <motion.div
                    ref={librarySearch.historyRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-full mt-1.5 bg-surface-3 border border-border shadow-2xl z-[100] backdrop-blur-xl overflow-hidden rounded-[5px]"
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-black/40">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-pulse" />
                        {librarySearch.query.trim()
                          ? "Neural Discovery Results"
                          : "Search Discovery Log"}
                      </span>
                      <button
                        onClick={() => librarySearch.setIsHistoryOpen(false)}
                        className="text-muted hover:text-text transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
                      {librarySearch.query.trim() ? (
                        librarySearch.results.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <SearchIcon className="h-6 w-6 text-muted/10 mx-auto mb-3" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted/20 italic">
                              No direct matches.
                            </p>
                          </div>
                        ) : (
                          librarySearch.results.map((item, idx) => (
                            <div
                              key={item.id}
                              className={`group flex flex-col px-4 py-3 cursor-pointer border-b border-border/10 last:border-0 relative transition-colors ${librarySearch.selectedIndex === idx ? "bg-accent/30 border-l-2 border-l-accent" : "hover:bg-white/[0.03] border-l-2 border-l-transparent"}`}
                              onClick={() => librarySearch.onSelect(item)}
                            >
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span
                                    className={`text-[12px] truncate ${librarySearch.selectedIndex === idx ? "text-text font-black" : "text-text font-bold"}`}
                                    dangerouslySetInnerHTML={{
                                      __html: item.text,
                                    }}
                                  />
                                </div>
                              </div>
                              <p
                                className="pl-5 text-[10px] text-muted line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    item.definitionSnippet ||
                                    item.definition?.substring(0, 100),
                                }}
                              />
                            </div>
                          ))
                        )
                      ) : librarySearch.history.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <RefreshCcw className="h-5 w-5 text-muted/10 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted/20 italic">
                            Discovery log is empty.
                          </p>
                        </div>
                      ) : (
                        librarySearch.history.map((q, idx) => (
                          <div
                            key={idx}
                            className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-border/10 last:border-0 relative transition-colors ${librarySearch.selectedIndex === idx ? "bg-accent/30 border-l-2 border-l-accent" : "hover:bg-white/[0.03] border-l-2 border-l-transparent"}`}
                            onClick={() => {
                              librarySearch.setQuery(q);
                              librarySearch.setIsHistoryOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3 overflow-hidden ml-1">
                              <RefreshCcw className="h-3.5 w-3.5 text-muted/30 group-hover:text-accent" />
                              <span className="text-[11px] truncate text-text/80">
                                {q}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                librarySearch.removeFromHistory(q);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-muted/20 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 bg-surface-2/50 border-t border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="w-3 h-2.5 bg-muted/20 rounded-[2px] flex items-center justify-center text-[7px] text-text/50">
                              ↑
                            </div>
                            <div className="w-3 h-2.5 bg-muted/20 rounded-[2px] flex items-center justify-center text-[7px] text-text/50">
                              ↓
                            </div>
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tight text-muted/40">
                            Navigate
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <div className="px-1.5 h-3.5 bg-muted/20 rounded-[2px] flex items-center justify-center text-[7px] text-text/50">
                            ↵
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tight text-muted/40">
                            Select
                          </span>
                        </div>
                      </div>

                      {!librarySearch?.query?.trim() &&
                        librarySearch?.history?.length > 0 && (
                          <button
                            onClick={() => librarySearch.clearHistory()}
                            className="p-1 px-3 hover:bg-red-500/10 text-[8px] font-black uppercase tracking-widest text-muted hover:text-red-500 transition-all border border-border/40 rounded-[2px]"
                          >
                            Purge Log
                          </button>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        {view === "search" && videoSearch && (
          <div className="relative group">
            <input
              ref={videoSearch.inputRef}
              type="text"
              value={videoSearch.query}
              onChange={(e) => videoSearch.setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && videoSearch.onSearch()}
              placeholder={
                videoSearch.preview
                  ? "Search for another video..."
                  : "Paste URL or keywords..."
              }
              className="w-full bg-surface-2 border border-border py-1.5 pl-4 pr-10 text-[11px] text-text outline-none focus:border-accent/40 focus:bg-surface-3 transition-all placeholder:text-muted/20 rounded-[3px]"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {videoSearch.busy ? (
                <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
              ) : (
                <SearchIcon className="h-3.5 w-3.5 text-muted group-focus-within:text-accent" />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end flex-1 min-w-[120px]">
        <Notifications />
        <div className="mx-1 w-[1px] h-5 bg-white/30" />
        <Dropdow
          view={view}
          setView={setView}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    </div>
  );
}
