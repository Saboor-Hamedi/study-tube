/**
 * Universal API Bridge - 2026 Industrial Edition
 * Detects the environment (Electron vs Browser) and routes calls to either
 * Electron IPC or a Local Web Adapter.
 */

const isElectron = typeof window !== 'undefined' && window.youtubeAPI !== undefined;

/**
 * Web Adapter for Browser Mode
 * Mocks or redirects calls to local/cloud services when running outside Electron.
 */
const WebAdapter = {
  // --- Neural Dialogue & AI Core ---
  getAiKey: async () => localStorage.getItem('study_ai_api_key') || '',
  setAiKey: async (key) => {
    localStorage.setItem('study_ai_api_key', key);
    return key;
  },
  
  chat: async ({ messages, context }) => {
    const apiKey = localStorage.getItem('study_ai_api_key');
    if (!apiKey) throw new Error('DeepSeek API Key missing in browser storage.');
    
    // Direct call (May require CORS proxy in production)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: `Neural Assistant. Context: ${context}` }, ...messages],
        temperature: 0.7
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response.';
  },

  stopAi: async () => true,

  // --- Data Persistence (SQLite Mock for Browser) ---
  loadVocab: async (includeArchived = false) => {
    let lib = JSON.parse(localStorage.getItem('study_library') || '[]');
    if (!includeArchived) lib = lib.filter(v => !v.archived);
    return lib;
  },
  loadVocabPage: async ({ collection, sortBy, limit }) => {
    let lib = JSON.parse(localStorage.getItem('study_library') || '[]');
    
    // Filtering
    if (collection && collection !== 'all') {
      if (collection === 'trash') lib = lib.filter(v => v.archived);
      else if (collection === 'unorganized') lib = lib.filter(v => !v.collection && !v.archived);
      else lib = lib.filter(v => v.collection === collection && !v.archived);
    } else {
      lib = lib.filter(v => !v.archived);
    }
    
    // Sorting
    if (sortBy === 'alpha') lib.sort((a, b) => a.text.localeCompare(b.text));
    else lib.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limiting
    return lib.slice(0, limit);
  },
  saveVocabItem: async (item) => {
    // 1. Local Storage fallback
    const lib = JSON.parse(localStorage.getItem('study_library') || '[]');
    const idx = lib.findIndex(v => (v.id || v.date) === (item.id || item.date));
    if (idx >= 0) lib[idx] = item;
    else lib.unshift(item);
    localStorage.setItem('study_library', JSON.stringify(lib));

    // 2. Direct Cloud Push (Same as Electron mode)
    try {
      const settings = JSON.parse(localStorage.getItem('study_settings') || '{}');
      const cloudUrl = settings.cloudApiUrl || 'http://127.0.0.1:8000';
      await fetch(`${cloudUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [item], notes: null, collections: null, settings: null })
      });
    } catch (e) {
      console.warn('[CLOUD] Web Sync Bypass', e);
    }
    return true;
  },
  deleteVocabItem: async (id) => {
    const lib = JSON.parse(localStorage.getItem('study_library') || '[]').filter(v => (v.id || v.date) !== id);
    localStorage.setItem('study_library', JSON.stringify(lib));
    return true;
  },
  archiveVocabItem: async (id) => {
    const lib = JSON.parse(localStorage.getItem('study_library') || '[]');
    const idx = lib.findIndex(v => (v.id || v.date) === id);
    if (idx >= 0) {
      lib[idx].archived = 1;
      localStorage.setItem('study_library', JSON.stringify(lib));
    }
    return true;
  },
  restoreVocabItem: async (id) => {
    const lib = JSON.parse(localStorage.getItem('study_library') || '[]');
    const idx = lib.findIndex(v => (v.id || v.date) === id);
    if (idx >= 0) {
      lib[idx].archived = 0;
      localStorage.setItem('study_library', JSON.stringify(lib));
    }
    return true;
  },
  getLibraryStats: async () => {
    const lib = JSON.parse(localStorage.getItem('study_library') || '[]').filter(v => !v.archived);
    const trash = JSON.parse(localStorage.getItem('study_library') || '[]').filter(v => v.archived);
    return { all: lib.length, trash: trash.length, collections: [] };
  },

  loadNotes: async () => JSON.parse(localStorage.getItem('study_notes') || '{"blocks":[]}'),
  saveNotes: async (data) => {
    localStorage.setItem('study_notes', JSON.stringify(data));
    return true;
  },

  // --- Neural Engine (Python Sidecar) ---
  getEngineStatus: async () => {
    try {
      const r = await fetch('http://127.0.0.1:8008/status', { mode: 'cors' });
      const d = await r.json();
      return d.status || 'OFFLINE';
    } catch {
      return 'OFFLINE';
    }
  },

  // --- YouTube Bridge ---
  // These require a server-side proxy to bypass CORS and use ytdl-core
  youtubeSearch: async (query) => {
    console.warn('YouTube Search in Browser requires a local Node proxy.');
    return [];
  },
  youtubeMetadata: async (url) => {
    throw new Error('YouTube Metadata extraction restricted in Browser.');
  },

  // --- Settings & UI ---
  getTheme: async () => localStorage.getItem('study_theme') || 'dark',
  setTheme: async (theme) => {
    localStorage.setItem('study_theme', theme);
    return theme;
  },
  getVersion: async () => '1.0.11-web',
  getSavePath: async () => localStorage.getItem('study_save_path') || 'Browser Standard Storage',
  setSavePath: async (path) => {
    localStorage.setItem('study_save_path', path);
    return path;
  },
  pickSavePath: async () => {
    console.warn('Folder picking restricted in browser mode.');
    return 'Browser Standard Storage';
  },
  
  // Event System Mock
  onEngineStatus: (callback) => {
    const timer = setInterval(async () => {
      try {
        const r = await fetch('http://127.0.0.1:8008/status', { mode: 'cors' });
        const d = await r.json();
        callback(d.status || 'OFFLINE');
      } catch {
        callback('OFFLINE');
      }
    }, 5000);
    return () => clearInterval(timer);
  },

  // Updater Mock
  updater: {
    check: async () => { console.log('Update check skipped in web mode.'); return { success: true }; },
    install: async () => true,
    onUpdateStatus: (callback) => () => {}, // No-op unsubscription
  },

  // Fallbacks for missing handlers
  checkGrammar: async () => [],
  exportDossier: async () => ({ success: false, message: 'Export restricted in browser mode.' }),
  openExternal: async (url) => {
    window.open(url, '_blank');
    return true;
  },
  // --- Settings (Universal Blueprint) ---
  getAppSettings: async () => JSON.parse(localStorage.getItem('study_settings') || '{}'),
  saveAppSettings: async (config) => {
    localStorage.setItem('study_settings', JSON.stringify(config));
    return true;
  },

  getSearchLog: async () => JSON.parse(localStorage.getItem('study_search_log') || '[]'),
  addSearchLog: async (q) => {
    const log = JSON.parse(localStorage.getItem('study_search_log') || '[]').filter(i => i !== q);
    log.unshift(q);
    localStorage.setItem('study_search_log', JSON.stringify(log.slice(0, 10)));
  },
  deleteSearchLog: async (q) => {
    const log = JSON.parse(localStorage.getItem('study_search_log') || '[]').filter(i => i !== q);
    localStorage.setItem('study_search_log', JSON.stringify(log));
  },
  clearSearchLog: async () => localStorage.removeItem('study_search_log'),

  // --- Neural Cloud Bridge (Web Mode) ---
  triggerSync: async () => {
    console.log('[CLOUD] Web mode: Syncing via Direct Cloud Access...');
    // In web mode, we are already talking to the cloud or will be soon.
    return { success: true, message: 'Cloud Active' };
  },
  loadCollections: async () => JSON.parse(localStorage.getItem('study_collections') || '[]'),
  saveCollections: async (list) => {
    localStorage.setItem('study_collections', JSON.stringify(list));
    return true;
  }
};

/**
 * The Unified API Instance
 */
export const api = isElectron ? {
  ...window.youtubeAPI,
  getAppSettings: () => window.youtubeAPI.getSettings(),
  saveAppSettings: (config) => window.youtubeAPI.saveSettings(config),
  getLibraryStats: () => window.youtubeAPI.getLibraryStats(),
  loadVocab: (includeArchived) => window.youtubeAPI.loadVocab(includeArchived),
  archiveVocabItem: (id) => window.youtubeAPI.archiveVocabItem(id),
  restoreVocabItem: (id) => window.youtubeAPI.restoreVocabItem(id),
  deleteVocabItem: (id) => window.youtubeAPI.deleteVocabItem(id),
  
  saveVocabItem: async (item) => {
    await window.youtubeAPI.saveVocabItem(item);
    try {
      const settings = await window.youtubeAPI.getSettings();
      const cloudUrl = settings.cloud_api_url || settings.cloudApiUrl || 'http://127.0.0.1:8000';
      await fetch(`${cloudUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [item], notes: null, collections: null, settings: null })
      });
    } catch (e) {
      console.warn('[CLOUD] Direct Sync Bypass', e);
    }
    return true;
  },

  pullFromCloud: async () => {
    try {
      const settings = await window.youtubeAPI.getSettings();
      const cloudUrl = settings.cloud_api_url || settings.cloudApiUrl || 'http://127.0.0.1:8000';
      console.log(`[CLOUD] Electron Pull: Connecting to ${cloudUrl}/library...`);
      const response = await fetch(`${cloudUrl}/library`);
      const cloudItems = await response.json();
      if (Array.isArray(cloudItems)) {
        console.log(`[CLOUD] Electron Pull: Received ${cloudItems.length} items. Syncing to SQLite...`);
        for (const item of cloudItems) {
          const localItem = { ...item, videoTitle: item.video_title, archived: item.archived ? 1 : 0, synced: 1 };
          delete localItem.video_title;
          await window.youtubeAPI.saveVocabItem(localItem);
        }
        return { success: true, count: cloudItems.length };
      }
    } catch (err) {
      console.error('[CLOUD] Electron Pull Failed:', err);
      return { success: false };
    }
  }
} : {
  ...WebAdapter,
  pullFromCloud: async () => {
     try {
       const settings = JSON.parse(localStorage.getItem('study_settings') || '{}');
       const cloudUrl = settings.cloudApiUrl || 'http://127.0.0.1:8000';
       console.log(`[CLOUD] Web Pull: Connecting to ${cloudUrl}/library...`);
       const response = await fetch(`${cloudUrl}/library`);
       const cloudItems = await response.json();
       if (Array.isArray(cloudItems)) {
         console.log(`[CLOUD] Web Pull: Received ${cloudItems.length} items. Syncing to LocalStorage...`);
         for (const item of cloudItems) {
           const localItem = { ...item, videoTitle: item.video_title, archived: item.archived ? 1 : 0 };
           delete localItem.video_title;
           await WebAdapter.saveVocabItem(localItem);
         }
         return { success: true, count: cloudItems.length };
       }
     } catch (err) {
       console.error('[CLOUD] Web Pull Failed:', err);
       return { success: false };
     }
  }
};
