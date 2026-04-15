import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, Folder, ShieldCheck, Cpu, ExternalLink, 
  Save, RefreshCcw, Download, CheckCircle, AlertCircle, Rocket,
  Activity, Zap, Database, Terminal
} from 'lucide-react'

const SettingsView = ({ api }) => {
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
        const key = await api.getAiKey()
        const path = await api.getSavePath()
        setApiKey(key || '')
        setSavePath(path || '')
        const ver = await api.getVersion?.()
        if (ver) setVersion(ver)
      } catch (err) {
        console.warn('[IPC SYNC] Version deferred.', err)
      }
    }
    loadSettings()

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

  const handleCheckUpdate = () => api?.updater?.check()
  const handleInstallUpdate = () => api?.updater?.install()

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-stable p-6 lg:p-12 bg-background transition-colors duration-500 custom-scroll select-text"
      style={{ scrollbarGutter: 'stable' }}
    >
       <div className="max-w-4xl mx-auto space-y-16 min-h-full pb-20">
          
          {/* PERSISTENT CORE HEADER */}
          <header className="relative space-y-6 pt-8">
            <div className="flex items-center gap-4 text-accent animate-pulse opacity-40">
              <Activity className="h-4 w-4" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">System Calibration Active</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-text tracking-tighter flex items-center gap-4">
                Core Settings
                <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-3 py-1 font-mono tracking-widest uppercase">
                  Shield_V{version}
                </span>
              </h1>
              <p className="text-muted text-sm max-w-2xl leading-relaxed font-medium">
                Manage the high-fidelity neural core, local repository clusters, and architectural versioning. 
                All parameters remain isolated within your local environment.
              </p>
            </div>
            
            <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none">
              <Terminal className="w-64 h-64 rotate-12 text-accent" />
            </div>
          </header>

          <div className="grid gap-10">
            
            {/* AI RESEARCH INTELLIGENCE */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-surface border-l-4 border-l-accent border border-border p-10 space-y-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all hover:bg-surface-2 overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap className="h-24 w-24 -rotate-12" />
               </div>

               <div className="flex items-center justify-between border-b border-border pb-6">
                 <div className="flex items-center gap-5">
                   <div className="p-3 bg-accent text-background rounded-sm">
                     <Cpu className="h-6 w-6" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-text uppercase tracking-tight">Intelligence Node</h2>
                     <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">DeepSeek Neural Cluster</p>
                   </div>
                 </div>
                 <div className="text-right hidden sm:block">
                   <span className="text-[10px] font-mono text-muted block italic">LATENCY_OPTIMIZED: 400ms</span>
                   <span className="text-[10px] font-mono text-success block">STATUS: ONLINE</span>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-muted tracking-widest uppercase flex items-center gap-2">
                       <Key className="h-3 w-3" /> API Authentication Key
                     </label>
                     <button className="text-[9px] text-accent font-black hover:tracking-widest transition-all flex items-center gap-1.5 uppercase">
                       Vault Access <ExternalLink className="h-3 w-3" />
                     </button>
                   </div>
                   
                   <div className="relative">
                     <input 
                       type="password"
                       value={apiKey}
                       onChange={e => setApiKey(e.target.value)}
                       placeholder="Enter high-fidelity auth token..."
                       className="w-full bg-surface-3 border border-border py-5 px-6 text-sm text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all font-mono placeholder:opacity-30"
                     />
                   </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 pt-2">
                   <button 
                     onClick={handleSaveKey}
                     disabled={isSaving}
                     className="flex-1 bg-text text-background font-black text-xs uppercase tracking-[0.15em] py-5 px-8 hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 active:scale-[0.98]"
                   >
                     <AnimatePresence mode="wait">
                       {isSaving ? (
                         <motion.div 
                           key="saving"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="flex items-center gap-2"
                         >
                           <RefreshCcw className="h-4 w-4 animate-spin" /> Synchronizing...
                         </motion.div>
                       ) : (
                         <motion.div 
                           key="save"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="flex items-center gap-2"
                         >
                           <Save className="h-4 w-4" /> Hardening Configuration
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </button>

                   <AnimatePresence>
                     {showStatus && (
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="flex items-center gap-3 px-6 py-4 bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest"
                       >
                         <ShieldCheck className="h-5 w-5" />
                         Protocol Stabilized
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
              className="group relative bg-surface border border-border p-10 space-y-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all hover:bg-surface-2"
            >
               <div className="flex items-center justify-between border-b border-border pb-6">
                 <div className="flex items-center gap-5">
                   <div className="p-3 bg-surface-3 text-text rounded-sm border border-border">
                     <Database className="h-6 w-6" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-text uppercase tracking-tight">Repository Root</h2>
                     <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">Asset Persistence Layer</p>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-muted tracking-widest uppercase">Target Extraction Path</label>
                   <div className="flex flex-col sm:flex-row gap-0 border border-border group/input focus-within:border-accent/40 transition-colors">
                      <div className="flex-1 bg-surface-3 px-6 py-5 flex items-center gap-4 min-w-0">
                         <Folder className="h-4 w-4 text-accent/50 shrink-0" />
                         <span className="text-xs text-text font-mono truncate tracking-tight">{savePath || 'Pending selection...'}</span>
                      </div>
                      <button 
                        onClick={handlePickPath}
                        className="px-10 py-5 bg-surface-2 border-l border-border text-[10px] font-black text-text uppercase tracking-widest hover:bg-accent hover:text-white transition-all shrink-0 active:bg-accent-hover"
                      >
                        Re-Route
                      </button>
                   </div>
                 </div>
               </div>
            </motion.section>

            {/* VERSION CONTROL CLUSTER */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative bg-surface border border-border overflow-hidden"
            >
               <div className="p-10 space-y-8">
                 <div className="flex items-center gap-5">
                   <div className="p-3 bg-surface-3 text-text rounded-sm border border-border">
                     <RefreshCcw className="h-6 w-6" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-text uppercase tracking-tight">Version Parity</h2>
                     <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">Automated Patch Stream</p>
                   </div>
                 </div>

                 <div className="grid sm:grid-cols-[1fr,auto] items-center gap-8 p-8 bg-surface-2 border border-border relative">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-text uppercase tracking-tight">
                            {updateStatus === 'downloaded' ? 'SYNTHESIS COMPLETE' : 
                             updateStatus === 'available' ? 'REMOTE UPDATE DETECTED' :
                             updateStatus === 'downloading' ? `STREAMING PATCH...` :
                             updateStatus === 'checking' ? 'QUERYING REMOTE...' :
                             'ARCHITECTURAL PARITY'}
                          </p>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                        </div>
                        <p className="text-[10px] text-muted leading-relaxed uppercase tracking-wider font-semibold max-w-md">
                          {updateStatus === 'downloaded' ? 'A new architectural layer is ready for high-fidelity deployment. Restart required.' :
                           updateStatus === 'available' ? `Neural Shield Version ${updateInfo?.version || 'N/A'} is staged for extraction.` :
                           updateStatus === 'downloading' ? 'Asynchronous acquisition from GitHub master cluster is currently active.' :
                           'Current system environment matches the remote master release configuration.'}
                        </p>
                    </div>

                    <div className="w-full sm:w-auto">
                       {updateStatus === 'downloaded' ? (
                          <button 
                            onClick={handleInstallUpdate}
                            className="w-full sm:w-64 py-5 bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-green-600 transition-all shadow-[0_15px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3"
                          >
                             <Rocket className="h-4 w-4" /> Finalize Patch
                          </button>
                       ) : (
                          <button 
                            onClick={handleCheckUpdate}
                            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                            className="w-full sm:w-64 py-5 bg-surface-3 border border-border text-[10px] font-black text-text uppercase tracking-[0.2em] hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                          >
                             <RefreshCcw className={`h-4 w-4 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                             Sync Status
                          </button>
                       )}
                    </div>
                 </div>

                 {updateStatus === 'downloading' && (
                    <div className="space-y-3 px-1">
                       <div className="flex justify-between items-center text-[9px] font-black text-accent tracking-[0.3em] uppercase">
                         <span>Downlink Stream</span>
                         <span>{updateProgress}%</span>
                       </div>
                       <div className="h-1 bg-surface-3 relative overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${updateProgress}%` }}
                            className="h-full bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]" 
                          />
                       </div>
                    </div>
                 )}

                 {updateStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                       <AlertCircle className="h-5 w-5" />
                       Downlink Interrupted: {updateInfo || 'Cluster Timeout'}
                    </motion.div>
                 )}
               </div>
               
               <div className="h-1 w-full bg-border mt-auto">
                 <div className="h-full bg-accent w-1/3 opacity-20" />
               </div>
            </motion.section>

          </div>
       </div>
    </motion.div>
  )
}

export default SettingsView
