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
      setApiKey(key || '')
      setSavePath(path || '')
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
    if (path) {
      setSavePath(path)
      await api.setSavePath(path)
    }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin p-8 lg:p-12 bg-background transition-colors duration-500">
       <div className="max-w-3xl mx-auto space-y-12">
          
          <header className="space-y-4">
            <h1 className="text-4xl font-black text-text tracking-tight">System Settings</h1>
            <p className="text-muted text-sm max-w-xl leading-relaxed">
              Configure your AI intelligence and local storage. All settings are stored locally on your machine for maximum privacy.
            </p>
          </header>

          <div className="grid gap-8">
            
            {/* AI CONFIGURATION */}
            <section className="bg-surface border border-border p-8 space-y-6 shadow-2xl transition-colors duration-500">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-accent/10 text-accent">
                   <Cpu className="h-5 w-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-text">DeepSeek Intelligence</h2>
                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Natural Language Processing</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-muted flex items-center justify-between">
                     <span>API AUTHENTICATION KEY</span>
                     <button className="text-[9px] text-accent hover:underline flex items-center gap-1">
                       MANAGE KEYS <ExternalLink className="h-2.5 w-2.5" />
                     </button>
                   </label>
                   <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 group-focus-within:text-accent transition-colors">
                        <Key className="h-4 w-4" />
                     </div>
                     <input 
                       type="password"
                       value={apiKey}
                       onChange={e => setApiKey(e.target.value)}
                       placeholder="sk-..."
                       className="w-full bg-surface-2 border border-border py-4 pl-12 pr-4 text-sm text-text outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all "
                     />
                   </div>
                 </div>

                 <button 
                   onClick={handleSaveKey}
                   disabled={isSaving}
                   className="w-full bg-text text-background font-black text-xs uppercase tracking-widest py-4 hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50 "
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
            <section className="bg-surface border border-border p-8 space-y-6 shadow-2xl transition-colors duration-500">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-accent/10 text-accent">
                   <Folder className="h-5 w-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-text">Storage Infrastructure</h2>
                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Local Asset Management</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-muted">DOWNLOAD DESTINATION</label>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-surface-2 border border-border px-4 py-3 flex items-center gap-3 ">
                         <Folder className="h-4 w-4 text-muted/40" />
                         <span className="text-sm text-text truncate">{savePath || 'Select destination path...'}</span>
                      </div>
                      <button 
                        onClick={handlePickPath}
                        className="px-6 bg-surface-3 border border-border text-xs font-bold text-text hover:bg-accent hover:text-white transition-all "
                      >
                        Change
                      </button>
                   </div>
                 </div>
               </div>
            </section>

          </div>
       </div>
    </div>
  )
}

export default SettingsView
