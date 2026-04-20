import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Library, FileText, X, Folder, GripVertical as GripIcon, Trash2 } from 'lucide-react'
import { memo } from 'react'

export const DroppableFolder = memo(({ id, active, onClick, children, onDelete }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className="group relative"
    >
      <div className={`absolute left-0 w-[2px] h-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${active ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />

      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 transition-all duration-200 border  text-left ${
          isOver 
            ? 'bg-accent text-white border-accent shadow-[0_4px_12px_rgba(var(--accent-rgb),0.3)] z-10' 
            : active 
              ? 'bg-accent/5 border-accent/10 text-accent font-bold' 
              : 'bg-transparent border-transparent text-muted hover:bg-surface-3 hover:text-text'
        }`}
      >
        <div className={`transition-colors duration-200 ${isOver ? 'text-white' : active ? 'text-accent' : 'opacity-40 group-hover:opacity-100'}`}>
          {id === 'all' ? (
            <Library className="h-3.5 w-3.5" />
          ) : id === 'trash' ? (
            <Trash2 className="h-3.5 w-3.5" />
          ) : (
            <Folder className="h-3.5 w-3.5" />
          )}
        </div>
        <span className={`text-[10px] uppercase font-black tracking-[0.2em] truncate flex-1 ${isOver ? 'text-white' : ''}`}>{children}</span>
        
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
  // Keeps the original card static (at low opacity) while the DragOverlay moves.
  const style = {
    opacity: isDragging ? 0.2 : 1,
    cursor: useHandle ? 'default' : 'grab',
    transition: 'opacity 0.2s ease'
  }

  if (useHandle) {
    return (
      <div ref={setNodeRef} style={style} className="relative h-full">
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
      className={`active:cursor-grabbing h-full ${isDragging ? 'z-[200]' : ''}`}
    >
      {children}
    </div>
  )
})
