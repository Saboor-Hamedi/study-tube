import { Search, BookMarked, Settings } from 'lucide-react'

export default function Sidebar({ view, setView }) {
  return (
    <aside className="flex h-screen w-16 shrink-0 flex-col items-center border-r border-border bg-[#0a0a0a] py-8 gap-6 z-10">
      <div className="flex flex-col gap-5">
        <button
          onClick={() => setView('search')}
          className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
            view === 'search' ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-surface-2'
          }`}
          title="Search Videos"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          onClick={() => setView('vocab')}
          className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
            view === 'vocab' ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-surface-2'
          }`}
          title="My Vocabulary"
        >
          <BookMarked className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1" />
      
      <button
        onClick={() => setView('settings')}
        className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
          view === 'settings' ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-surface-2'
        }`}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </aside>
  )
}
