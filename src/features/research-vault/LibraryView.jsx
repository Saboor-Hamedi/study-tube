import { useMemo, memo, useState, useEffect, useRef, useDeferredValue, useCallback } from 'react'
// ... rest of imports
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, Trash2, Search as SearchIcon, RefreshCcw, 
  Library, FileText, ChevronRight, X, Maximize2, 
  AlertCircle, Plus, FolderMinus, Download, GripVertical, Download as DownloadIcon
} from 'lucide-react'
import CardReaderModal from './CardReaderModal'
import { DroppableFolder, DraggableCard } from './DraggableCard'
import ReactMarkdown from 'react-markdown'
import DeleteModal from './DeleteModal'
import InsightCaptureModal from './InsightCaptureModal'
import PulseLoader from './PulseLoader'

export default function LibraryView({ 
  vocab, setVocab, 
  collections, setCollections, 
  selectedCollection, setSelectedCollection,
  sortBy, setSortBy,
  displayLimit, setDisplayLimit,
  api, 
  showToast,
  syncStats,
  stats,
  onExpand,
  activeDragItem,
  searchInputRef,
  // Elevated Search Logic
  searchQuery, setSearchQuery,
  searchResults, setSearchResults,
  isSearching, setIsSearching,
  searchHistory, setSearchHistory,
  isHistoryOpen, setIsHistoryOpen,
  historyRef
}) {
  const [localVocab, setLocalVocab] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAppending, setIsAppending] = useState(false)
  
  const [selectedCard, setSelectedCard] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  // Register Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef?.current?.focus()
      }
      // Ctrl + N: Neural Forge
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsInsightCaptureModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchInputRef])

  // High-Performance Optimization: Defer the background filtering to keep typing fast
  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Neural Pagination: Fetch only what is visible - Optimized for 100k+ records
  const syncLibraryPage = useCallback(async (showLoader = true) => {
    const controller = new AbortController();
    let forceHydrate = false;
    
    const timeout = setTimeout(() => {
      forceHydrate = true;
      setLoading(false);
      setIsAppending(false);
      console.warn('[NEURAL GATEWAY] Fetch timeout exceeded. Forcing hydration.');
    }, 6000);

    // Industrial Minimum Pulse Delay (300ms) to ensure visual consistency
    const minDelay = new Promise(resolve => setTimeout(resolve, showLoader ? 300 : 0));

    if (showLoader && !isAppending) setLoading(true)
    try {
      const fetchPromise = api.loadVocabPage({ 
        collection: selectedCollection, 
        sortBy, 
        limit: displayLimit 
      });

      const [page] = await Promise.all([fetchPromise, minDelay]);
      
      if (!forceHydrate) {
        setLocalVocab(page || [])
        // Micro-tick for DOM hydration before releasing loader
        await new Promise(r => setTimeout(r, 50));
      }
    } catch (err) {
      console.error('Paginated fetch failure', err)
    } finally {
      clearTimeout(timeout);
      setLoading(false)
      setIsAppending(false)
    }
  }, [selectedCollection, sortBy, displayLimit, api]);

  // Initial Load from SQLite search log
  useEffect(() => {
    const loadLog = async () => {
      try {
        const log = await api.getSearchLog()
        setSearchHistory(log || [])
      } catch (err) {
        console.error('Failed to sync search intelligence', err)
      }
    }
    loadLog()
  }, [api])

  // Handle Neural FTS Search
  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }
      setIsSearching(true)
      try {
        const results = await api.searchLibraryFTS(searchQuery)
        setSearchResults(results || [])
      } catch (err) {
        console.error('FTS Search Failure', err)
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(search, 100) // Blazing Fast Debounce
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle outside clicks to close history
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target) && !searchInputRef.current?.contains(e.target)) {
        setIsHistoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [historyRef, searchInputRef, setIsHistoryOpen])

  useEffect(() => {
    syncLibraryPage(true)
  }, [syncLibraryPage])

  // NOTE: localVocab is managed exclusively by syncLibraryPage to stay
  // collection-aware. The global vocab prop is NOT piped here directly
  // because it is unfiltered and would clobber collection/trash views.

  const visible = localVocab

  /**
   * Industrial Metrics: Calculates the total density of the current collection
   * to determine if pagination boundaries have been reached.
   */
  const totalInCollection = useMemo(() => {
    if (!stats) return 0;
    if (selectedCollection === 'all') return stats.all || 0;
    if (selectedCollection === 'trash') return stats.trash || 0;
    const coll = (stats.collections || []).find(c => c.name === selectedCollection);
    return coll ? coll.count : 0;
  }, [stats, selectedCollection]);



  /**
   * Neural Prepend: Commits a new manual research node to the archive.
   * Utilizes Optimistic UI pattern for instantaneous feedback.
   */
  const handleAddItem = async (item) => {
    try {
      await api.saveVocabItem(item)
      
      // Optimistic UI for local viewport flux
      setLocalVocab(prev => [item, ...prev].slice(0, displayLimit))
      
      if (syncStats) syncStats()
      if (setVocab) setVocab(prev => [item, ...prev])
      
      showToast('Insight Forged Successfully')
    } catch (err) {
      console.error('Failed to persist new insight', err)
      showToast('Archival Failure: Data not persistent', 'error')
    }
  }

  /**
   * Industrial Persistence: Atomic update of a single research node.
   */
  const handleUpdateItem = async (updated) => {
    try {
      await api.saveVocabItem(updated)
      
      // Update our visible "window" with Industrial Filter Logic
      // If the archival state now mismatches the current collection view, remove it
      setLocalVocab(prev => {
        // Condition: If item still belongs in current collection
        const isTrashView = selectedCollection === 'trash';
        const itemBelongs = isTrashView ? updated.archived : !updated.archived;
        
        if (!itemBelongs) {
          return prev.filter(item => (item.id || item.date) !== (updated.id || updated.date));
        }
        return prev.map(item => (item.id || item.date) === (updated.id || updated.date) ? updated : item);
      });
      
      // Sync global state and industrial stats
      if (syncStats) syncStats()
      if (setVocab) setVocab(prev => prev.map(item => (item.id || item.date) === (updated.id || updated.date) ? updated : item))
      
      // Perform Industrial Silent Refill to keep the grid full without displacement
      syncLibraryPage(false)
    } catch (err) {
      console.error('Update failure', err)
      showToast('Nexus Synchrony Failure: Update not persistent', 'error')
    }
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

  /**
   * Confirmed Eradication: Atomic deletion or archival.
   */
  const handleDelete = async () => {
    if (!itemToDelete) return
    const itemId = itemToDelete.id || itemToDelete.date
    try {
      if (selectedCollection === 'trash' || itemToDelete.archived) {
        await api.deleteVocabItem(itemId)
        showToast('Insight permanently eradicated', 'success')
      } else {
        const archivedItem = { ...itemToDelete, archived: true }
        await api.saveVocabItem(archivedItem)
        showToast('Insight moved to trash', 'success')
      }

      // Optimistic local remove: keeps current collection view intact
      setLocalVocab(prev => prev.filter(v => (v.id || v.date) !== itemId))

      // Sync global state (does NOT touch localVocab — effect removed)
      if (setVocab) setVocab(prev => prev.filter(v => (v.id || v.date) !== itemId))

      // Silently refill the grid from the correct collection
      await syncLibraryPage(false)
      if (syncStats) syncStats()

      setItemToDelete(null)
    } catch (err) {
      console.error('System refusal: Delete failed', err)
      showToast('Industrial Safety Lock: Delete aborted', 'error')
    }
  }

  const handleRestore = async (item) => {
    await handleUpdateItem({ ...item, archived: 0 })
    showToast('Insight restored to archive')
  }

  /**
   * Directory Genesis: Optimistically establishes a new neural research collection.
   */
  const handleCreateCollection = async () => {
    const name = newCollectionName.trim()
    if (!name || collections.includes(name)) return
    
    // Optimistic UI Update
    const newList = [...collections, name]
    setCollections(newList)
    setNewCollectionName('')
    setIsCreatingCollection(false)
    showToast('Collection established')
    
    try {
      await api.saveCollections(newList)
    } catch (err) {
      console.error('Failed to persist collection', err)
      showToast('Neural Bridge Error: Restart Required', 'error')
    }
  }

  /**
   * Neural Dissolution: Removes a collection and unlinks all associated insights natively in SQL.
   */
  const handleDeleteCollection = async (name) => {
    try {
      await api.disbandCollection(name)
      
      const newList = collections.filter(c => c !== name)
      setCollections(newList)
      if (selectedCollection === name) setSelectedCollection('all')
      
      if (syncStats) syncStats()
      showToast(`Collection "${name}" disbanded`)
    } catch (err) {
      console.error('Failed to disband collection', err)
      showToast('Nexus Synchrony Error: Disband failed', 'error')
    }
  }

  /**
   * Lexical Re-designation: Globally renames an existing research collection natively in SQL.
   */
  const handleRenameCollection = async (oldName, newName) => {
    try {
      await api.migrateCollection(oldName, newName)
      
      const newList = collections.map(c => c === oldName ? newName : c)
      setCollections(newList)
      if (selectedCollection === oldName) setSelectedCollection(newName)
      
      if (syncStats) syncStats()
      showToast('Collection Re-designated', 'success')
    } catch (err) {
      console.error('Failed to rename collection', err)
      showToast('Neural Bridge Error: Rename failed', 'error')
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (over && active.data.current?.date) {
      const item = active.data.current
      const itemId = item.id || item.date
      const targetCollection = over.id === 'unorganized' ? null : (over.id === 'all' ? null : over.id)
      
      if (item.collection === targetCollection) return

      try {
        const updated = { ...item, collection: targetCollection }
        await api.saveVocabItem(updated)
        
        // Optimistic UI for local viewport
        setLocalVocab(prev => prev.filter(v => (v.id || v.date) !== itemId))
        
        if (syncStats) syncStats()
        if (setVocab) setVocab(prev => prev.map(v => (v.id || v.date) === itemId ? updated : v))
        
        showToast(`Insight migrated to ${over.id === 'unorganized' ? 'Unorganized' : (over.id === 'all' ? 'Root' : over.id)}`, 'success')
      } catch (err) {
        console.error('Failed to persist drag-migration', err)
        showToast('Neural Archiving Failed', 'error')
      }
    }
  }


  // Insight Modal function 
  const handleInsightModal = () => {
    setIsInsightCaptureModalOpen(true)
  }

  // Sidebar is now managed by App.jsx globally

  const gridMemo = useMemo(() => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${activeDragItem ? '[&_*]:transition-none [&_*]:duration-0 select-none' : ''}`}>
      {visible.map((v, i) => (
        <DraggableCard key={(v.id || v.date) || i} id={(v.id || v.date) || i} v={v} useHandle={true}>
          {({ listeners, attributes }) => (
            <div className="group h-[180px] bg-surface p-5 transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-black/5 overflow-hidden relative border border-border/10 hover:border-accent/20 rounded-[5px]">
              <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-1 min-h-[44px]">
                    <h3 className="text-[14px] font-bold text-slate-900 leading-normal line-clamp-2">{v.text}</h3>
                    {v.type && (
                      <span className="text-accent text-[11px] font-bold uppercase tracking-[0.1em]">{v.type.split(/[.,(]/)[0].trim().substring(0, 20)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <div {...listeners} {...attributes} className="p-1.5 bg-slate-200 border border-slate-300 hover:bg-accent text-slate-600 hover:text-white transition-all cursor-grab active:cursor-grabbing rounded-[5px]">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <button onClick={() => setSelectedCard(v)} className="p-1.5 bg-slate-200 border border-slate-300 hover:bg-accent text-slate-600 hover:text-white transition-all rounded-[5px]">
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
                    <div className="text-[12px] text-slate-600 leading-[1.6] select-text font-light tracking-wide italic overflow-hidden">
                       {v.definition
                         ?.replace(/[#*`~_]/g, '')
                         ?.replace(/\[(.*?)\]\(.*?\)/g, '$1')
                         ?.split(/\s+/)
                         ?.slice(0, 20)
                         ?.join(' ')}
                       {(v.definition?.split(/\s+/).length > 20) ? '...' : ''}
                    </div>
                  )}
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
  ), [visible, activeDragItem])

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full overflow-hidden text-text bg-background"
      >
        {/* Sidebar managed by App.jsx */}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
            <div className="max-w-[1400px] mx-auto min-h-[400px] flex flex-col">
              
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center p-20"
                  >
                    <PulseLoader />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="grid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex-1 flex flex-col"
                  >
                    {gridMemo}
                    
                    {/* Industrial Expansion Gate */}
                    <div className="mt-8 mb-20 flex flex-col items-center gap-6">
                      {isAppending ? (
                        <PulseLoader message="Expanding Research Horizon..." />
                      ) : (
                        <div className="flex items-center gap-4">
                          {localVocab.length >= displayLimit && totalInCollection > displayLimit && (
                            <button 
                              onClick={() => {
                                setIsAppending(true)
                                setTimeout(() => {
                                  setDisplayLimit(prev => prev + 3)
                                  setIsAppending(false)
                                }, 600) // Simulated Neural Connection Delay
                              }}
                              className="group h-10 px-6 flex items-center gap-2 bg-surface-2 border border-border/10 text-muted/60 hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all rounded-full"
                            >
                              <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform duration-500" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Load more</span>
                            </button>
                          )}

                          {displayLimit > 6 && (
                            <button 
                              onClick={() => setDisplayLimit(6)}
                              className="h-10 px-6 flex items-center bg-transparent border border-transparent hover:border-red-500/20 text-muted/30 hover:text-red-400 transition-all rounded-full"
                            >
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Collapse</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {selectedCard && (
        <CardReaderModal 
          isOpen={!!selectedCard} 
          item={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          showToast={showToast}
          api={api}
          onUpdate={handleUpdateItem}
          collections={collections}
          onExpand={onExpand}
        />
      )}

      {itemToDelete && (
        <DeleteModal 
          isOpen={!!itemToDelete}
          title={selectedCollection === 'trash' || itemToDelete?.archived ? 'Eradicate Research?' : 'Move to Trash?'}
          message={selectedCollection === 'trash' || itemToDelete?.archived ? 'This action permanently dissolves the insight from the neural archive.' : 'The insight will be moved to the trash for later disposal.'}
          onConfirm={handleDelete}
          onClose={() => setItemToDelete(null)}
        />
)}
    </>
  )
}
