import { useMemo, memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Trash2, Search as SearchIcon, RefreshCcw, Library, FileText, ChevronRight, X, Maximize2, AlertCircle, Plus, FolderMinus } from 'lucide-react'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import CardReaderModal from './CardReaderModal'
import { DroppableFolder, DraggableCard } from './DraggableCard'

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6"
        >
          <div className="flex flex-col items-center text-center space-y-4">
             <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-500" />
             </div>
             <div className="space-y-1">
                <h3 className="text-[13px] font-black text-white uppercase tracking-widest">{title}</h3>
                <p className="text-[11px] text-muted leading-relaxed lowercase">{message}</p>
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <button 
              onClick={onConfirm}
              className="w-full py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/10"
             >
                Confirm Delete
             </button>
             <button 
              onClick={onCancel}
              className="w-full py-3 bg-white/5 text-muted hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
             >
                Cancel
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

const LibraryView = ({ vocab, setVocab, collections, setCollections, searchQuery, setSearchQuery, sortBy, setSortBy, displayLimit, setDisplayLimit, api, showToast }) => {
  const [selectedCard, setSelectedCard] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [activeDragItem, setActiveDragItem] = useState(null)
  
  const filtered = useMemo(() => {
    return vocab
      .filter(v => {
        const q = searchQuery.toLowerCase()
        const matchesSearch = (v.text || '').toLowerCase().includes(q) || 
                             (v.definition || '').toLowerCase().includes(q) ||
                             (v.videoTitle || '').toLowerCase().includes(q)
        
        if (selectedCollection === 'all') return matchesSearch
        if (selectedCollection === 'unorganized') return matchesSearch && !v.collection
        return matchesSearch && v.collection === selectedCollection
      })
      .sort((a, b) => {
        if (sortBy === 'az') return a.text.localeCompare(b.text)
        return new Date(b.date) - new Date(a.date)
      })
  }, [vocab, searchQuery, sortBy, selectedCollection])

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return
    const updated = [...collections, newCollectionName.trim()]
    setCollections(updated)
    api.saveCollections(updated)
    setNewCollectionName('')
    setIsCreatingCollection(false)
    showToast(`Collection "${newCollectionName}" created`)
  }

  const handleDeleteCollection = (name) => {
    const updated = collections.filter(c => c !== name)
    setCollections(updated)
    api.saveCollections(updated)
    if (selectedCollection === name) setSelectedCollection('all')
    showToast(`Collection "${name}" removed`)
  }

  const visible = filtered.slice(0, displayLimit)

  const handleUpdateItem = (updatedItem) => {
    const newList = vocab.map(v => (v.date === updatedItem.date || v.text === updatedItem.text) ? updatedItem : v)
    setVocab(newList)
    api.saveVocab(newList)
  }

  const handleDelete = () => {
    if (!itemToDelete) return
    const next = vocab.filter(item => item.date !== itemToDelete.date)
    setVocab(next)
    api.saveVocab(next)
    setItemToDelete(null)
    showToast('Entry purged from archive')
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = (event) => {
    setActiveDragItem(event.active.data.current)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveDragItem(null)
    if (!over) return
    
    const item = active.data.current
    const targetCollection = over.id === 'unorganized' ? '' : (over.id === 'all' ? item.collection : over.id)
    
    if (targetCollection !== item.collection) {
      const newList = vocab.map(v => v.date === item.date ? { ...v, collection: targetCollection } : v)
      setVocab(newList)
      api.saveVocab(newList)
      showToast(`Moved to ${over.id}`)
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 text-muted rounded-xl">
              <Library className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Research Archive</h2>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest">{filtered.length} entries indexed</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl px-8">
            <div className="relative group">
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search concepts, words, or research history..."
                className="w-full bg-white/5 border border-white/5 rounded-full py-2.5 pl-6 pr-12 text-[13px] text-white outline-none focus:border-accent/40 focus:bg-white/[0.07] transition-all lowercase"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <SearchIcon className="h-4 w-4 text-muted group-focus-within:text-accent" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 p-1 rounded-lg">
              <button onClick={() => setSortBy('date')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${sortBy === 'date' ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white'}`}>Recent</button>
              <button onClick={() => setSortBy('az')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${sortBy === 'az' ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white'}`}>A-Z</button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
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
                     onClick={() => setSelectedCollection(item.id)}
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
                  <button 
                   onClick={() => setIsCreatingCollection(true)}
                   className="p-1 h-5 w-5 flex items-center justify-center bg-white/5 hover:bg-accent hover:text-white rounded-[5px] text-muted transition-all duration-300"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
               </div>
               
               <div className="space-y-1">
                  {collections.map(c => (
                    <DroppableFolder 
                     key={c}
                     id={c}
                     active={selectedCollection === c}
                     onClick={() => setSelectedCollection(c)}
                     onDelete={() => handleDeleteCollection(c)}
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

          <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visible.map((v, i) => (
                  <DraggableCard key={v.date || i} id={v.date || i} v={v}>
                    <div className="group h-full bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 hover:border-accent/30 hover:bg-[#121212] transition-all flex flex-col gap-4 shadow-xl">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex flex-col gap-1 min-h-[44px]">
                            <h3 className="text-[16px] font-black text-white leading-tight lowercase line-clamp-2">{v.text}</h3>
                            {v.type && (
                              <span className="text-accent text-[11px] font-bold uppercase tracking-[0.1em]">{v.type.split(/[.,(]/)[0].trim().substring(0, 20)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button onClick={() => setSelectedCard(v)} className="p-1.5 bg-white/5 hover:bg-accent text-muted hover:text-white rounded-lg transition-all shadow-lg">
                              <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {v.loading ? (
                          <div className="flex items-center gap-2 py-1 opacity-50">
                            <Loader2 className="h-3 w-3 animate-spin text-accent" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">calling ai...</span>
                          </div>
                        ) : v.type === 'Collection' ? (
                          <div className="space-y-3">
                             <div className="relative group/script">
                               <p className="text-[12px] text-white/40 leading-relaxed lowercase  line-clamp-[12] select-text">
                                 {v.definition}
                               </p>
                               <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <ul className="space-y-1.5">
                              {v.definition && (
                                <li className="text-[13px] text-white/90 leading-snug flex gap-2 lowercase">
                                  <span className="text-accent/60 font-black">•</span>
                                  <span className="line-clamp-2">{v.definition}</span>
                                </li>
                              )}
                              {!v.loading && (
                                <>
                                  {v.synonyms && (
                                    <li className="text-[12px] text-white/40 flex gap-2 italic lowercase">
                                      <span className="font-bold opacity-30 shrink-0">syn:</span>
                                      <span className="line-clamp-1">{v.synonyms}</span>
                                    </li>
                                  )}
                                  {v.examples && v.examples.slice(0, 1).map((ex, idx) => (
                                    <li key={idx} className="text-[12px] text-white/30 italic leading-snug border-l border-white/10 pl-2 line-clamp-1 lowercase">{ex}</li>
                                  ))}
                                </>
                              )}
                            </ul>
                            
                            <div className="flex items-center justify-between pt-1">
                              {(v.usage || v.grammar) ? (
                                <div className="flex flex-wrap gap-x-2 text-[10px] text-white/10 font-bold lowercase tracking-normal">
                                  {v.usage && <span>{v.usage}</span>}
                                  {v.usage && v.grammar && <span className="opacity-10">|</span>}
                                  {v.grammar && <span className="italic">{v.grammar}</span>}
                                </div>
                              ) : <div />}
                            </div>
                          </div>
                        )}
                     </div>

                    <div className="mt-auto pt-1.5 flex items-center justify-between gap-4 border-t border-white/[0.03]">
                      <div className="flex items-center gap-2">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-tighter line-clamp-1 opacity-40">{v.videoTitle || 'Universal Knowledge'}</span>
                            <span className="text-[8px] text-muted/20 font-mono tracking-tighter uppercase">{new Date(v.date).toLocaleDateString()}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {v.collection && (
                          <button 
                           onClick={(e) => {
                             e.stopPropagation()
                             handleUpdateItem({ ...v, collection: null })
                             showToast(`Removed from ${v.collection}`)
                           }}
                           title="Remove from collection"
                           className="p-1.5 hover:bg-white/5 text-muted/20 hover:text-accent rounded-lg transition-all"
                          >
                           <FolderMinus className="h-3.5 w-3.5" />
                          </button>
                        )}
                         <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setItemToDelete(v)
                          }}
                          className="p-1.5 hover:bg-red-500/10 text-muted/20 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </DraggableCard>
                ))}
              </div>

              {filtered.length > displayLimit && (
                <div className="flex justify-center mt-12 py-10">
                  <button 
                    onClick={() => setDisplayLimit(p => p + 12)}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-xl"
                  >
                    Load More Research Entries
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardReaderModal 
        isOpen={!!selectedCard} 
        item={selectedCard} 
        onClose={() => setSelectedCard(null)} 
        showToast={showToast}
        api={api}
        onUpdate={handleUpdateItem}
        collections={collections}
      />

      <ConfirmationModal 
        isOpen={!!itemToDelete}
        title="Confirm Purge"
        message={`This research entry for "${itemToDelete?.text}" will be permanently removed from the archive.`}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <DragOverlay 
        modifiers={[snapCenterToCursor]}
        className="pointer-events-none"
        dropAnimation={null}
      >
        {activeDragItem ? (
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-accent/30 rounded-md p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.8)] w-32 pointer-events-none">
            <div className="shrink-0 p-1 bg-accent/20 rounded">
               <FileText className="h-2.5 w-2.5 text-accent" />
            </div>
            <p className="text-[9px] font-black text-white/90 truncate lowercase tracking-tighter">{activeDragItem.text}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default memo(LibraryView)
