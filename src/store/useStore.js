import { create } from 'zustand'

/**
 * Standardized Neural Store - 2025 Industrial Edition
 * Centralizes all research and UI state for the Neural Research Studio.
 */
export const useStore = create((set, get) => ({
  // --- Research Archive State ---
  vocabStats: { total: 0, collections: [] },
  savePath: '',
  view: 'home',
  selectedResearchNode: null,
  vocab: [],
  collections: [],
  selectedCollection: 'all',
  chatHistory: [
    { role: 'assistant', content: 'Your AI copilot for analyzing words, refining grammar, and generating research cards.' }
  ],
  sortBy: 'newest',
  displayLimit: 6,

  // --- UI & Interaction State ---
  isCopilotOpen: false,
  isCopilotCollapsed: false,
  isSidebarCollapsed: false,
  isCaptureOpen: false,
  copilotContext: null,
  toast: null,
  theme: 'dark',

  // --- Video Intel State ---
  videoQuery: '',
  videoResults: [],
  videoPreview: null,
  videoTranscript: null,
  loadingTranscript: false,
  isVideoBusy: false,

  // --- Library Search Intelligence ---
  libQuery: '',
  libResults: [],
  isLibSearching: false,
  libHistory: [],
  isLibHistoryOpen: false,
  libSelectedIndex: -1,

  // --- Global Actions & Neural Triggers ---
  
  setVocabStats: (val) => set((s) => ({ vocabStats: typeof val === 'function' ? val(s.vocabStats) : val })),
  setSavePath: (val) => set((s) => ({ savePath: typeof val === 'function' ? val(s.savePath) : val })),
  setView: (val) => set((s) => ({ view: typeof val === 'function' ? val(s.view) : val })),
  setSelectedResearchNode: (val) => set((s) => ({ selectedResearchNode: typeof val === 'function' ? val(s.selectedResearchNode) : val })),
  setVocab: (val) => set((s) => ({ vocab: typeof val === 'function' ? val(s.vocab) : val })),
  setCollections: (val) => set((s) => ({ collections: typeof val === 'function' ? val(s.collections) : val })),
  setSelectedCollection: (val) => set((s) => ({ selectedCollection: typeof val === 'function' ? val(s.selectedCollection) : val })),
  setChatHistory: (val) => set((s) => ({ chatHistory: typeof val === 'function' ? val(s.chatHistory) : val })),
  setSortBy: (val) => set((s) => ({ sortBy: typeof val === 'function' ? val(s.sortBy) : val })),
  setDisplayLimit: (val) => set((s) => ({ displayLimit: typeof val === 'function' ? val(s.displayLimit) : val })),

  setIsCopilotOpen: (val) => set((s) => ({ isCopilotOpen: typeof val === 'function' ? val(s.isCopilotOpen) : val })),
  setIsCopilotCollapsed: (val) => set((s) => ({ isCopilotCollapsed: typeof val === 'function' ? val(s.isCopilotCollapsed) : val })),
  setIsSidebarCollapsed: (val) => set((s) => ({ isSidebarCollapsed: typeof val === 'function' ? val(s.isSidebarCollapsed) : val })),
  setIsCaptureOpen: (val) => set((s) => ({ isCaptureOpen: typeof val === 'function' ? val(s.isCaptureOpen) : val })),
  setCopilotContext: (val) => set((s) => ({ copilotContext: typeof val === 'function' ? val(s.copilotContext) : val })),
  setToast: (val) => set((s) => ({ toast: typeof val === 'function' ? val(s.toast) : val })),
  setTheme: (val) => set((s) => {
    const theme = typeof val === 'function' ? val(s.theme) : val
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('study-theme', theme)
    return { theme }
  }),

  // Video State Setters
  setVideoQuery: (val) => set((s) => ({ videoQuery: typeof val === 'function' ? val(s.videoQuery) : val })),
  setVideoResults: (val) => set((s) => ({ videoResults: typeof val === 'function' ? val(s.videoResults) : val })),
  setVideoPreview: (val) => set((s) => ({ videoPreview: typeof val === 'function' ? val(s.videoPreview) : val })),
  setVideoTranscript: (val) => set((s) => ({ videoTranscript: typeof val === 'function' ? val(s.videoTranscript) : val })),
  setLoadingTranscript: (val) => set((s) => ({ loadingTranscript: typeof val === 'function' ? val(s.loadingTranscript) : val })),
  setIsVideoBusy: (val) => set((s) => ({ isVideoBusy: typeof val === 'function' ? val(s.isVideoBusy) : val })),

  // Library Search Setters
  setLibQuery: (val) => set((s) => ({ libQuery: typeof val === 'function' ? val(s.libQuery) : val })),
  setLibResults: (val) => set((s) => ({ libResults: typeof val === 'function' ? val(s.libResults) : val })),
  setIsLibSearching: (val) => set((s) => ({ isLibSearching: typeof val === 'function' ? val(s.isLibSearching) : val })),
  setLibHistory: (val) => set((s) => ({ libHistory: typeof val === 'function' ? val(s.libHistory) : val })),
  setIsLibHistoryOpen: (val) => set((s) => ({ isLibHistoryOpen: typeof val === 'function' ? val(s.isLibHistoryOpen) : val })),
  setLibSelectedIndex: (val) => set((s) => ({ libSelectedIndex: typeof val === 'function' ? val(s.libSelectedIndex) : val })),

  // Composite Triggers
  toggleCopilot: (context = null) => {
    const { isCopilotOpen } = get()
    set({ 
      isCopilotOpen: !isCopilotOpen,
      copilotContext: context || null 
    })
  },

  showToast: (msg, type = 'success') => {
    set({ toast: { msg, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },

  closeCopilot: () => set({ isCopilotOpen: false, copilotContext: null })
}))
