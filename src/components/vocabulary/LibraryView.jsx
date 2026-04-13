import { Loader2, Trash2 } from 'lucide-react'

export default function LibraryView({ vocab, setVocab, searchQuery, sortBy, displayLimit, setDisplayLimit, api }) {
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
    <div className="grid gap-6 p-6 lg:p-8">
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
  )
}
