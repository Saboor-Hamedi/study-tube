import { useMemo, memo, useState } from 'react'
import { Loader2, Trash2, Search as SearchIcon, RefreshCcw } from 'lucide-react'

const LibraryView = ({ vocab, setVocab, searchQuery, setSearchQuery, sortBy, setSortBy, displayLimit, setDisplayLimit, api }) => {
  const filtered = useMemo(() => {
    return vocab
      .filter(v => {
        const q = searchQuery.toLowerCase()
        return v.text?.toLowerCase().includes(q) || 
               v.definition?.toLowerCase().includes(q) || 
               v.videoTitle?.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortBy === 'az') return (a.text || '').localeCompare(b.text || '')
        return new Date(b.date || 0) - new Date(a.date || 0)
      })
  }, [vocab, searchQuery, sortBy])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] select-text overflow-hidden">
      {/* Universal Header (Matching VideoView) */}
      <header className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/5 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6 gap-3 sm:gap-8">
          
          <div className="flex items-center gap-2 sm:gap-6 shrink-0 md:min-w-[200px]">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h2 className="text-[18px] font-black text-white tracking-tighter shrink-0">Study Library</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest hidden sm:block whitespace-nowrap">{vocab.length} Words</p>
            </div>
          </div>

          <div className="flex-1 max-w-[600px] flex items-center">
            <div className="flex-1 flex items-stretch h-9 sm:h-11 border border-white/10 rounded-[5px] bg-white/[0.03] overflow-hidden focus-within:border-accent/40 transition-all shadow-inner cursor-text">
              <input 
                type="text"
                placeholder="Filter Library..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[12px] sm:text-sm text-white placeholder:text-muted/40 outline-none px-3 sm:px-5 py-1"
                spellCheck={false}
              />
              <button
                className="flex items-center justify-center px-4 sm:px-6 bg-white/5 border-l border-white/5 hover:bg-accent hover:text-white transition-all"
              >
                <SearchIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted group-hover:text-white" />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 md:min-w-[200px] justify-end">
            <button 
              onClick={() => setSortBy(sortBy === 'date' ? 'az' : 'date')}
              className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 bg-white/[0.03] border border-white/10 rounded-[5px] px-3 sm:px-5 text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-muted hover:text-white hover:border-white/20 transition-all whitespace-nowrap"
            >
              {sortBy === 'date' ? 'Latest' : 'A-Z'}
            </button>
          </div>
          
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-20 scrollbar-thin">
        <div className="max-w-7xl mx-auto">
          <div className="w-full">
        {vocab.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-muted italic text-sm">Your library is empty. Highlight or save words from a video to start!</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.slice(0, displayLimit).map((v, i) => (
            <div key={i} className="group bg-[#080808] border border-white/5 p-5 rounded-3xl hover:border-white/10 transition-all flex flex-col gap-4 relative">

              <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                    {v.text?.split(' ').length > 3 ? (
                      <h3 className="text-base italic text-white/90 border-l-2 border-accent pl-3 py-1 leading-relaxed">"{v.text}"</h3>
                    ) : (
                      <h3 className="text-xl font-black text-white leading-none">{v.text}</h3>
                    )}
                    {(v.type) && v.text?.split(' ').length <= 3 && (
                      <span className="text-accent text-[13px] font-bold uppercase tracking-[0.1em]">{v.type.split(/[.,(]/)[0].trim().substring(0, 15)}</span>
                    )}
                  </div>
                  {v.loading ? (
                    <div className="flex items-center gap-2 py-1 opacity-50">
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Calling AI...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Unified List Section */}
                      <ul className="space-y-1.5">
                        {v.definition && v.text?.split(' ').length <= 3 && (
                          <li className="text-[13px] text-white/90 leading-snug flex gap-2 lowercase">
                            <span className="text-accent/60 font-black">•</span>
                            <span>{v.definition}</span>
                          </li>
                        )}
                        
                        {!v.loading && v.text?.split(' ').length <= 3 && (
                          <>
                            {v.synonyms && (
                              <li className="text-[13px] text-white/60 flex gap-2 italic lowercase">
                                <span className="font-bold opacity-30 shrink-0">syn:</span>
                                <span className="line-clamp-1">{v.synonyms}</span>
                              </li>
                            )}
                            {v.examples && v.examples.slice(0, 2).map((ex, idx) => (
                              <li key={idx} className="text-[13px] text-white/50 italic leading-snug border-l border-white/10 pl-2 line-clamp-1 hover:text-white/90 transition-colors lowercase">{ex}</li>
                            ))}
                          </>
                        )}
                      </ul>

                      {(v.usage || v.grammar) && (
                        <div className="flex flex-wrap gap-x-2 text-[13px] text-white/20 font-bold lowercase tracking-normal">
                          {v.usage && <span>{v.usage}</span>}
                          {v.usage && v.grammar && <span className="opacity-10">|</span>}
                          {v.grammar && <span className="italic">{v.grammar}</span>}
                        </div>
                      )}
                    </div>
                  )}
               </div>

              <div className="mt-auto pt-1.5 flex items-center justify-between gap-4 border-t border-white/[0.03]">
                <div className="text-[13px] font-mono text-muted/30 truncate">from: {v.videoTitle}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    disabled={v.loading}
                    onClick={async () => {
                      const newList = [...vocab]
                      const idx = vocab.findIndex(item => item.date === v.date)
                      if (idx === -1) return
                      
                      newList[idx] = { ...v, loading: true }
                      setVocab(newList)
                      
                      try {
                        const updated = await api.explainWord({ text: v.text, videoTitle: v.videoTitle })
                        const final = [...vocab] // Refresh ref
                        const fIdx = final.findIndex(item => item.date === v.date)
                        if (fIdx !== -1) {
                          final[fIdx] = { ...updated, date: v.date } // Keep original date
                          setVocab(final)
                          api.saveVocab(final)
                        }
                      } catch (e) {
                        const errorList = [...vocab]
                        const eIdx = errorList.findIndex(item => item.date === v.date)
                        if (eIdx !== -1) {
                          errorList[eIdx].loading = false
                          setVocab(errorList)
                        }
                      }
                    }} 
                    className="p-1 px-2 text-muted/20 hover:text-accent hover:bg-accent/5 rounded transition-all shrink-0"
                    title="Refresh AI Data"
                  >
                    <RefreshCcw className={`h-3 w-3 ${v.loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button onClick={() => {
                    const newList = vocab.filter(item => item.date !== v.date)
                    setVocab(newList)
                    api.saveVocab(newList)
                  }} className="p-1 px-2 text-muted/20 hover:text-red-500 hover:bg-red-500/5 rounded transition-all shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {filtered.length > displayLimit && (
            <div className="pt-8 flex justify-center">
               <button 
                 onClick={() => setDisplayLimit(prev => prev + 10)}
                 className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all"
               >
                 Show More ({filtered.length - displayLimit} remaining)
               </button>
            </div>
          )}
        </>
      )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(LibraryView)
