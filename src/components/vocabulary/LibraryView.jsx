import { Loader2, Trash2, Search as SearchIcon } from 'lucide-react'

export default function LibraryView({ vocab, setVocab, searchQuery, setSearchQuery, sortBy, setSortBy, displayLimit, setDisplayLimit, api }) {
  const filtered = vocab
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] select-text overflow-hidden">
      {/* Universal Header (Matching VideoView) */}
      <header className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/5 pt-2 sm:pt-4 pb-2 sm:pb-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6 gap-3 sm:gap-8">
          
          <div className="flex items-center gap-2 sm:gap-6 shrink-0 md:min-w-[200px]">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter shrink-0">Study Library</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest hidden sm:block whitespace-nowrap">{vocab.length} Words</p>
            </div>
          </div>

          <div className="flex-1 max-w-[600px] flex items-center">
            <div className="flex-1 flex items-stretch h-9 sm:h-11 border border-white/10 rounded-[5px] bg-white/[0.03] overflow-hidden focus-within:border-accent/40 transition-all shadow-inner relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted" />
              <input 
                type="text"
                placeholder="Filter Library..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[12px] sm:text-sm text-white placeholder:text-muted/40 outline-none pl-9 sm:pl-10 pr-3 sm:pr-5 py-1"
                spellCheck={false}
              />
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
          <div className="grid gap-6">
        {vocab.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-muted italic text-sm">Your library is empty. Highlight or save words from a video to start!</p>
          </div>
        ) : (
          <>
          {filtered.slice(0, displayLimit).map((v, i) => (
            <div key={i} className="group bg-[#080808] border border-white/5 p-6 sm:p-8 rounded-[2rem] hover:border-white/10 transition-all flex flex-col gap-6 relative">
              <div className="absolute top-6 right-6">
                 <button onClick={() => {
                   const newList = vocab.filter(item => item.date !== v.date)
                   setVocab(newList)
                   api.saveVocab(newList)
                 }} className="p-2 text-muted/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                   <Trash2 className="h-4 w-4" />
                 </button>
              </div>

              <div className="space-y-3 pr-10">
                 <div className="flex items-center flex-wrap gap-3">
                    {v.text?.split(' ').length > 3 ? (
                      <h3 className="text-xl italic text-white/90 border-l-4 border-accent pl-4 py-1 leading-relaxed">"{v.text}"</h3>
                    ) : (
                      <h3 className="text-3xl font-black text-white">{v.text}</h3>
                    )}
                    {v.type && v.text?.split(' ').length <= 3 && <span className="px-3 py-1 bg-white/5 text-muted text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5">{v.type}</span>}
                    {v.pronunciation && v.text?.split(' ').length <= 3 && <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">/{v.pronunciation}/</span>}
                 </div>
                 {v.loading ? (
                   <div className="flex items-center gap-3 py-2 opacity-50">
                     <Loader2 className="h-4 w-4 animate-spin text-accent" />
                     <span className="text-xs font-bold uppercase tracking-widest text-accent">Calling AI...</span>
                   </div>
                 ) : (
                   v.definition && v.text?.split(' ').length <= 3 && (
                     <p className="text-lg text-slate-300 leading-relaxed font-light">{v.definition}</p>
                   )
                 )}
              </div>

              {!v.loading && v.text?.split(' ').length <= 3 && (
                 <div className="grid sm:grid-cols-2 gap-4">
                   {v.synonyms && (
                     <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                       <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3 opacity-50">Synonyms</p>
                       <div className="flex flex-wrap gap-2">
                         {v.synonyms.split(',').slice(0, 5).map((s, idx) => (
                           <span key={idx} className="px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs text-slate-400">
                             {s.trim()}
                           </span>
                         ))}
                       </div>
                     </div>
                   )}
                   {v.usage && (
                     <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                       <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3 opacity-50">Usage</p>
                       <p className="text-sm text-slate-400 italic line-clamp-3 leading-relaxed border-l-2 border-white/10 pl-3">{v.usage}</p>
                     </div>
                   )}
                 </div>
              )}

              <div className="mt-2 text-xs font-mono text-muted/30">From: {v.videoTitle}</div>
            </div>
          ))}
          
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
