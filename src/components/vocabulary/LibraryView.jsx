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
    <div className="w-full flex-1 flex flex-col p-6 lg:p-8 select-text">
      {/* Persistent Library Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 bg-[#0a0a0a] pb-6 mb-2">
        <div className="space-y-1">
           <h1 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">Study Library</h1>
           <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{vocab.length} Words Collected</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64 group">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-accent transition-colors" />
             <input 
               type="text"
               placeholder="Filter Library..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-accent/50 focus:bg-white/[0.07] transition-all outline-none placeholder:text-muted/50 text-white"
             />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setSortBy(sortBy === 'date' ? 'az' : 'date')}
              className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              {sortBy === 'date' ? 'Latest' : 'A-Z'}
            </button>
          </div>
        </div>
      </div>

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
                    <h3 className="text-3xl font-black text-white">{v.text}</h3>
                    {v.type && <span className="px-3 py-1 bg-white/5 text-muted text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5">{v.type}</span>}
                    {v.pronunciation && <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">/{v.pronunciation}/</span>}
                 </div>
                 {v.loading ? (
                   <div className="flex items-center gap-3 py-2 opacity-50">
                     <Loader2 className="h-4 w-4 animate-spin text-accent" />
                     <span className="text-xs font-bold uppercase tracking-widest text-accent">Calling AI...</span>
                   </div>
                 ) : (
                   <p className="text-lg text-slate-300 leading-relaxed font-light">{v.definition}</p>
                 )}
              </div>

              {!v.loading && (
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
  )
}
