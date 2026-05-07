import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, Folder, ShieldCheck, Cpu, ExternalLink, 
  Save, RefreshCcw, Download, CheckCircle, AlertCircle, Rocket,
  Activity, Zap, Database, Terminal, Shield, Sun, Moon, FileDown
} from 'lucide-react'

import { api as bridgeApi } from "./../../utils/api-bridge";

const SettingsView = ({ api, theme, onToggleTheme, onExport }) => {
  const activeApi = api || bridgeApi;
  const [apiKey, setApiKey] = useState('')
  const [savePath, setSavePath] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  // Update State
  const [updateStatus, setUpdateStatus] = useState('idle') 
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [version, setVersion] = useState('0.0.0')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const key = await activeApi.getAiKey()
        const path = await activeApi.getSavePath()
        setApiKey(key || '')
        setSavePath(path || '')
        const ver = await activeApi.getVersion?.()
        if (ver) setVersion(ver)
      } catch (err) {
        console.warn('[IPC SYNC] Version deferred.', err)
      }
    }
    loadSettings()

    if (activeApi?.updater?.onUpdateStatus) {
      const unsubs = activeApi.updater.onUpdateStatus((data) => {
        setUpdateStatus(data.status)
        if (data.info) setUpdateInfo(data.info)
        if (data.status === 'downloading' && data.info?.percent) {
          setUpdateProgress(Math.round(data.info.percent))
        }
      })
      return () => unsubs()
    }
  }, [activeApi])

  const handleSaveKey = async () => {
    setIsSaving(true)
    await activeApi.setAiKey(apiKey)
    setIsSaving(false)
    setShowStatus(true)
    setTimeout(() => setShowStatus(false), 3000)
  }

  const handlePickPath = async () => {
    const path = await activeApi.pickSavePath()
    if (path) {
      setSavePath(path)
      await activeApi.setSavePath(path)
    }
  }

  const handleCheckUpdate = () => activeApi?.updater?.check()
  const handleInstallUpdate = () => activeApi?.updater?.install()

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-stable p-4 lg:p-8 bg-background transition-colors duration-500 custom-scroll select-text"
      style={{ scrollbarGutter: 'stable' }}
    >
        <div className="max-w-6xl mx-auto space-y-10 pb-10">
          
          {/* PERSISTENT CORE HEADER */}
          <header className="relative space-y-3 pt-2">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-text tracking-tighter flex items-center gap-3">
                Settings
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-accent/40" />
                  <span className="text-[9px] font-mono text-accent tracking-widest uppercase opacity-70">v{version}</span>
                  <div className="h-1 w-1 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
                </div>
              </h1>
              <p className="text-muted text-[11px] max-w-lg leading-relaxed font-medium opacity-60">
                Manage the high-fidelity neural core, local repository clusters, and architectural versioning. 
              </p>
            </div>
            
            <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none">
              <Terminal className="w-48 h-48 rotate-12 text-accent" />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI RESEARCH INTELLIGENCE */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-surface border-l-2 border-l-accent border border-border p-5 space-y-4 shadow-xl transition-all hover:bg-surface-2 overflow-hidden flex flex-col rounded-[5px]"
            >
               <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap className="h-16 w-16 -rotate-12" />
               </div>

               <div className="flex items-center justify-between border-b border-border pb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-accent text-background rounded-[5px]">
                     <Cpu className="h-4 w-4" />
                   </div>
                   <div>
                     <h2 className="text-sm font-black text-text uppercase tracking-tight">Intelligence Node</h2>
                     <p className="text-[8px] text-accent font-black uppercase tracking-widest">DeepSeek Neural Cluster</p>
                   </div>
                 </div>
                 <div className="text-right hidden sm:block">
                   <span className="text-[9px] font-mono text-success block">STATUS: ONLINE</span>
                 </div>
               </div>

               <div className="space-y-4 flex-1">
                 <div className="space-y-2.5">
                   <div className="flex items-center justify-between">
                     <label className="text-[9px] font-black text-muted tracking-widest uppercase flex items-center gap-2">
                       <Key className="h-3 w-3" /> API Key
                     </label>
                   </div>
                   <input 
                     type="password"
                     value={apiKey}
                     onChange={e => setApiKey(e.target.value)}
                     placeholder="Enter auth token..."
                     className="w-full bg-surface-3 border border-border py-3.5 px-4 text-[13px] text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-mono placeholder:opacity-30"
                   />
                 </div>

                 <div className="flex items-center gap-3 pt-1">
                   <button 
                     onClick={handleSaveKey}
                     disabled={isSaving}
                     className="flex-1 bg-text text-background font-black text-[9px] uppercase tracking-[0.1em] py-2.5 px-4 hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 rounded-[5px] disabled:opacity-50 active:scale-[0.98]"
                   >
                     <AnimatePresence mode="wait">
                       {isSaving ? (
                         <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                           <RefreshCcw className="h-3 w-3 animate-spin" /> Syncing...
                         </motion.div>
                       ) : (
                         <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                           <Save className="h-3 w-3" /> Harden Config
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </button>

                   <AnimatePresence>
                     {showStatus && (
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                         className="flex items-center gap-2 px-4 py-3.5 bg-success/10 border border-success/20 text-success text-[9px] font-black uppercase tracking-widest"
                       >
                         <ShieldCheck className="h-4 w-4" /> Stabilized
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               </div>
            </motion.section>

            {/* STORAGE ARCHITECTURE */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative bg-surface border border-border p-5 space-y-4 shadow-xl transition-all hover:bg-surface-2 flex flex-col rounded-[5px]"
            >
               <div className="flex items-center justify-between border-b border-border pb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-surface-3 text-text rounded-[5px] border border-border">
                     <Database className="h-4 w-4" />
                   </div>
                   <div>
                     <h2 className="text-sm font-black text-text uppercase tracking-tight">Repository Root</h2>
                     <p className="text-[8px] text-muted font-black uppercase tracking-widest">Asset Persistence Layer</p>
                   </div>
                 </div>
               </div>

               <div className="space-y-4 flex-1">
                 <div className="space-y-2.5">
                   <label className="text-[9px] font-black text-muted tracking-widest uppercase">Target Extraction Path</label>
                   <div className="flex flex-col sm:flex-row border border-border rounded-[5px] overflow-hidden focus-within:border-accent/40 transition-colors">
                      <div className="flex-1 bg-surface-3 px-4 py-3.5 flex items-center gap-3 min-w-0">
                         <Folder className="h-3.5 w-3.5 text-accent/50 shrink-0" />
                         <span className="text-[11px] text-text font-mono truncate tracking-tight">{savePath || 'Pending selection...'}</span>
                      </div>
                      <button 
                        onClick={handlePickPath}
                        className="px-4 py-2.5 bg-surface-2 border-l border-border text-[8px] font-black text-text uppercase tracking-widest hover:bg-accent hover:text-white transition-all shrink-0"
                      >
                        Re-Route
                      </button>
                   </div>
                 </div>
               </div>
            </motion.section>

            {/* NEURAL AESTHETICS (THEME) */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="group relative bg-surface border border-border p-5 space-y-4 shadow-xl transition-all hover:bg-surface-2 flex flex-col rounded-[5px]"
            >
               <div className="flex items-center justify-between border-b border-border pb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-surface-3 text-text rounded-[5px] border border-border">
                     {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                   </div>
                   <div>
                     <h2 className="text-sm font-black text-text uppercase tracking-tight">Neural Aesthetics</h2>
                     <p className="text-[8px] text-muted font-black uppercase tracking-widest">Interface Mode</p>
                   </div>
                 </div>
               </div>

               <div className="space-y-4 flex-1">
                 <button 
                   onClick={onToggleTheme}
                   className="w-full py-3.5 bg-surface-3 border border-border text-[9px] font-black text-text uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 rounded-[5px]"
                 >
                   {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-orange-400" /> : <Moon className="h-3.5 w-3.5 text-accent" />}
                   Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                 </button>
               </div>
            </motion.section>

            {/* DOSSIER ENGINE (EXPORT) */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="group relative bg-surface border border-border p-5 space-y-4 shadow-xl transition-all hover:bg-surface-2 flex flex-col rounded-[5px]"
            >
               <div className="flex items-center justify-between border-b border-border pb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-surface-3 text-text rounded-[5px] border border-border">
                     <FileDown className="h-4 w-4" />
                   </div>
                   <div>
                     <h2 className="text-sm font-black text-text uppercase tracking-tight">Dossier Engine</h2>
                     <p className="text-[8px] text-muted font-black uppercase tracking-widest">Global Archive Export</p>
                   </div>
                 </div>
               </div>

               <div className="space-y-4 flex-1">
                 <button 
                   onClick={onExport}
                   className="w-full py-3.5 bg-text text-background font-black text-[9px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 rounded-[5px]"
                 >
                   <FileDown className="h-3.5 w-3.5" />
                   Generate Research Dossier
                 </button>
               </div>
            </motion.section>

            {/* VERSION CONTROL CLUSTER */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative bg-surface border border-border overflow-hidden lg:col-span-2 flex flex-col rounded-[5px]"
            >
               <div className="p-5 space-y-4 flex-1">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-surface-3 text-text rounded-[5px] border border-border">
                     <RefreshCcw className="h-4 w-4" />
                   </div>
                   <div>
                     <h2 className="text-sm font-black text-text uppercase tracking-tight">Version Parity</h2>
                     <p className="text-[8px] text-muted font-black uppercase tracking-widest">Automated Patch Stream</p>
                   </div>
                 </div>

                 <div className="grid sm:grid-cols-[1fr,auto] items-center gap-6 p-5 bg-surface-2 border border-border relative">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-[11px] font-black text-text uppercase tracking-tight">
                            {updateStatus === 'downloaded' ? 'SYNTHESIS COMPLETE' : 
                             updateStatus === 'available' ? 'REMOTE UPDATE DETECTED' :
                             updateStatus === 'downloading' ? `STREAMING PATCH...` :
                             updateStatus === 'checking' ? 'QUERYING REMOTE...' :
                             'ARCHITECTURAL PARITY'}
                          </p>
                          <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                        </div>
                        <p className="text-[9px] text-muted leading-relaxed uppercase tracking-wider font-semibold max-w-md">
                          {updateStatus === 'downloaded' ? 'A new architectural layer is ready. Restart required.' :
                           updateStatus === 'available' ? `Neural Shield Version ${updateInfo?.version || 'N/A'} staged.` :
                           updateStatus === 'downloading' ? 'Asynchronous acquisition active.' :
                           'System environment matches the remote master release.'}
                        </p>
                    </div>

                    <div className="w-full sm:w-auto">
                       {updateStatus === 'downloaded' ? (
                          <button 
                            onClick={handleInstallUpdate}
                            className="w-full sm:w-48 py-3.5 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 rounded-[5px]"
                          >
                             <Rocket className="h-3.5 w-3.5" /> Finalize
                          </button>
                       ) : (
                          <button 
                            onClick={handleCheckUpdate}
                            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                            className="w-full sm:w-48 py-3.5 bg-surface-3 border border-border text-[9px] font-black text-text uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-30 rounded-[5px] flex items-center justify-center gap-2"
                          >
                             <RefreshCcw className={`h-3.5 w-3.5 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                             Update
                          </button>
                       )}
                    </div>
                 </div>

                 {updateStatus === 'downloading' && (
                    <div className="space-y-2 px-1">
                       <div className="flex justify-between items-center text-[8px] font-black text-accent tracking-widest uppercase">
                         <span>Downlink Stream</span>
                         <span>{updateProgress}%</span>
                       </div>
                       <div className="h-1 bg-surface-3 relative overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${updateProgress}%` }} className="h-full bg-accent" />
                       </div>
                    </div>
                 )}

                 {updateStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest"
                    >
                       <AlertCircle className="h-4 w-4" />
                       Downlink Interrupted: {updateInfo || 'Cluster Timeout'}
                    </motion.div>
                 )}
               </div>
            </motion.section>

          </div>
        </div>
    </motion.div>
  )
}

export default SettingsView
