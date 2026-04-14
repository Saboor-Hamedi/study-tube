import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Library, FileText, X } from 'lucide-react'

export const DroppableFolder = ({ id, active, onClick, children, onDelete }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`group relative flex items-center transition-all duration-200 ${isOver ? 'z-10 bg-accent/5' : 'bg-transparent'}`}
    >
      {/* Sharp Active Indicator */}
      <div className={`absolute left-0 w-[2px] h-3 rounded-full transition-all duration-300 ${active ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />

      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] transition-all duration-200 border ${
          isOver 
            ? 'bg-accent/10 border-accent/30 text-accent' 
            : active 
              ? 'bg-accent/5 border-accent/10 text-accent font-bold' 
              : 'bg-transparent border-transparent text-muted/50 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        <div className={`transition-colors duration-200 ${active || isOver ? 'text-accent' : 'opacity-40 group-hover:opacity-100'}`}>
          {id === 'all' ? (
            <Library className="h-3 w-3" />
          ) : id === 'unorganized' ? (
            <FileText className="h-3 w-3" />
          ) : (
            <div className={`h-1 w-1 rounded-full ${active ? 'bg-accent' : 'bg-muted/30 group-hover:bg-muted'}`} />
          )}
        </div>
        
        <span className="text-[10px] font-bold tracking-wider truncate">
          {children}
        </span>
      </button>

      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all pointer-events-auto"
        >
          <X className="h-3 w-3 shadow-sm" />
        </button>
      )}
    </div>
  )
}

export const DraggableCard = ({ id, children, v, useHandle = false }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: v.date || id,
    data: v
  })

  const style = {
    opacity: isDragging ? 0.2 : 1,
  }

  // If useHandle is true, we DON'T apply listeners/attributes to the wrapper.
  // The child is responsible for applying them to a handle element.
  const dragProps = useHandle ? {} : { ...listeners, ...attributes }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...dragProps}
      className={`h-full ${useHandle ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {typeof children === 'function' 
        ? children({ listeners, attributes, isDragging }) 
        : children}
    </div>
  )
}
