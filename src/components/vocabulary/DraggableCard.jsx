import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Library, FileText, X, Folder } from 'lucide-react'
import { memo } from 'react'

export const DroppableFolder = memo(({ id, active, onClick, children, onDelete }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`group relative flex items-center transition-all duration-200 ${isOver ? 'z-10 bg-accent/5' : 'bg-transparent'}`}
    >
      <div className={`absolute left-0 w-[2px] h-3 transition-all duration-300 ${active ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />

      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 transition-all duration-200 border rounded-[5px] ${
          isOver 
            ? 'bg-accent/10 border-accent/30 text-accent' 
            : active 
              ? 'bg-accent/5 border-accent/10 text-accent font-bold' 
              : 'bg-transparent border-transparent text-muted/50 hover:bg-surface-2 hover:text-text'
        }`}
      >
        <div className={`transition-colors duration-200 ${active || isOver ? 'text-accent' : 'opacity-40 group-hover:opacity-100'}`}>
          {id === 'all' ? (
            <Library className="h-3 w-3" />
          ) : id === 'unorganized' ? (
            <FileText className="h-3 w-3" />
          ) : (
            <Folder className="h-3 w-3" />
          )}
        </div>
        <span className="text-[10px] uppercase font-black tracking-[0.2em] truncate flex-1 text-left">{children}</span>
        
        {onDelete && (
          <div
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:text-white text-muted/20 transition-all rounded-[5px]"
          >
            <X className="h-2.5 w-2.5" />
          </div>
        )}
      </button>
    </div>
  )
})

export const DraggableCard = memo(({ id, v, children, useHandle = false }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: v
  })

  // INDUSTRIAL GHOST PROTOCOL: 
  // We do NOT apply transform to the original card. 
  // This keeps the original card static (at low opacity) while the DragOverlay moves.
  // This eliminates 'sluggishness' and solves 'whole card moving' visual confusion.
  const style = {
    opacity: isDragging ? 0.3 : 1,
    cursor: useHandle ? 'default' : 'grab'
  }

  if (useHandle) {
    return (
      <div ref={setNodeRef} style={style} className="relative">
        {typeof children === 'function' ? children({ attributes, listeners }) : children}
      </div>
    )
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`active:cursor-grabbing ${isDragging ? 'z-[200]' : ''}`}
    >
      {children}
    </div>
  )
})
