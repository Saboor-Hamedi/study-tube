import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Library, FileText, X, Folder, GripVertical as GripIcon, Trash2 } from 'lucide-react'
import { memo } from 'react'

export const DroppableFolder = memo(({ id, active, onClick, children, onDelete, isCollapsed = false }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`group relative flex justify-center w-full transition-all duration-300 ${isCollapsed ? 'px-0' : ''}`}
    >
      {!isCollapsed && (
        <div className={`absolute left-0 w-[1.5px] h-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${active ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />
      )}

      <button 
        onClick={onClick}
        style={isCollapsed ? { width: '40px', height: '40px' } : {}}
        className={`flex items-center transition-all duration-200 text-left shrink-0 ${
          isCollapsed 
            ? `justify-center rounded-full border-0 ${isOver ? 'bg-accent text-white' : active ? 'bg-accent/10 text-accent' : 'bg-transparent text-muted hover:bg-surface-3 hover:text-text'}` 
            : `w-full gap-2.5 px-3 py-1.5 rounded-[5px] border border-transparent ${
                isOver 
                  ? 'bg-accent text-white border-accent shadow-[0_4px_12px_rgba(var(--accent-rgb),0.3)] z-10' 
                  : active 
                    ? 'text-accent font-bold' 
                    : 'text-muted hover:bg-surface-3 hover:text-text'
              }`
        }`}
      >
        <div className={`transition-colors duration-200 shrink-0 flex items-center justify-center ${isOver ? 'text-white' : active ? 'text-accent' : 'opacity-40 group-hover:opacity-100'}`}>
          {id === 'all' ? (
            <Library className="h-3.5 w-3.5" />
          ) : id === 'trash' ? (
            <Trash2 className="h-3.5 w-3.5" />
          ) : (
            <Folder className="h-3.5 w-3.5" />
          )}
        </div>
        {!isCollapsed && (
          <span className={`text-[10px] uppercase font-black tracking-[0.2em] truncate flex-1 ${isOver ? 'text-white' : ''}`}>{children}</span>
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
