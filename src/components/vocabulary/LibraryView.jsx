import { useMemo, memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, Trash2, Search as SearchIcon, RefreshCcw, 
  Library, FileText, ChevronRight, X, Maximize2, 
  AlertCircle, Plus, FolderMinus, Download, GripVertical, Download as DownloadIcon
} from 'lucide-react'
import { 
  DndContext, DragOverlay, defaultDropAnimationSideEffects, 
  PointerSensor, useSensor, useSensors, pointerWithin 
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import CardReaderModal from './CardReaderModal'
import { DroppableFolder, DraggableCard } from './DraggableCard'
import Sidebar from '../Sidebar'
import ReactMarkdown from 'react-markdown'

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-surface border border-border p-6 shadow-[0_30px_100px_rgba(0,0,0,1)] space-y-6 rounded-[5px]"
        >
          <div className="flex items-start gap-4">
             <div className="p-3 bg-red-500/10 text-red-500 rounded-[5px]">
                <AlertCircle className="h-6 w-6" />
             </div>
             <div className="space-y-1">
                <h3 className="text-[13px] font-black text-text uppercase tracking-widest">{title}</h3>
                <p className="text-[11px] text-muted leading-relaxed lowercase">{message}</p>
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <button 
              onClick={onConfirm}
              className="w-full py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em]  hover:bg-red-600 transition-all shadow-lg shadow-red-500/10 rounded-[5px]"
             >
                Confirm Delete
             </button>
             <button 
              onClick={onCancel}
              className="w-full py-3 bg-surface-2 text-muted hover:text-text text-[10px] font-black uppercase tracking-[0.2em]  transition-all rounded-[5px]"
             >
                Cancel
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function LibraryView({ 
  vocab, setVocab, 
  collections, setCollections, 
  selectedCollection, setSelectedCollection,
  searchQuery, setSearchQuery,
  sortBy, setSortBy,
  displayLimit, setDisplayLimit,
  api, showToast
}) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const filtered = useMemo(() => {
    return vocab
      .filter(v => {
        const q = searchQuery.toLowerCase().trim()
        
        // Accelerated Search Vector Check
        if (q === '') {
           if (selectedCollection === 'all') return !v.archived
           if (selectedCollection === 'trash') return v.archived
           if (selectedCollection === 'unorganized') return !v.archived && !v.collection
           return !v.archived && v.collection === selectedCollection
        }

        const searchVector = v._searchIndex || (v.text + ' ' + (v.definition || '') + ' ' + (v.videoTitle || '')).toLowerCase()
        if (!v._searchIndex) v._searchIndex = searchVector

        const matchesSearch = searchVector.includes(q)
        if (selectedCollection === 'trash') return matchesSearch && v.archived
        if (v.archived) return false
        if (selectedCollection === 'unorganized') return matchesSearch && !v.collection
        if (selectedCollection && selectedCollection !== 'all') return matchesSearch && v.collection === selectedCollection
        return matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date) - new Date(a.date)
        if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date)
        if (sortBy === 'alpha') return a.text.localeCompare(b.text)
        return 0
      })
  }, [vocab, selectedCollection, searchQuery, sortBy])

  const visible = filtered.slice(0, displayLimit)

  const handleUpdateItem = async (updated) => {
    const newList = vocab.map(item => item.date === updated.date ? updated : item)
    setVocab(newList)
    await api.saveVocab(newList)
    if (selectedCard?.date === updated.date) setSelectedCard(updated)
  }

  const handleExportItem = async (item) => {
    try {
      const dataStr = JSON.stringify(item, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `research-${item.text.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('Insight Exported Successfully')
    } catch (err) {
      showToast('Export Anomaly Detected', 'error')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    let newList
    if (selectedCollection === 'trash' || itemToDelete.archived) {
      newList = vocab.filter(item => item.date !== itemToDelete.date)
      showToast('Insight permanently eradicated', 'success')
    } else {
      newList = vocab.map(item => item.date === itemToDelete.date ? { ...item, archived: true } : item)
      showToast('Insight moved to trash', 'success')
    }
    setVocab(newList)
    await api.saveVocab(newList)
    setItemToDelete(null)
  }

  const handleRestore = async (item) => {
    const newList = vocab.map(v => v.date === item.date ? { ...v, archived: false } : v)
    setVocab(newList)
    await api.saveVocab(newList)
    showToast('Insight restored to archive')
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || collections.includes(newCollectionName.trim())) return
    const newList = [...collections, newCollectionName.trim()]
    setCollections(newList)
    await api.saveCollections(newList)
    setNewCollectionName('')
    setIsCreatingCollection(false)
    showToast('Collection established')
  }

  const handleDeleteCollection = async (name) => {
    const newList = collections.filter(c => c !== name)
    const newVocab = vocab.map(v => v.collection === name ? { ...v, collection: null } : v)
    setCollections(newList)
    setVocab(newVocab)
    await api.saveCollections(newList)
    await api.saveVocab(newVocab)
    if (selectedCollection === name) setSelectedCollection('all')
    showToast(`Collection "${name}" disbanded`)
  }

  const handleRenameCollection = async (oldName, newName) => {
    const newList = collections.map(c => c === oldName ? newName : c)
    const newVocab = vocab.map(v => v.collection === oldName ? { ...v, collection: newName } : v)
    setCollections(newList)
    setVocab(newVocab)
    await api.saveCollections(newList)
    await api.saveVocab(newVocab)
    if (selectedCollection === oldName) setSelectedCollection(newName)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveDragItem(null)
    if (over && active.data.current?.date) {
      const itemDate = active.data.current.date
      const targetCollection = over.id === 'unorganized' ? null : (over.id === 'all' ? null : over.id)
      
      if (active.data.current.collection === targetCollection) return

      const newVocab = vocab.map(v => v.date === itemDate ? { ...v, collection: targetCollection } : v)
      setVocab(newVocab)
      await api.saveVocab(newVocab)
      showToast(`Insight migrated to ${over.id === 'unorganized' ? 'Unorganized' : (over.id === 'all' ? 'Root' : over.id)}`, 'success')
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={pointerWithin} 
      modifiers={[snapCenterToCursor]}
      onDragStart={(e) => setActiveDragItem(e.active.data.current)} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full bg-background transition-colors duration-500 overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <Sidebar 
            collections={collections} 
            selectedCollection={selectedCollection} 
            setSelectedCollection={setSelectedCollection} 
            handleDeleteCollection={handleDeleteCollection}
            handleRenameCollection={handleRenameCollection}
            handleCreateCollection={handleCreateCollection}
            isCreatingCollection={isCreatingCollection}
            setIsCreatingCollection={setIsCreatingCollection}
            newCollectionName={newCollectionName}
            setNewCollectionName={setNewCollectionName}
            showTrash={true}
          />

          <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
            <div className="max-w-[1400px] mx-auto">
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${activeDragItem ? '[&_*]:transition-none [&_*]:duration-0 select-none' : ''}`}>
                {visible.map((v, i) => (
                  <DraggableCard key={v.date || i} id={v.date || i} v={v} useHandle={true}>
                    {({ listeners, attributes }) => (
                      <div className="group h-[180px] bg-transparent p-4 hover:bg-text/[0.02] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md overflow-hidden relative border border-transparent hover:border-border/20">
                        <div className="flex flex-col gap-4 overflow-hidden">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex flex-col gap-1 min-h-[44px]">
                              <h3 className="text-[14px] font-bold text-text leading-normal line-clamp-2">{v.text}</h3>
                              {v.type && (
                                <span className="text-accent text-[11px] font-bold uppercase tracking-[0.1em]">{v.type.split(/[.,(]/)[0].trim().substring(0, 20)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <div {...listeners} {...attributes} className="p-1.5 bg-surface-3 border border-border hover:bg-accent text-muted hover:text-white transition-all cursor-grab active:cursor-grabbing rounded-[5px]">
                                <GripVertical className="h-3.5 w-3.5" />
                              </div>
                              <button onClick={() => setSelectedCard(v)} className="p-1.5 bg-surface-2 border border-border/20 hover:bg-accent text-muted/40 hover:text-white transition-all rounded-[5px]">
                                <Maximize2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-hidden relative">
                            {v.loading ? (
                              <div className="flex items-center gap-2 py-1 opacity-50">
                                <Loader2 className="h-3 w-3 animate-spin text-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">calling ai...</span>
                              </div>
                            ) : (
                              <div className="prose prose-invert prose-xs text-[13px] text-text/70 leading-[1.6] select-text line-clamp-4">
                                 <ReactMarkdown>{v.definition}</ReactMarkdown>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface group-hover:from-surface-2 transition-colors to-transparent pointer-events-none" />
                          </div>
                        </div>

                        <div className="mt-auto pt-1.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                             <div className="flex flex-col">
                                <span className="text-[9px] text-muted font-bold uppercase tracking-tighter line-clamp-1 opacity-40">{v.videoTitle || 'Universal Knowledge'}</span>
                                <span className="text-[8px] text-muted/20 font-mono tracking-tighter uppercase">{new Date(v.date).toLocaleDateString()}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(i_e) => { i_e.stopPropagation(); handleExportItem(v) }}
                               className="p-1.5 hover:bg-surface-3 text-muted/20 hover:text-accent transition-all "
                             >
                                <DownloadIcon className="h-3.5 w-3.5" />
                             </button>
                             {v.archived ? (
                                <button 
                                  onClick={(i_e) => { i_e.stopPropagation(); handleRestore(v) }}
                                  className="p-1.5 hover:bg-accent/10 text-accent  transition-all"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                </button>
                             ) : v.collection && (
                                <button 
                                 onClick={(i_e) => {
                                   i_e.stopPropagation()
                                   handleUpdateItem({ ...v, collection: null })
                                   showToast(`Removed from ${v.collection}`)
                                 }}
                                 className="p-1.5 hover:bg-surface-3 text-muted/20 hover:text-accent  transition-all"
                                >
                                 <FolderMinus className="h-3.5 w-3.5" />
                                </button>
                             )}
                             <button 
                               onClick={(i_e) => {
                                 i_e.stopPropagation()
                                 setItemToDelete(v)
                               }}
                               className={`p-1.5  transition-all ${v.archived ? 'hover:bg-red-500 text-red-500 hover:text-white' : 'hover:bg-red-500/10 text-muted/20 hover:text-red-500'}`}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DraggableCard>
                ))}
              </div>

              {filtered.length > displayLimit && (
                <div className="flex justify-center mt-12 py-10">
                  <button 
                    onClick={() => setDisplayLimit(p => p + 12)}
                    className="px-8 py-3 bg-surface-2 border border-border text-text text-[11px] font-black uppercase tracking-widest hover:bg-surface-3 transition-all shadow-xl "
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
        title={selectedCollection === 'trash' || itemToDelete?.archived ? 'Eradicate Research?' : 'Move to Trash?'}
        message={selectedCollection === 'trash' || itemToDelete?.archived ? 'This action permanently dissolves the insight from the neural archive.' : 'The insight will be moved to the trash for later disposal.'}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Industrial Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <div className="w-[160px] bg-surface-2 border border-accent p-1.5 shadow-2xl opacity-90 scale-90 pointer-events-none rounded-[5px]">
             <div className="flex items-center gap-1.5">
                <div className="p-1 bg-accent/10 border border-accent/20 rounded-[3px]">
                   <FileText className="h-3 w-3 text-accent" />
                </div>
                <div className="min-w-0">
                   <h4 className="text-[9px] font-black text-text uppercase tracking-widest truncate">{activeDragItem.text}</h4>
                </div>
             </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default LibraryView
