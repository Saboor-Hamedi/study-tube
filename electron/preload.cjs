const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('youtubeAPI', {
  search: (query) => ipcRenderer.invoke('youtube:search', query),
  metadata: (url) => ipcRenderer.invoke('youtube:metadata', url),
  getStreamUrl: (url) => ipcRenderer.invoke('youtube:getStreamUrl', url),
  getTranscript: (videoId) => ipcRenderer.invoke('youtube:getTranscript', videoId),
  processTranscript: (data) => ipcRenderer.invoke('ai:processTranscript', data),
  chatWithAI: (data) => ipcRenderer.invoke('ai:chat', data),
  chatWithAIStream: (data) => ipcRenderer.invoke('ai:chat-stream', data),
  onChatChunk: (cb) => {
    const fn = (_e, d) => cb(d)
    ipcRenderer.on('ai:chat-chunk', fn)
    return () => ipcRenderer.removeListener('ai:chat-chunk', fn)
  },
  stopAI: () => ipcRenderer.invoke('ai:stop'),
  pickSavePath: () => ipcRenderer.invoke('fs:pickSavePath'),
  getSavePath: () => ipcRenderer.invoke('settings:getSavePath'),
  setSavePath: (p) => ipcRenderer.invoke('settings:setSavePath', p),
  getAiKey: () => ipcRenderer.invoke('settings:getAiKey'),
  setAiKey: (key) => ipcRenderer.invoke('settings:setAiKey', key),
  getTheme: () => ipcRenderer.invoke('settings:getTheme'),
  setTheme: (theme) => ipcRenderer.invoke('settings:setTheme', theme),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (config) => ipcRenderer.invoke('settings:save', config),
  loadVocab: () => ipcRenderer.invoke('vocab:load'),
  loadVocabPage: (criteria) => ipcRenderer.invoke('vocab:load-page', criteria),
  getLibraryStats: () => ipcRenderer.invoke('vocab:get-stats'),
  saveVocab: (list) => ipcRenderer.invoke('vocab:save', list),
  saveVocabItem: (item) => ipcRenderer.invoke('vocab:save-item', item),
  deleteVocabItem: (id) => ipcRenderer.invoke('vocab:delete-item', id),
  loadCollections: () => ipcRenderer.invoke('collections:load'),
  saveCollections: (list) => ipcRenderer.invoke('collections:save', list),
  migrateCollection: (oldName, newName) => ipcRenderer.invoke('collections:migrate', oldName, newName),
  disbandCollection: (name) => ipcRenderer.invoke('collections:disband', name),
  loadNotes: () => ipcRenderer.invoke('notes:load'),
  saveNotes: (data) => ipcRenderer.invoke('notes:save', data),
  explainWord: (data) => ipcRenderer.invoke('ai:explain', data),
  exportDossier: (data) => ipcRenderer.invoke('library:export-dossier', data),
  getSearchLog: () => ipcRenderer.invoke('search:get-log'),
  addSearchLog: (query) => ipcRenderer.invoke('search:add-log', query),
  deleteSearchLog: (query) => ipcRenderer.invoke('search:delete-log', query),
  clearSearchLog: () => ipcRenderer.invoke('search:clear-log'),
  searchLibraryFTS: (query) => ipcRenderer.invoke('library:search-fts', query),
  reconstructTranscript: (text) => ipcRenderer.invoke('ai:reconstruct-transcript', text),
  refineNotes: (data) => ipcRenderer.invoke('ai:refine', data),
  startDownload: (payload) => ipcRenderer.invoke('download:start', payload),
  cancelDownload: (taskId) => ipcRenderer.invoke('download:cancel', taskId),
  openFilePath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  // Load grammar 
  checkGrammar: (text) => ipcRenderer.invoke('grammar:check', text),


  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    install: () => ipcRenderer.invoke('updater:install'),
    onUpdateStatus: (cb) => {
      const fn = (_e, d) => cb(d)
      ipcRenderer.on('update:status', fn)
      return () => ipcRenderer.removeListener('update:status', fn)
    }
  },
  onProgress: (cb) => {
    const fn = (_e, d) => cb(d)
    ipcRenderer.on('download:progress', fn)
    return () => ipcRenderer.removeListener('download:progress', fn)
  },
  onDone: (cb) => {
    const fn = (_e, d) => cb(d)
    ipcRenderer.on('download:done', fn)
    return () => ipcRenderer.removeListener('download:done', fn)
  },
  onCancelled: (cb) => {
    const fn = (_e, d) => cb(d)
    ipcRenderer.on('download:cancelled', fn)
    return () => ipcRenderer.removeListener('download:cancelled', fn)
  },
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getEngineStatus: () => ipcRenderer.invoke('ai:get-engine-status'),
  onEngineStatus: (cb) => {
    const fn = (_e, d) => cb(d)
    ipcRenderer.on('ai:engine-status', fn)
    return () => ipcRenderer.removeListener('ai:engine-status', fn)
  },
  onRefineTrigger: (cb) => {
    const fn = () => cb()
    ipcRenderer.on('editor:refine-trigger', fn)
    return () => ipcRenderer.removeListener('editor:refine-trigger', fn)
  },
  triggerSync: () => ipcRenderer.invoke('settings:trigger-sync'),
})
