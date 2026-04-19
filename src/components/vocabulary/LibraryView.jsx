import { useMemo, memo, useState, useEffect, useRef } from 'react'
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
import DeleteModal from '../DeleteModal'
import InsightCaptureModal from './InsightCaptureModal'

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
  const [isInsightCaptureModalOpen, setIsInsightCaptureModalOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const historyRef = useRef(null)

  // Initial Load from SQLite
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
  }, [])

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

    const timer = setTimeout(search, 150) // Tactical Debounce
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
  }, [])

  // Tactical Keymap Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + N: Neural Forge
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsInsightCaptureModalOpen(true)
      }
      // Ctrl + F: Focus Matrix
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  /**
   * History Management: Commits queries to the SQLite Search Log.
   */
  const commitToHistory = async (query) => {
    const trimmed = query.trim()
    if (!trimmed) return
    try {
      await api.addSearchLog(trimmed)
      const log = await api.getSearchLog()
      setSearchHistory(log)
      setSelectedIndex(-1)
    } catch (err) {
      console.error('[FRONTEND ERROR] Persistence Failure', err)
    }
  }

  const removeFromHistory = async (query) => {
    try {
      await api.deleteSearchLog(query)
      const log = await api.getSearchLog()
      setSearchHistory(log)
      setSelectedIndex(-1)
    } catch (err) {
      console.error('[FRONTEND ERROR] Eradication Failure', err)
    }
  }

  const clearHistory = async () => {
    try {
      await api.clearSearchLog()
      setSearchHistory([])
      setIsHistoryOpen(false)
      setSelectedIndex(-1)
    } catch (err) {
      console.error('[FRONTEND ERROR] Chronology Purge Failure', err)
    }
  }
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
        if (sortBy === 'oldest') return new Date(v.date) - new Date(a.date)
        if (sortBy === 'alpha') return a.text.localeCompare(b.text)
        return 0
      })
  }, [vocab, selectedCollection, searchQuery, sortBy])

  const visible = filtered.slice(0, displayLimit)

  /**
   * Neural Prepend: Commits a new manual research node to the archive.
   * Utilizes Optimistic UI pattern for instantaneous feedback.
   */
  const handleAddItem = async (item) => {
    const newList = [item, ...vocab]
    
    // Optimistic UI Update
    setVocab(newList)
    showToast('Insight Forged Successfully')

    try {
      await api.saveVocab(newList)
    } catch (err) {
      console.error('Failed to persist new insight', err)
      showToast('Archival Failure: Data not persistent', 'error')
    }
  }

  /**
   * State Sync: Updates existing research nodes with new AI-enriched data.
   */
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

  /**
   * Confirmed Eradication: Finalizes the permanent removal of research data.
   */
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
   * Neural Dissolution: Removes a collection and unlinks all associated insights.
   */
  const handleDeleteCollection = async (name) => {
    const newList = collections.filter(c => c !== name)
    const newVocab = vocab.map(v => v.collection === name ? { ...v, collection: null } : v)
    
    // Optimistic UI Update
    setCollections(newList)
    setVocab(newVocab)
    if (selectedCollection === name) setSelectedCollection('all')
    showToast(`Collection "${name}" disbanded`)

    try {
      await api.saveCollections(newList)
      await api.saveVocab(newVocab)
    } catch (err) {
      console.error('Failed to disband collection', err)
      showToast('Nexus Synchrony Error: Restart Required', 'error')
    }
  }

  /**
   * Lexical Re-designation: Globally renames an existing research collection.
   */
  const handleRenameCollection = async (oldName, newName) => {
    const newList = collections.map(c => c === oldName ? newName : c)
    const newVocab = vocab.map(v => v.collection === oldName ? { ...v, collection: newName } : v)
    
    // Optimistic UI Update
    setCollections(newList)
    setVocab(newVocab)
    if (selectedCollection === oldName) setSelectedCollection(newName)
    showToast('Collection Re-designated', 'success')

    try {
      await api.saveCollections(newList)
      await api.saveVocab(newVocab)
    } catch (err) {
      console.error('Failed to rename collection', err)
      showToast('Neural Bridge Error', 'error')
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  /**
   * Organizational Matrix: Handles the DndKit logic for migrating insights between collections.
   */
  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveDragItem(null)
    if (over && active.data.current?.date) {
      const itemDate = active.data.current.date
      const targetCollection = over.id === 'unorganized' ? null : (over.id === 'all' ? null : over.id)
      
      if (active.data.current.collection === targetCollection) return

      const newVocab = vocab.map(v => v.date === itemDate ? { ...v, collection: targetCollection } : v)
      
      // Optimistic UI Update
      setVocab(newVocab)
      showToast(`Insight migrated to ${over.id === 'unorganized' ? 'Unorganized' : (over.id === 'all' ? 'Root' : over.id)}`, 'success')
      
      try {
        await api.saveVocab(newVocab)
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

          <div className="flex-1 flex flex-col">
            {/* Universal Standardized Header */}
            <div className="flex items-center justify-between px-8 py-2.5 border-b border-border bg-surface sticky top-0 z-50 transition-colors duration-500">
              <div className="flex items-center gap-4">
                <div className="p-1.5 bg-accent/10 text-accent transition-all">
                  <Library className="h-3.5 w-3.5" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-[10px] font-black text-text uppercase tracking-[0.2em]">Research Archive</h2>
                  <p className="text-[8px] text-muted font-bold uppercase tracking-widest leading-none">
                    Total Intelligence: {vocab.length} Units
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-lg px-8">
                <div className="relative group">
                  <input 
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsHistoryOpen(true)}
                    onKeyDown={(e) => {
                      const items = searchQuery.trim() ? searchResults : searchHistory
                      if (e.key === 'Enter') {
                        if (isHistoryOpen && selectedIndex >= 0 && items[selectedIndex]) {
                          const item = items[selectedIndex]
                          setSearchQuery(typeof item === 'string' ? item : item.text)
                          setIsHistoryOpen(false)
                          setSelectedIndex(-1)
                        } else {
                          commitToHistory(searchQuery)
                          setIsHistoryOpen(false)
                        }
                      }
                      if (e.key === 'ArrowDown' && isHistoryOpen && items.length > 0) {
                        e.preventDefault()
                        setSelectedIndex(prev => (prev + 1) % items.length)
                      }
                      if (e.key === 'ArrowUp' && isHistoryOpen && items.length > 0) {
                        e.preventDefault()
                        setSelectedIndex(prev => (prev - 1 + items.length) % items.length)
                      }
                      if (e.key === 'Escape') {
                        setIsHistoryOpen(false)
                        setSelectedIndex(-1)
                      }
                    }}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (!isHistoryOpen) setIsHistoryOpen(true)
                      setSelectedIndex(-1)
                    }}
                    placeholder="Search neural archive... (Ctrl+F)"
                    className="w-full bg-surface-2 border border-border py-2 px-10 text-[12px] text-text outline-none focus:border-accent/40 focus:bg-surface-3 transition-all placeholder:text-muted/20"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <SearchIcon className={`h-3.5 w-3.5 transition-colors ${isSearching ? 'text-accent animate-pulse' : 'text-muted group-focus-within:text-accent'}`} />
                  </div>
                  
                  {/* Tactical History/Search Log Dropdown */}
                  <AnimatePresence>
                    {isHistoryOpen && (
                      <motion.div 
                        ref={historyRef}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute inset-x-0 top-full bg-surface-3 border-x border-b border-border shadow-2xl z-[100] backdrop-blur-xl overflow-hidden rounded-b-[5px]"
                      >
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-black/40">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">
                             {searchQuery.trim() ? 'Neural Discovery Results' : 'Search Discovery Log'}
                           </span>
                           <div className="flex items-center gap-4">
                              {!searchQuery.trim() && searchHistory.length > 0 && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    clearHistory()
                                  }}
                                  className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
                                >
                                  Purge Logs
                                </button>
                              )}
                              <button onClick={() => setIsHistoryOpen(false)} className="text-muted hover:text-text transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                           </div>
                        </div>
                        <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
                          {searchQuery.trim() ? (
                            /* Mode: Discovery Results */
                            searchResults.length === 0 ? (
                              <div className="px-4 py-10 text-center">
                                <SearchIcon className="h-6 w-6 text-muted/10 mx-auto mb-3" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted/20 italic">No direct matches in neural archive.</p>
                              </div>
                            ) : (
                              searchResults.map((item, idx) => (
                                <div 
                                  key={item.id}
                                  className={`group flex flex-col px-4 py-3 transition-all cursor-pointer border-b border-border/10 last:border-0 relative ${
                                    selectedIndex === idx ? 'bg-accent/20' : 'hover:bg-white/[0.03]'
                                  }`}
                                  onClick={() => {
                                    setSearchQuery(item.text)
                                    setIsHistoryOpen(false)
                                    setSelectedIndex(-1)
                                  }}
                                >
                                  {selectedIndex === idx && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                                  )}
                                  
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className={`h-3 w-3 transition-colors ${selectedIndex === idx ? 'text-accent' : 'text-muted/30 group-hover:text-accent'}`} />
                                      <span className={`text-[12px] truncate ${selectedIndex === idx ? 'text-text font-black' : 'text-text font-bold'}`}>{item.text}</span>
                                    </div>
                                    <span className="text-[8px] text-muted/40 uppercase tracking-tighter whitespace-nowrap">{item.videoTitle?.substring(0, 20)}...</span>
                                  </div>
                                  
                                  <div className="pl-5 border-l border-border/20">
                                    <p 
                                      className="text-[10px] text-muted leading-relaxed line-clamp-2"
                                      dangerouslySetInnerHTML={{ __html: item.definitionSnippet || 'No snippet available' }}
                                    />
                                  </div>
                                </div>
                              ))
                            )
                          ) : (
                            /* Mode: Search History */
                            searchHistory.length === 0 ? (
                              <div className="px-4 py-6 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted/20 italic">Archive logs empty. Press [Enter] to commit intel.</p>
                              </div>
                            ) : (
                              searchHistory.map((q, idx) => (
                                <div 
                                  key={idx}
                                  className={`group flex items-center justify-between px-4 py-2.5 transition-all cursor-pointer border-b border-border/10 last:border-0 relative ${
                                    selectedIndex === idx ? 'bg-accent/20' : 'hover:bg-white/[0.03]'
                                  }`}
                                  onClick={() => {
                                    setSearchQuery(q)
                                    setIsHistoryOpen(false)
                                    setSelectedIndex(-1)
                                  }}
                                >
                                  {selectedIndex === idx && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                                  )}
                                  
                                  <div className="flex items-center gap-3 overflow-hidden ml-1">
                                    <RefreshCcw className={`h-3.5 w-3.5 transition-colors ${selectedIndex === idx ? 'text-accent' : 'text-muted/30 group-hover:text-accent'}`} />
                                    <span className={`text-[11px] truncate ${selectedIndex === idx ? 'text-text font-black' : 'text-text/80 group-hover:text-text'}`}>{q}</span>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeFromHistory(q)
                                    }}
                                    className={`p-1 transition-all rounded-[3px] z-10 ${selectedIndex === idx ? 'bg-black/20 text-text/40 hover:text-red-500' : 'text-muted/20 hover:text-red-500'}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface-2 p-1">
                  <button 
                    onClick={() => setSortBy('newest')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-surface-3 text-text shadow-lg' : 'text-muted hover:text-text'}`}
                  >
                    Newest
                  </button>
                  <button 
                    onClick={() => setSortBy('alpha')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'alpha' ? 'bg-surface-3 text-text shadow-lg' : 'text-muted hover:text-text'}`}
                  >
                    Alpha
                  </button>
                </div>
              </div>
            </div>

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

                {/* Insight Capture Modal */}
                <button className='fab-button' onClick={() => setIsInsightCaptureModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                </button>

                <InsightCaptureModal 
                  isOpen={isInsightCaptureModalOpen}
                  onClose={() => setIsInsightCaptureModalOpen(false)}
                  showToast={showToast}
                  api={api}
                  onInsert={handleAddItem}
                  collections={collections}
                />
              </div>
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

      <DeleteModal 
        isOpen={!!itemToDelete}
        title={selectedCollection === 'trash' || itemToDelete?.archived ? 'Eradicate Research?' : 'Move to Trash?'}
        message={selectedCollection === 'trash' || itemToDelete?.archived ? 'This action permanently dissolves the insight from the neural archive.' : 'The insight will be moved to the trash for later disposal.'}
        onConfirm={handleDelete}
        onClose={() => setItemToDelete(null)}
      />

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
