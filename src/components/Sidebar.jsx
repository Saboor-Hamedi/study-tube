import { Plus, Library, FileText, Maximize2 } from 'lucide-react'
import { DroppableFolder } from './vocabulary/DraggableCard'
import { useState } from 'react'

export default function Sidebar({ 
  collections, 
  selectedCollection, 
  setSelectedCollection, 
  handleDeleteCollection, 
  handleCreateCollection,
  isCreatingCollection,
  setIsCreatingCollection,
  newCollectionName,
  setNewCollectionName
}) {
  return (
    <div className="w-56 border-r border-white/5 bg-[#080808] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-8">
        {/* System Folders */}
        <div className="space-y-4">
          <div className="px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">System Root</p>
          </div>
          <div className="space-y-1">
            {[
              { id: 'all', name: 'All Research', icon: Library },
              { id: 'unorganized', name: 'Unorganized', icon: FileText }
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
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted/20">Collections</p>
            {setIsCreatingCollection && (
              <button 
                onClick={() => setIsCreatingCollection(true)}
                className="p-1 h-5 w-5 flex items-center justify-center bg-white/5 hover:bg-accent hover:text-white rounded-[5px] text-muted transition-all duration-300"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {collections.map(c => (
              <DroppableFolder 
                key={c}
                id={c}
                active={selectedCollection === c}
                onClick={() => setSelectedCollection?.(c)}
                onDelete={handleDeleteCollection ? () => handleDeleteCollection(c) : null}
              >
                {c}
              </DroppableFolder>
            ))}
            
            {isCreatingCollection && (
              <div className="mx-1 mt-2 p-2 border border-accent/20 bg-accent/[0.02] rounded-[5px] animate-in fade-in zoom-in-95 duration-200">
                <input 
                  autoFocus
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                  placeholder="New folder..."
                  className="w-full bg-black/40 border border-white/5 rounded-[4px] px-2 py-1.5 text-[10px] text-white outline-none focus:border-accent/30 transition-all placeholder:text-muted/20"
                />
                <div className="flex gap-1 mt-2">
                  <button onClick={handleCreateCollection} className="flex-1 py-1 bg-accent text-white text-[9px] font-black uppercase rounded-[4px] tracking-widest hover:brightness-110 active:scale-95 transition-all">Add</button>
                  <button onClick={() => setIsCreatingCollection(false)} className="px-3 py-1 bg-white/5 text-muted text-[9px] font-black uppercase rounded-[4px] tracking-widest hover:text-white transition-all">X</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 px-2 py-1 opacity-20">
          <div className="h-1 w-1 rounded-full bg-accent animate-pulse" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-muted">Archive Encrypted</span>
        </div>
      </div>
    </div>
  )
}
