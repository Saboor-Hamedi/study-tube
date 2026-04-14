const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('youtubeAPI', {
  search: (query) => ipcRenderer.invoke('youtube:search', query),
  metadata: (url) => ipcRenderer.invoke('youtube:metadata', url),
  getStreamUrl: (url) => ipcRenderer.invoke('youtube:getStreamUrl', url),
  getTranscript: (videoId) => ipcRenderer.invoke('youtube:getTranscript', videoId),
  processTranscript: (data) => ipcRenderer.invoke('ai:processTranscript', data),
  chatWithAI: (data) => ipcRenderer.invoke('ai:chat', data),
  stopAI: () => ipcRenderer.invoke('ai:stop'),
  pickSavePath: () => ipcRenderer.invoke('fs:pickSavePath'),
  getSavePath: () => ipcRenderer.invoke('settings:getSavePath'),
  setSavePath: (p) => ipcRenderer.invoke('settings:setSavePath', p),
  getAiKey: () => ipcRenderer.invoke('settings:getAiKey'),
  setAiKey: (key) => ipcRenderer.invoke('settings:setAiKey', key),
  loadVocab: () => ipcRenderer.invoke('vocab:load'),
  saveVocab: (list) => ipcRenderer.invoke('vocab:save', list),
  loadCollections: () => ipcRenderer.invoke('collections:load'),
  saveCollections: (list) => ipcRenderer.invoke('collections:save', list),
  explainWord: (data) => ipcRenderer.invoke('ai:explain', data),
  startDownload: (payload) => ipcRenderer.invoke('download:start', payload),
  cancelDownload: (taskId) => ipcRenderer.invoke('download:cancel', taskId),
  openFilePath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
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
})
