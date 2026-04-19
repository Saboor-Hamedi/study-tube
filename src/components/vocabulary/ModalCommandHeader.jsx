import React, { memo } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'

/**
 * ModalCommandHeader: A standardized industrial header for research studio sidebars.
 * Provides uniform icon geometry, labeling, and window management nodes.
 */
const ModalCommandHeader = ({ 
  title = "Hub-Zero", 
  subtitle = "Node", 
  Icon, 
  onClose, 
  onMaximize, 
  isMaximized 
}) => {
  return (
    <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-2">
        <div className="rounded-[5px] border border-accent/20 bg-accent/10 p-2">
          {Icon && <Icon className="h-4 w-4 text-accent" />}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text">{title}</span>
          <span className="text-[7px] font-bold uppercase tracking-widest text-muted/30">{subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {onMaximize && (
          <button 
            onClick={onMaximize} 
            className="rounded-[5px] border border-border bg-surface-2 p-2 text-muted transition-all hover:bg-accent hover:text-white"
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        )}
        <button 
          onClick={onClose} 
          className="rounded-[5px] border border-red-500/10 bg-red-500/10 p-2 text-red-500 transition-all hover:bg-red-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default memo(ModalCommandHeader)
