import Sidebar from './components/Sidebar'
import MainView from './components/MainView'
import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, Trash2, Search as SearchIcon } from 'lucide-react'

export default function App() {
  const [savePath, setSavePath] = useState('')
  const [view, setView] = useState('search') // 'search' | 'vocab' | 'settings'
  const [vocab, setVocab] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'az'
  const [displayLimit, setDisplayLimit] = useState(10)
  const api = window.youtubeAPI

  // Load vocab once
  useEffect(() => {
    if (api) api.loadVocab().then(list => setVocab(list || [])).catch(() => {})
  }, [api])

  const addVocab = async (item) => {
    // Optimistic add (basic)
    const basicItem = { ...item, date: new Date().toISOString(), loading: true }
    setVocab(prev => {
      const newList = [basicItem, ...prev]
      api.saveVocab(newList)
      return newList
    })

    // AI Enrichment
    try {
      const entry = await api.explainWord({ text: item.text, videoTitle: item.videoTitle })
      setVocab(prev => {
        const newList = prev.map(v => v.text === item.text && v.loading ? entry : v)
        api.saveVocab(newList)
        return newList
      })
    } catch (e) {
      console.error('AI Enrichment failed', e)
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-[#e2e2e2] overflow-hidden font-sans">
      <Sidebar view={view} setView={setView} />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Search View (Persistent Layer) */}
        <div className={`absolute inset-0 ${view !== 'search' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
          <MainView savePath={savePath} setSavePath={setSavePath} onAddVocab={addVocab} />
        </div>

        {/* Other views (Scrollable Layer) */}
        <div className={`absolute inset-0 overflow-y-auto scrollbar-thin ${view === 'search' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
          <div className="max-w-5xl mx-auto p-6 lg:p-8">
            {/* Vocabulary View */}
            <div className={view !== 'vocab' ? 'hidden' : 'space-y-6'}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 bg-[#0f0f0f] pb-4">
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
                       className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-accent/50 focus:bg-white/[0.07] transition-all outline-none placeholder:text-muted/50"
                     />
                  </div>
                  
                  {/* Custom Sort Dropdown */}
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
                ) : (() => {
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
                    <>
                      {filtered.slice(0, displayLimit).map((v, i) => (
                        <div key={i} className="p-6 rounded-[1.5rem] bg-black border border-white/10 flex flex-col gap-4 group relative overflow-hidden transition-all hover:border-accent/40 shadow-2xl hover:shadow-accent/5">
                          {/* content same as before ... */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-white leading-tight tracking-tight">{v.text}</p>
                                {v.type && (
                                  <span className="px-2 py-0.5 bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest rounded-md border border-accent/20">
                                    {v.type}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                                 <p className="text-[9px] text-muted font-bold uppercase tracking-widest">{v.videoTitle}</p>
                              </div>
                            </div>
                            <button onClick={() => {
                              const newList = vocab.filter(item => item !== v)
                              setVocab(newList)
                              api.saveVocab(newList)
                            }} className="opacity-0 group-hover:opacity-100 p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {v.loading ? (
                            <div className="flex items-center gap-3 py-4 bg-white/[0.02] rounded-xl px-4 border border-dashed border-white/5">
                               <Loader2 className="h-4 w-4 animate-spin text-accent" />
                               <span className="text-[11px] text-muted font-medium italic">Enriching word with AI Context...</span>
                            </div>
                          ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-700">
                           {v.definition && (
                             <div className="space-y-1.5">
                               <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] opacity-40">Definition</p>
                               <p className="text-[15px] text-white leading-relaxed font-medium">{v.definition}</p>
                             </div>
                           )}
                           {v.usage && (
                             <div className="space-y-1.5 border-l-2 border-accent pl-4 py-1">
                               <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] opacity-40">Usage Note</p>
                               <p className="text-[13px] text-slate-400 leading-relaxed font-normal">{v.usage}</p>
                             </div>
                           )}
                           {(v.example || v.example2) && (
                             <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.05]">
                               <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] opacity-40">Contextual Examples</p>
                               <div className="space-y-2">
                                 {v.example && <p className="text-sm text-slate-300 italic leading-relaxed">"{v.example}"</p>}
                                 {v.example2 && <p className="text-sm text-slate-300 italic leading-relaxed border-t border-white/5 pt-2">"{v.example2}"</p>}
                               </div>
                             </div>
                           )}
                        </div>
                          )}
                        </div>
                      ))}
                      
                      {filtered.length > displayLimit && (
                        <button 
                          onClick={() => setDisplayLimit(prev => prev + 20)}
                          className="w-full py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-white border-2 border-dashed border-white/5 rounded-[1.5rem] transition-all hover:bg-white/[0.02] hover:border-accent/40"
                        >
                          Discover More {filtered.length - displayLimit} Words
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Settings View */}
            <div className={view !== 'settings' ? 'hidden' : ''}>
              <SettingsPanel api={window.youtubeAPI} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SettingsPanel({ api }) {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api?.getAiKey().then(k => setKey(k))
  }, [api])

  const save = async () => {
    await api?.setAiKey(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-2">DeepSeek API Key</label>
          <input 
            type="password" 
            value={key} 
            onChange={e => setKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition"
          />
          <p className="text-[10px] text-muted mt-2">Required for "Analyze with AI" feature. Get your key at deepseek.com.</p>
        </div>
        
        <button 
          onClick={save}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition"
        >
          {saved ? <CheckCircle className="h-4 w-4" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
