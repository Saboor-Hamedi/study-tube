import { memo } from 'react'
import { 
  Library, Sparkles, Brain, ListChecks, 
  Loader2, Star, RefreshCcw, Pencil, Copy,
  ExternalLink
} from 'lucide-react'
import ModalCommandHeader from './ModalCommandHeader'

const AnalyticalSidebar = ({ 
  item,
  isEditing,
  isSummarizing,
  isHighlighting,
  highlights,
  setHighlights,
  handleSaveEdit,
  setIsEditing,
  handleGenerateSummary,
  handleIdentifyVocab,
  showToast,
  onExpand,
  onClose,
  isMaximized,
  onMaximize,
  mode = 'workspace', // 'workspace' | 'modal' | 'capture'
  children
}) => {
  const isModal = mode === 'modal' || mode === 'capture'
  const isCapture = mode === 'capture'

  return (
    <aside className={`shrink-0 border-l border-border bg-surface-2 flex flex-col relative z-50 ${isModal ? 'w-[280px]' : 'w-[260px] pt-8 overflow-y-auto'} ${isModal && !isMaximized ? 'rounded-r-[5px]' : ''} scrollbar-thin`}>
      
      {isModal && (
        <ModalCommandHeader 
          title={isCapture ? "Capture" : "Hub-Zero"} 
          subtitle={isCapture ? "Node Interface" : "Archive"} 
          Icon={isCapture ? Brain : Library} 
          onClose={onClose} 
          onMaximize={onMaximize}
          isMaximized={isMaximized}
        />
      )}
      
      <div className={`flex-1 overflow-y-auto scrollbar-thin space-y-8 ${isModal ? 'p-6 pt-8' : 'px-5'}`}>
        {children}

        {!isCapture && (
          <>
            {/* Control Matrix */}
            <div className="space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted px-1 flex items-center gap-2 opacity-30">
                <Star className="h-3 w-3" /> Intelligence
              </p>
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <button onClick={handleSaveEdit} className="w-full py-2.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 rounded-[5px]">Commit Changes</button>
                    <button onClick={() => setIsEditing(false)} className="w-full py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all rounded-[5px] border border-red-500/20">Abort Edit</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => setIsEditing(true)} className="py-2.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-[5px]">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${item.text}\n\n${item.definition}`)
                          showToast('Copied to Nexus')
                        }}
                        className="py-2.5 bg-surface-3 border border-border text-text text-[9px] font-black uppercase tracking-widest hover:bg-text hover:text-background transition-all flex items-center justify-center gap-2 rounded-[5px]"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    {isModal && onExpand && (
                      <button 
                        onClick={() => {
                          onExpand(item)
                          onClose()
                        }}
                        className="w-full py-3 bg-surface-3 border border-accent/20 text-accent hover:bg-accent hover:text-white text-[9px] font-black uppercase tracking-widest transition-all rounded-[5px] flex items-center justify-center gap-2 group"
                      >
                        <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:scale-110" /> 
                        Expand Research Page
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-border/20" />

            {/* Neural Logic Blocks */}
            <div className="space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted px-1 flex items-center gap-2 opacity-30">
                <Brain className="h-3 w-3" /> Logic Blocks
              </p>
              <div className="space-y-2">
                <button 
                  onClick={handleGenerateSummary} 
                  disabled={isSummarizing || isEditing} 
                  className="w-full p-3 bg-accent/5 border border-accent/10 hover:border-accent/40 rounded-[5px] flex items-center gap-3 group transition-all disabled:opacity-30 text-left"
                >
                  <div className="p-1.5 bg-accent/10 rounded-[3px]">
                      {isSummarizing ? <Loader2 className="h-3 w-3 animate-spin text-accent" /> : <Sparkles className="h-3 w-3 text-accent transition-colors group-hover:text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text uppercase tracking-widest group-hover:text-accent transition-colors">Synthesis</p>
                    <p className="text-[8px] text-muted uppercase tracking-tight">Core Pillars</p>
                  </div>
                </button>

                <div className="flex gap-1.5">
                  <button 
                    onClick={handleIdentifyVocab} 
                    disabled={isHighlighting || isEditing} 
                    className="flex-1 p-3 bg-surface-3 border border-border hover:border-text/20 rounded-[5px] flex items-center gap-3 group transition-all disabled:opacity-30 text-left"
                  >
                    <div className="p-1.5 bg-muted/10 rounded-[3px]">
                        {isHighlighting ? <Loader2 className="h-3 w-3 animate-spin text-muted" /> : <ListChecks className="h-3 w-3 text-text" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text uppercase tracking-widest">Heatmap</p>
                      <p className="text-[8px] text-muted uppercase tracking-tight">Terminology</p>
                    </div>
                  </button>
                  {highlights.length > 0 && (
                    <button 
                      onClick={() => { setHighlights([]); showToast('Heatmap Purged') }}
                      className="px-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/10 rounded-[5px]"
                      title="Purge Heatmap"
                    >
                      <RefreshCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

export default memo(AnalyticalSidebar)
