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
  showTrash = false
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
  return (
    <div className="w-52 border-r border-border bg-surface-2 flex flex-col overflow-hidden transition-colors duration-500">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        {/* System Folders */}
        <div className="space-y-3">
          <div className="px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">System Root</p>
          </div>
          <div className="space-y-1">
            {[
              { id: 'all', name: 'All Research', icon: Library },
              { id: 'unorganized', name: 'Unorganized', icon: FileText },
              ...(showTrash ? [{ id: 'trash', name: 'Neural Trash', icon: Trash2 }] : [])
            ].map(item => (
              <DroppableFolder 
                key={item.id}
                id={item.id}
                active={selectedCollection === item.id}
                onClick={() => setSelectedCollection?.(item.id)}
              >
                {item.name}
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
                      onDelete={handleDeleteCollection ? () => handleDeleteCollection(c) : null}
                    >
                      {c}
                    </DroppableFolder>
                    
                    {/* Inline Actions - Industrial Density */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                       <button 
                        onClick={(e) => { e.stopPropagation(); startRename(c) }}
                        className="p-1 bg-surface-3 hover:bg-accent text-muted hover:text-white transition-all "
                       >
                         <Pencil className="h-2.5 w-2.5" />
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
