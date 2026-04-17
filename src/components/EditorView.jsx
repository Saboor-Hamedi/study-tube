import { useEffect, useRef, useState } from 'react'
import EditorJS from '@editorjs/editorjs'
import './../editor.css'
import { FileText, Save, Trash2, Loader2, Sparkles } from 'lucide-react'
import DeleteModal from './DeleteModal'

// Import Tools
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Checklist from '@editorjs/checklist'
import Quote from '@editorjs/quote'
import Code from '@editorjs/code'
import Marker from '@editorjs/marker'

export default function EditorView({ api, showToast }) {
  const editorInstance = useRef(null)
  const isInitializingRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const autoSaveTimer = useRef(null)

  useEffect(() => {
    const initEditor = async () => {
      if (editorInstance.current || isInitializingRef.current) return
      isInitializingRef.current = true

      // Load existing notes from JSON
      let savedData = {}
      try {
        savedData = await api.loadNotes()
      } catch (e) {
        console.error('Failed to load neural notes', e)
      }

      const editor = new EditorJS({
        holder: 'editorjs',
        placeholder: 'Protocol: Initializing neural drafting... (Click to type)',
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3, 4],
              defaultLevel: 2
            }
          },
          list: { class: List, inlineToolbar: true, config: { defaultStyle: 'unordered' } },
          checklist: { class: Checklist, inlineToolbar: true },
          quote: { class: Quote, inlineToolbar: true, config: { quotePlaceholder: 'Insert Quote', captionPlaceholder: 'Source' } },
          code: Code,
          marker: Marker,
        },
        data: (savedData && savedData.blocks) ? savedData : { blocks: [] }, 
        onReady: () => {
          setIsInitializing(false)
          console.log('[SYSTEM] Editor.js Interface Stabilized')
        },
        onChange: () => {
          // Debounced Auto-Save Engine
          if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
          autoSaveTimer.current = setTimeout(async () => {
            if (editorInstance.current && typeof editorInstance.current.save === 'function') {
              try {
                const data = await editorInstance.current.save()
                await api.saveNotes(data)
                console.log('[AUTO-SYNC] Research session persisted')
              } catch (e) {
                console.warn('[AUTO-SYNC] Persistence interrupted', e)
              }
            }
          }, 3000) // Auto-save after 3 seconds of inactivity
        }
      })

      editorInstance.current = editor
    }

    initEditor()

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        editorInstance.current.destroy()
        editorInstance.current = null
      }
    }
  }, [])

  const handleSave = async () => {
    if (!editorInstance.current) return
    
    // Safety Bridge Check
    if (!api || typeof api.saveNotes !== 'function') {
      showToast('API Bridge Error: Restart Required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const outputData = await editorInstance.current.save()
      await api.saveNotes(outputData)
      showToast('Research Notes Synchronized', 'success')
    } catch (error) {
      console.error('Saving failed: ', error)
      showToast('Nexus Save Error', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    if (!editorInstance.current) return
    
    // Safety Bridge Check
    if (api && typeof api.saveNotes === 'function') {
      try {
        await api.saveNotes({ blocks: [] })
      } catch (e) {
        console.error('Failed to clear remote notes', e)
      }
    }
    
    try {
      if (editorInstance.current.blocks && typeof editorInstance.current.blocks.clear === 'function') {
        editorInstance.current.blocks.clear()
      } else {
        editorInstance.current.render({ blocks: [] })
      }
    } catch (e) {
      console.warn('UI Clear error', e)
    }
    
    setShowDeleteModal(false)
    showToast('Editor Cleared')
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      {/* Unified Header */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-border bg-surface sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 text-indigo-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-text uppercase tracking-[0.2em]">Research Editor</h2>
            <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Workspace 01 // Active</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
            title="Clear Editor"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-text text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {isSaving ? 'Syncing...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-10 lg:px-24 xl:px-48 pb-40 relative">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Synchronizing Neural Workspace...</span>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-12 opacity-30">
             <Sparkles className="h-4 w-4 text-accent" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Text Interface</span>
          </div>
          
          <div className="prose prose-invert prose-lg max-w-none 
            prose-p:text-text/90 prose-p:leading-relaxed 
            prose-headings:text-text prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider
            editor-js-override"
          >
            <div id="editorjs" className="min-h-[500px]" />
          </div>
        </div>
      </div>

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleClear}
        title="Erase Neural Notes"
        message="This action will permanently purge all blocks from the current research editor. This cannot be undone."
      />
    </div>
  )
}
