import { useState, useEffect } from 'react'
import { 
  Key, Folder, ShieldCheck, Cpu, ExternalLink, 
  Save, RefreshCcw, Download, CheckCircle, AlertCircle, Rocket 
} from 'lucide-react'

const SettingsView = ({ api }) => {
  const [apiKey, setApiKey] = useState('')
  const [savePath, setSavePath] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  // Update State
  const [updateStatus, setUpdateStatus] = useState('idle') // idle | checking | available | downloading | downloaded | error | not-available
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateProgress, setUpdateProgress] = useState(0)

  const [version, setVersion] = useState('0.0.0')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const key = await api.getAiKey()
        const path = await api.getSavePath()
        setApiKey(key || '')
        setSavePath(path || '')
        
        // Dynamic Version Acquisition Protocol
        const ver = await api.getVersion?.()
        if (ver) setVersion(ver)
      } catch (err) {
        console.warn('[IPC SYNC] Version acquisition deferred. Ensure system restart.', err)
      }
    }
    loadSettings()

    // Listen to updates
    if (api?.updater?.onUpdateStatus) {
      const unsubs = api.updater.onUpdateStatus((data) => {
        setUpdateStatus(data.status)
        if (data.info) setUpdateInfo(data.info)
        if (data.status === 'downloading' && data.info?.percent) {
          setUpdateProgress(Math.round(data.info.percent))
        }
      })
      return () => unsubs()
    }
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

  const handleCheckUpdate = () => {
    api?.updater?.check()
  }

  const handleInstallUpdate = () => {
    api?.updater?.install()
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin p-8 lg:p-12 bg-background transition-colors duration-500">
       <div className="max-w-3xl mx-auto space-y-12">
          
          <header className="space-y-4">
            <h1 className="text-4xl font-black text-text tracking-tight flex items-baseline gap-3">
              System Settings
              <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 font-mono">V{version}</span>
            </h1>
            <p className="text-muted text-sm max-w-xl leading-relaxed">
              Configure your AI intelligence, local storage, and system updates. All settings are stored locally on your machine for maximum privacy.
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
                       className="w-full bg-surface-2 border border-border py-4 pl-12 pr-4 text-sm text-text outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all"
                     />
                   </div>
                 </div>

                 <button 
                   onClick={handleSaveKey}
                   disabled={isSaving}
                   className="w-full bg-text text-background font-black text-xs uppercase tracking-widest py-4 hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
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
                      <div className="flex-1 bg-surface-2 border border-border px-4 py-3 flex items-center gap-3">
                         <Folder className="h-4 w-4 text-muted/40" />
                         <span className="text-sm text-text truncate">{savePath || 'Select destination path...'}</span>
                      </div>
                      <button 
                        onClick={handlePickPath}
                        className="px-6 bg-surface-3 border border-border text-xs font-bold text-text hover:bg-accent hover:text-white transition-all"
                      >
                        Change
                      </button>
                   </div>
                 </div>
               </div>
            </section>

            {/* SYSTEM UPDATES */}
            <section className="bg-surface border border-border p-8 space-y-6 shadow-2xl transition-colors duration-500">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-accent/10 text-accent">
                   <RefreshCcw className="h-5 w-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-text">Research Studio Updates</h2>
                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Automated Version Control</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-surface-2 border border-border">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-text">
                         {updateStatus === 'downloaded' ? 'Update Ready' : 
                          updateStatus === 'available' ? 'New Version Detected' :
                          updateStatus === 'downloading' ? `Downloading Patch... ${updateProgress}%` :
                          updateStatus === 'checking' ? 'Querying GitHub...' :
                          'System Up to Date'}
                       </p>
                       <p className="text-[10px] text-muted lowercase">
                         {updateStatus === 'downloaded' ? 'Synthesized patch is ready for high-fidelity deployment.' :
                          updateStatus === 'available' ? `Version ${updateInfo?.version || 'Unknown'} is available for extraction.` :
                          updateStatus === 'downloading' ? 'Background acquisition in progress. Studio remain operational.' :
                          'Current version check shows architectural parity with remote source.'}
                       </p>
                    </div>

                    <div className="flex items-center gap-3">
                       {updateStatus === 'downloaded' ? (
                          <button 
                            onClick={handleInstallUpdate}
                            className="px-6 py-2.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/10 flex items-center gap-2"
                          >
                             <Rocket className="h-3.5 w-3.5" /> Launch Patch
                          </button>
                       ) : (
                          <button 
                            onClick={handleCheckUpdate}
                            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                            className="px-6 py-2.5 bg-surface-3 border border-border text-[10px] font-black text-text uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                             {updateStatus === 'checking' ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                             Check Updates
                          </button>
                       )}
                    </div>
                 </div>

                 {updateStatus === 'downloading' && (
                    <div className="space-y-2 px-1">
                       <div className="h-1 bg-surface-3 overflow-hidden">
                          <div 
                            className="h-full bg-accent transition-all duration-300 shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" 
                            style={{ width: `${updateProgress}%` }}
                          />
                       </div>
                    </div>
                 )}

                 {updateStatus === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                       <AlertCircle className="h-3.5 w-3.5" />
                       Connection Anomaly: {updateInfo || 'GitHub Unreachable'}
                    </div>
                 )}
               </div>
            </section>

          </div>
       </div>
    </div>
  )
}

export default SettingsView
