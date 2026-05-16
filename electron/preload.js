import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("youtubeAPI", {
  search: (query) => ipcRenderer.invoke("youtube:search", query),
  metadata: (url) => ipcRenderer.invoke("youtube:metadata", url),
  pickSavePath: () => ipcRenderer.invoke("fs:pickSavePath"),
  startDownload: (payload) => ipcRenderer.invoke("download:start", payload),
  getTheme: () => ipcRenderer.invoke("settings:getTheme"),
  setTheme: (theme) => ipcRenderer.invoke("settings:setTheme", theme),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (config) => ipcRenderer.invoke("settings:save", config),
  loadVocab: (includeArchived) =>
    ipcRenderer.invoke("vocab:load", includeArchived),
  saveVocab: (list) => ipcRenderer.invoke("vocab:save", list),
  deleteVocabItem: (id) => ipcRenderer.invoke("vocab:delete-item", id),
  archiveVocabItem: (id) => ipcRenderer.invoke("vocab:archive-item", id),
  restoreVocabItem: (id) => ipcRenderer.invoke("vocab:restore-item", id),
  loadCollections: () => ipcRenderer.invoke("collections:load"),
  saveCollections: (list) => ipcRenderer.invoke("collections:save", list),
  explainWord: (data) => ipcRenderer.invoke("ai:explain", data),
  chatWithAI: (data) => ipcRenderer.invoke("ai:chat", data),
  exportDossier: (data) => ipcRenderer.invoke("library:export-dossier", data),
  getSearchLog: () => ipcRenderer.invoke("search:get-log"),
  addSearchLog: (query) => ipcRenderer.invoke("search:add-log", query),
  deleteSearchLog: (query) => ipcRenderer.invoke("search:delete-log", query),
  clearSearchLog: () => ipcRenderer.invoke("search:clear-log"),
  onProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("download:progress", listener);
    return () => ipcRenderer.removeListener("download:progress", listener);
  },
  onDone: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("download:done", listener);
    return () => ipcRenderer.removeListener("download:done", listener);
  },
  getLibraryStats: () => ipcRenderer.invoke("vocab:get-stats"),
  loadVocabPage: (criteria) => ipcRenderer.invoke("vocab:load-page", criteria),
  triggerSync: () => ipcRenderer.invoke("settings:trigger-sync"),
  getAiKey: () => ipcRenderer.invoke("settings:getAiKey"),
  setAiKey: (key) => ipcRenderer.invoke("settings:setAiKey", key),
  refineNotes: (data) => ipcRenderer.invoke("ai:refine", data),
  checkGrammar: (text) => ipcRenderer.invoke("ai:check-grammar", text),
  loadNotes: () => ipcRenderer.invoke("notes:load"),
  saveNotes: (data) => ipcRenderer.invoke("notes:save", data),
  searchLibraryFTS: (query) => ipcRenderer.invoke("library:search-fts", query),
  getForensicWhitelist: () => ipcRenderer.invoke("forensic:get-whitelist"),
  addForensicWord: (word) => ipcRenderer.invoke("forensic:add-word", word),
  removeForensicWord: (word) => ipcRenderer.invoke("forensic:remove-word", word),
});
