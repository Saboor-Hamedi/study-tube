import { useState, useEffect } from 'react'
import { Key, Folder, ShieldCheck, Cpu, ExternalLink, Save } from 'lucide-react'

const SettingsView = ({ api }) => {
  const [apiKey, setApiKey] = useState('')
  const [savePath, setSavePath] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const key = await api.getAiKey()
      const path = await api.getSavePath()
      setApiKey(key)
      setSavePath(path)
    }
    loadSettings()
  }, [api])

  const handleSaveKey = async () => {
    setIsSaving(true)
    await api.setAiKey(apiKey)
    setIsSaving(false)
    setShowStatus(true)
    setTimeout(() => setShowStatus(false), 3000)
  }

  const handlePickPath = async () => {
    const path = await api.pickSavePath()
    if (path) setSavePath(path)
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin p-8 lg:p-12 bg-[#0a0a0a]">
       <div className="max-w-3xl mx-auto space-y-12">
          
          <header className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tight">System Settings</h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Configure your AI intelligence and local storage. All settings are stored locally on your machine for maximum privacy.
            </p>
          </header>

          <div className="grid gap-8">
            
            {/* AI CONFIGURATION */}
            <section className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                   <Cpu className="h-5 w-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-white">DeepSeek Intelligence</h2>
                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Natural Language Processing</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
                     <span>DeepSeek API Key</span>
                     <a href="https://platform.deepseek.com/" target="_blank" className="text-accent flex items-center gap-1 hover:underline">
                       Get Key <ExternalLink className="h-3 w-3" />
                     </a>
                   </label>
                   <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                       <Key className="h-4 w-4" />
                     </div>
                     <input 
                       type="password"
                       value={apiKey}
                       onChange={e => setApiKey(e.target.value)}
                       placeholder="sk-..."
                       className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all"
                     />
                   </div>
                 </div>

                 <button 
                   onClick={handleSaveKey}
                   disabled={isSaving}
                   className="w-full bg-white text-black font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                 >
                   {isSaving ? (
                     <span className="animate-pulse">Saving...</span>
                   ) : (
                     <>
                        <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Save AI Configuration
                     </>
                   )}
                 </button>

                 {showStatus && (
                   <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest justify-center animate-bounce">
                     <ShieldCheck className="h-4 w-4" />
                     Configuration Applied Successfully
                   </div>
                 )}
               </div>
            </section>

            {/* STORAGE CONFIGURATION */}
            <section className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-white/5 rounded-xl text-white/40">
                   <Folder className="h-5 w-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-white">Local Storage</h2>
                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Library & Downloads</p>
                 </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">Download Directory</label>
                    <div className="flex gap-2">
                       <div className="flex-1 bg-black border border-white/10 rounded-2xl py-4 px-6 text-[13px] text-slate-300 truncate">
                         {savePath || 'Standard Downloads'}
                       </div>
                       <button 
                         onClick={handlePickPath}
                         className="px-6 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-widest"
                       >
                         Change
                       </button>
                    </div>
                  </div>
               </div>
            </section>

          </div>

          <footer className="pt-8 border-t border-white/5 flex items-center justify-between text-muted/20 text-[10px] font-bold uppercase tracking-[0.2em] italic">
            <span>studyTube v1.2.0</span>
            <span>Research Grade Dashboard</span>
          </footer>

       </div>
    </div>
  )
}

export default SettingsView
