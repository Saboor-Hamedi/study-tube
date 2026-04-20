import { Plus, Library, FileText, Maximize2, Trash2, Pencil, Check } from 'lucide-react'
import { DroppableFolder } from './vocabulary/DraggableCard'
import { useState } from 'react'

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

  const startRename = (name) => {
    setRenamingId(name)
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
    <div className="w-52 border-r border-border bg-surface-2 flex flex-col overflow-hidden transition-colors duration-500">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        
        {/* Analytical Sort Matrix */}
        <div className="space-y-3">
          <div className="px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Sort Index</p>
          </div>
          <div className="flex bg-surface-3 p-1 mx-1.5 rounded-[3px] border border-border/10 shadow-inner">
            <button 
              onClick={() => setSortBy?.('newest')}
              className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-[2px] ${sortBy === 'newest' ? 'bg-accent/10 text-accent shadow-sm' : 'text-muted/40 hover:text-text'}`}
            >
              Newest
            </button>
            <button 
              onClick={() => setSortBy?.('alpha')}
              className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-[2px] ${sortBy === 'alpha' ? 'bg-accent/10 text-accent shadow-sm' : 'text-muted/40 hover:text-text'}`}
            >
              Alpha
            </button>
          </div>
        </div>

        {/* System Folders */}
        <div className="space-y-3">
          <div className="px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">System Root</p>
          </div>
          <div className="space-y-1">
            {[
              { id: 'all', name: 'All Research' },
              ...(showTrash ? [{ id: 'trash', name: 'Neural Trash' }] : [])
            ].map(item => (
              <DroppableFolder 
                key={item.id}
                id={item.id}
                active={selectedCollection === item.id}
                onClick={() => setSelectedCollection?.(item.id)}
              >
                <div className="flex items-center justify-between w-full pr-1">
                  <span>{item.name}</span>
                  <span className="text-[9px] font-black tabular-nums text-accent bg-accent/10 px-1.5 py-0.5 rounded-[3px] shadow-sm">
                    {getCount(item.id)}
                  </span>
                </div>
              </DroppableFolder>
            ))}
          </div>
        </div>

        {/* User Collections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Collections</p>
            {setIsCreatingCollection && (
              <button 
                onClick={() => setIsCreatingCollection(true)}
                className="p-1 h-5 w-5 flex items-center justify-center bg-surface-3 hover:bg-accent hover:text-white text-muted transition-all duration-300 "
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {collections.map(c => (
              <div key={c} className="group/folder relative">
                {renamingId === c ? (
                  <div className="mx-1 p-1 bg-surface-3 border border-accent/20 flex items-center gap-1 overflow-hidden ">
                    <input 
                      autoFocus
                      value={renamingValue}
                      onChange={e => setRenamingValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitRename()}
                      onBlur={submitRename}
                      className="flex-1 bg-transparent px-2 py-1 text-[10px] text-text outline-none"
                    />
                    <button onClick={submitRename} className="p-1 text-accent hover:bg-accent/10 shrink-0 ">
                       <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <DroppableFolder 
                      id={c}
                      active={selectedCollection === c}
                      onClick={() => setSelectedCollection?.(c)}
                    >
                      <div className="flex items-center gap-2 w-full pr-1 overflow-hidden">
                        <span className="truncate flex-1">{c}</span>
                        <span className="text-[9px] font-black tabular-nums text-text/40 bg-surface-3 px-1.5 py-0.5 rounded-[3px] min-w-[16px] text-center shadow-inner group-hover/folder:opacity-0 transition-opacity">
                          {getCount(c)}
                        </span>
                      </div>
                    </DroppableFolder>
                    
                    {/* Inline Actions - Industrial Density */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity bg-surface-2/95 backdrop-blur-md pl-1 pr-1 py-1 rounded-sm shadow-xl z-20">
                       <button 
                        onClick={(e) => { e.stopPropagation(); startRename(c) }}
                        className="p-1.5 hover:bg-accent/10 text-muted/40 hover:text-accent rounded-sm transition-all"
                       >
                         <Pencil className="h-3 w-3" />
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCollection?.(c) }}
                        className="p-1.5 hover:bg-red-500/10 text-muted/40 hover:text-red-500 rounded-sm transition-all"
                       >
                         <Trash2 className="h-3 w-3" />
                       </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
             {isCreatingCollection && (
               <div className="mx-1 mt-2 p-2 border border-accent/20 bg-accent/[0.02] animate-in fade-in zoom-in-95 duration-200 ">
                 <input 
                   autoFocus
                   value={newCollectionName}
                   onChange={e => setNewCollectionName(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                   placeholder="New folder..."
                   className="w-full bg-background border border-border px-2 py-1.5 text-[10px] text-text outline-none focus:border-accent/30 transition-all placeholder:text-muted/20"
                 />
                 <div className="flex gap-1 mt-2">
                   <button onClick={handleCreateCollection} className="flex-1 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all ">Add</button>
                   <button onClick={() => setIsCreatingCollection(false)} className="px-3 py-1 bg-surface-3 text-muted text-[9px] font-black uppercase tracking-widest hover:text-text transition-all  border border-border">X</button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-surface-3 transition-colors duration-500">
        <div className="flex items-center gap-3 px-2 py-1 opacity-40">
          <div className="h-1 w-1 bg-accent animate-pulse" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-text">Archive Encrypted</span>
        </div>
      </div>
    </div>
  )
}
