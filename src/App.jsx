import Sidebar from './components/Sidebar'
import MainView from './components/MainView'
import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

export default function App() {
  const [savePath, setSavePath] = useState('')
  const [view, setView] = useState('search') // 'search' | 'vocab' | 'settings'
  const [vocab, setVocab] = useState([])

  const addVocab = (item) => {
    if (!vocab.some(v => v.text === item.text)) {
      setVocab(prev => [item, ...prev])
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
              <h1 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">My Vocabulary</h1>
              <div className="grid gap-4">
                {vocab.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-muted italic">Click the "+" icon on any transcript to save words here.</p>
                  </div>
                ) : (
                  vocab.map((v, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between group hover:border-accent/40 transition-all">
                      <div>
                        <p className="text-lg font-medium text-white">{v.text}</p>
                        <p className="text-[10px] text-muted mt-1 uppercase tracking-tighter">From: {v.videoTitle}</p>
                      </div>
                      <button onClick={() => setVocab(vocab.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        Remove
                      </button>
                    </div>
                  ))
                )}
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
