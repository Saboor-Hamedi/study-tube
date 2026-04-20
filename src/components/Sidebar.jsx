import { Plus, Library, FileText, Maximize2, Trash2, Pencil, Check, ChevronLeft, ChevronRight, Hash, Folder, Calendar, Type, Star } from 'lucide-react'
import { DroppableFolder } from './vocabulary/DraggableCard'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar({ 
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
  setSortBy
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renamingValue, setRenamingValue] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [pinnedItems, setPinnedItems] = useState([]) 

  const startRename = (name) => {
    setRenamingId(name)
    setNewCollectionName('')
    setRenamingValue(name)
  }

  const submitRename = () => {
    if (renamingValue.trim() && renamingValue !== renamingId) {
      handleRenameCollection?.(renamingId, renamingValue.trim())
    }
    setRenamingId(null)
  }

  const getCount = (id) => {
    if (!stats) return '...';
    if (id === 'all') return (stats.all || 0);
    if (id === 'trash') return (stats.trash || 0);
    const c = stats.collections?.find(c => c.name === id);
    return c ? c.count : 0;
  }

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 52 : 208 }}
      className="h-full border-r border-border bg-surface-2 flex flex-col relative transition-colors duration-500"
    >
      {/* Structural Toggle Hub - Elevated for zero-collision navigation */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-surface-3 border border-border rounded-full flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-all z-[150] shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-3 transition-all duration-300 ${isCollapsed ? 'space-y-4' : 'space-y-8'}`}>
          
          {/* Analytical Sort Matrix */}
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="px-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Sort Index</p>
              </div>
            )}
            <div className="space-y-1">
              {[
                { id: 'newest', name: 'Newest', icon: Calendar },
                { id: 'alpha', name: 'Oldest', icon: Type }
              ].map(item => (
                <div key={item.id} className="group relative flex justify-center">
                  {!isCollapsed && (
                    <div className={`absolute left-0 w-[1.5px] h-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${sortBy === item.id ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />
                  )}
                  <button 
                    onClick={() => setSortBy?.(item.id)}
                    style={isCollapsed ? { width: '40px', height: '40px' } : {}}
                    className={`flex items-center transition-all duration-200 text-left shrink-0 ${
                      isCollapsed 
                        ? `justify-center rounded-full border-0 ${sortBy === item.id ? 'bg-accent/10 text-accent' : 'text-muted/40 hover:bg-surface-3 hover:text-text'}` 
                        : `w-full gap-3 px-3 py-2 rounded-[5px] border border-transparent ${sortBy === item.id ? 'text-accent font-bold' : 'text-muted hover:bg-surface-3 hover:text-text'}`
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 shrink-0 ${sortBy === item.id ? 'text-accent' : 'opacity-40 group-hover:opacity-100'}`} />
                    {!isCollapsed && (
                      <span className="text-[10px] uppercase font-black tracking-[0.2em] truncate flex-1">{item.name}</span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[9px] font-black uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[120]">
                        {item.name}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Pins - Bridge Section */}
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="px-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Neural Pins</p>
              </div>
            )}
            <div className="space-y-1">
              {pinnedItems.length > 0 ? (
                pinnedItems.map(pin => (
                   <DroppableFolder 
                    key={pin.id}
                    id={pin.id}
                    active={selectedCollection === pin.id}
                    onClick={() => setSelectedCollection?.(pin.id)}
                    isCollapsed={isCollapsed}
                  >
                    <div className="flex items-center justify-between w-full">
                       <span>{pin.name}</span>
                       {!isCollapsed && (
                         <span className="text-[9px] font-black tabular-nums text-text/40 bg-surface-3 px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                            {getCount(pin.id)}
                          </span>
                       )}
                    </div>
                  </DroppableFolder>
                ))
              ) : (
                <div className={`flex items-center transition-all duration-200 text-muted/20 ${isCollapsed ? 'justify-center w-full' : 'gap-3 px-3 py-2 rounded-[5px] w-full'}`}>
                   <div style={isCollapsed ? { width: '40px', height: '40px' } : {}} className={`flex items-center justify-center shrink-0`}>
                      <Star className="h-3.5 w-3.5" />
                   </div>
                   {!isCollapsed && (
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] truncate flex-1 italic">Empty Void</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* System Folders */}
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="px-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">System Root</p>
              </div>
            )}
            <div className="space-y-1">
              {[
                { id: 'all', name: 'All Research', icon: Library },
                ...(showTrash ? [{ id: 'trash', name: 'Neural Trash', icon: Trash2 }] : [])
              ].map(item => (
                <DroppableFolder 
                  key={item.id}
                  id={item.id}
                  active={selectedCollection === item.id}
                  onClick={() => setSelectedCollection?.(item.id)}
                  isCollapsed={isCollapsed}
                >
                   <div className="flex items-center justify-between w-full">
                      <span className="truncate">{item.name}</span>
                      {!isCollapsed && (
                        <span className="text-[9px] font-black tabular-nums text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                           {getCount(item.id)}
                        </span>
                      )}
                   </div>
                </DroppableFolder>
              ))}
            </div>
          </div>

          {/* User Collections */}
          <div className="space-y-3">
            <div className={`flex items-center px-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Collections</p>}
              {setIsCreatingCollection && (
                <button 
                  onClick={() => setIsCreatingCollection(true)}
                  style={isCollapsed ? { width: '40px', height: '40px' } : {}}
                  className={`flex items-center justify-center bg-surface-3 hover:bg-accent hover:text-white text-muted transition-all duration-300 shrink-0 ${isCollapsed ? 'rounded-full' : 'h-5 w-5 rounded-[5px]'}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {collections.map(c => (
                <div key={c} className="group/folder relative flex justify-center">
                  {renamingId === c && !isCollapsed ? (
                    <div className="mx-1 p-1 bg-surface-3 border border-border flex items-center gap-1 overflow-hidden rounded-[5px] px-2 shadow-inner">
                      <input 
                        autoFocus
                        value={renamingValue}
                        onChange={e => setRenamingValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitRename()}
                        onBlur={submitRename}
                        className="flex-1 bg-transparent px-2 py-1 text-[10px] text-text outline-none"
                      />
                      <button onClick={submitRename} className="p-1 text-accent hover:bg-accent/10 shrink-0 rounded-sm">
                         <Check className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <DroppableFolder 
                        id={c}
                        active={selectedCollection === c}
                        onClick={() => setSelectedCollection?.(c)}
                        isCollapsed={isCollapsed}
                      >
                        <div className="flex items-center justify-between w-full">
                           <span className="truncate flex-1">{c}</span>
                           {!isCollapsed && (
                             <span className="text-[9px] font-black tabular-nums text-text/40 bg-surface-3 px-1.5 py-0.5 rounded-full min-w-[16px] text-center group-hover/folder:opacity-0 transition-opacity">
                                {getCount(c)}
                              </span>
                           )}
                        </div>
                      </DroppableFolder>
                      
                      {!isCollapsed && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity bg-surface-2/95 backdrop-blur-md pl-1 pr-1 py-1 rounded-[5px] shadow-xl z-20">
                           <button 
                            onClick={(e) => { e.stopPropagation(); startRename(c) }}
                            className="p-1.5 hover:bg-accent/10 text-muted/40 hover:text-accent rounded-[5px] transition-all"
                           >
                             <Pencil className="h-3 w-3" />
                           </button>
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCollection?.(c) }}
                            className="p-1.5 hover:bg-red-500/10 text-muted/40 hover:text-red-500 rounded-[5px] transition-all"
                           >
                             <Trash2 className="h-3 w-3" />
                           </button>
                        </div>
                      )}
                    </>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-text text-background text-[9px] font-black uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-[120]">
                      {c} ({getCount(c)})
                    </div>
                  )}
                </div>
              ))}
              
               {isCreatingCollection && !isCollapsed && (
                 <div className="mx-1 mt-2 p-2 border border-border bg-surface-3 animate-in fade-in zoom-in-95 duration-200 rounded-[5px]">
                   <input 
                     autoFocus
                     value={newCollectionName}
                     onChange={e => setNewCollectionName(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                     placeholder="New folder..."
                     className="w-full bg-background border border-border px-2 py-1.5 text-[10px] text-text outline-none focus:border-accent/30 transition-all placeholder:text-muted/20 rounded-[5px]"
                   />
                   <div className="flex gap-1 mt-2">
                     <button onClick={handleCreateCollection} className="flex-1 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all rounded-[5px]">Add</button>
                     <button onClick={() => setIsCreatingCollection(false)} className="px-3 py-1 bg-surface-3 text-muted text-[9px] font-black uppercase tracking-widest hover:text-text transition-all border border-border rounded-[5px]">X</button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t border-border bg-surface-3 transition-colors duration-500 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1 opacity-40">
              <div className="h-1.5 w-1.5 bg-accent animate-pulse rounded-full" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-text">Archive Encrypted</span>
            </div>
          ) : (
            <div className="h-2 w-2 bg-accent animate-pulse rounded-full" />
          )}
        </div>
      </div>
    </motion.div>
  )
}
