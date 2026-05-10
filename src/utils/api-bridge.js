/**
 * Universal API Bridge - 2026 Industrial Edition
 * Detects the environment (Electron vs Browser) and routes calls to either
 * Electron IPC or a Direct Cloud Proxy.
 * ELIMINATES localStorage cache for library data to ensure scalability (Millions of items).
 */

const isElectron =
  typeof window !== "undefined" && window.youtubeAPI !== undefined;

/**
 * Cloud Proxy Helper
 * Facilitates direct communication with the PostgreSQL/Cloud cluster.
 */
const getCloudConfig = async () => {
  if (isElectron) {
    const s = await window.youtubeAPI.getSettings();
    return {
      url: s.cloudApiUrl || "http://127.0.0.1:8000",
      token: s.cloudApiToken || "",
    };
  }
  const s = JSON.parse(localStorage.getItem("study_settings") || "{}");
  return {
    url: s.cloudApiUrl || "http://127.0.0.1:8000",
    token: s.cloudApiToken || "",
  };
};

const skippedEndpoints = new Set();

const cloudRequest = async (path, options = {}) => {
  // If we've already discovered this endpoint is missing, skip the noise
  const endpoint = path.split("?")[0];
  if (skippedEndpoints.has(endpoint)) {
    throw new Error("ENDPOINT_SKIPPED");
  }

  try {
    const { url, token } = await getCloudConfig();
    const res = await fetch(`${url}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (res.status === 404) {
      console.log(
        `[HYBRID] Cloud endpoint ${endpoint} not ready. Silencing for session.`,
      );
      skippedEndpoints.add(endpoint);
      throw new Error("ENDPOINT_NOT_FOUND");
    }

    if (!res.ok) throw new Error(`Cloud Error: ${res.statusText}`);
    return res.json();
  } catch (err) {
    throw err;
  }
};

const HybridRouter = {
  // --- Neural Dialogue & AI Core ---
  getAiKey: async () => {
    if (isElectron) return await window.youtubeAPI.getAiKey();
    return localStorage.getItem("aiApiKey") || "";
  },

  setAiKey: async (key) => {
    localStorage.setItem("aiApiKey", key);
    if (isElectron) await window.youtubeAPI.setAiKey(key);
    return key;
  },

  chat: async ({ messages, context }) => {
    const apiKey = await HybridRouter.getAiKey();
    if (!apiKey) throw new Error("Neural API Key missing.");

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: `Neural Assistant. Context: ${context}` },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";
  },

  checkGrammar: async () => {
    if (isElectron) return await window.youtubeAPI.checkGrammar();
    return [];
  },

  // --- Scalable Data Persistence (Million-Record Capable) ---
  loadVocab: async (includeArchived = false) => {
    try {
      return await cloudRequest(`/library?archived=${includeArchived ? 1 : 0}`);
    } catch (err) {
      if (
        isElectron ||
        err.message === "ENDPOINT_NOT_FOUND" ||
        err.message === "ENDPOINT_SKIPPED"
      ) {
        if (isElectron)
          return await window.youtubeAPI.loadVocab(includeArchived);
        return [];
      }
      throw err;
    }
  },

  loadVocabPage: async (criteria) => {
    try {
      const query = new URLSearchParams(criteria).toString();
      return await cloudRequest(`/library/page?${query}`);
    } catch (err) {
      if (
        isElectron ||
        err.message === "ENDPOINT_NOT_FOUND" ||
        err.message === "ENDPOINT_SKIPPED"
      ) {
        if (isElectron) return await window.youtubeAPI.loadVocabPage(criteria);
        return [];
      }
      throw err;
    }
  },

  saveVocabItem: async (item) => {
    let cloudSuccess = false;
    try {
      await cloudRequest("/sync", {
        method: "POST",
        body: JSON.stringify({ items: [item] }),
      });
      cloudSuccess = true;
    } catch (err) {
      console.warn("[HYBRID] Cloud sync deferred:", err.message);
    }

    if (isElectron) {
      await window.youtubeAPI.saveVocabItem({
        ...item,
        synced: cloudSuccess ? 1 : 0,
      });
    }
    return true;
  },

  deleteVocabItem: async (id) => {
    try {
      await cloudRequest(`/library/${id}`, { method: "DELETE" });
    } catch (err) {
      if (isElectron) await window.youtubeAPI.deleteVocabItem(id);
      else throw err;
    }
    return true;
  },

  // --- Collection & Research Logic ---
  loadCollections: async () => {
    try {
      return await cloudRequest("/collections");
    } catch (err) {
      if (
        isElectron ||
        err.message === "ENDPOINT_NOT_FOUND" ||
        err.message === "ENDPOINT_SKIPPED"
      ) {
        return isElectron ? await window.youtubeAPI.loadCollections() : [];
      }
      return [];
    }
  },
  saveCollections: async (list) => {
    if (isElectron) await window.youtubeAPI.saveCollections(list);
    try {
      await cloudRequest("/collections", {
        method: "POST",
        body: JSON.stringify({ collections: list }),
      });
    } catch (e) {
      console.warn("Cloud collection sync deferred", e);
    }
    return true;
  },

  loadNotes: async () => {
    try {
      return await cloudRequest("/notes");
    } catch (err) {
      if (
        isElectron ||
        err.message === "ENDPOINT_NOT_FOUND" ||
        err.message === "ENDPOINT_SKIPPED"
      ) {
        return isElectron
          ? await window.youtubeAPI.loadNotes()
          : { blocks: [] };
      }
      return { blocks: [] };
    }
  },
  saveNotes: async (data) => {
    if (isElectron) await window.youtubeAPI.saveNotes(data);
    try {
      await cloudRequest("/notes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn("Cloud notes sync deferred", e);
    }
    return true;
  },

  getLibraryStats: async () => {
    try {
      return await cloudRequest("/library/stats");
    } catch (err) {
      if (
        isElectron ||
        err.message === "ENDPOINT_NOT_FOUND" ||
        err.message === "ENDPOINT_SKIPPED"
      ) {
        return isElectron
          ? await window.youtubeAPI.getLibraryStats()
          : { all: 0, trash: 0, collections: [] };
      }
      return { all: 0, trash: 0, collections: [] };
    }
  },

  archiveVocabItem: async (id) => {
    try {
      await cloudRequest(`/library/${id}/archive`, { method: "POST" });
    } catch {
      if (isElectron) await window.youtubeAPI.archiveVocabItem(id);
    }
    return true;
  },

  restoreVocabItem: async (id) => {
    try {
      await cloudRequest(`/library/${id}/restore`, { method: "POST" });
    } catch {
      if (isElectron) await window.youtubeAPI.restoreVocabItem(id);
    }
    return true;
  },

  // --- Search History (Cached Locally for Privacy) ---
  getSearchLog: async () => {
    if (isElectron) return await window.youtubeAPI.getSearchLog();
    return JSON.parse(localStorage.getItem("study_search_log") || "[]");
  },
  addSearchLog: async (q) => {
    if (isElectron) return await window.youtubeAPI.addSearchLog(q);
    const log = JSON.parse(
      localStorage.getItem("study_search_log") || "[]",
    ).filter((i) => i !== q);
    log.unshift(q);
    localStorage.setItem("study_search_log", JSON.stringify(log.slice(0, 10)));
  },
  deleteSearchLog: async (q) => {
    if (isElectron) return await window.youtubeAPI.deleteSearchLog(q);
    const log = JSON.parse(
      localStorage.getItem("study_search_log") || "[]",
    ).filter((i) => i !== q);
    localStorage.setItem("study_search_log", JSON.stringify(log));
  },
  clearSearchLog: async () => {
    if (isElectron) return await window.youtubeAPI.clearSearchLog();
    localStorage.removeItem("study_search_log");
  },

  // --- Settings & UI (Always Synchronized) ---
  getSettings: async () => {
    if (isElectron) return await window.youtubeAPI.getSettings();
    return JSON.parse(localStorage.getItem("study_settings") || "{}");
  },

  saveSettings: async (config) => {
    if (isElectron) await window.youtubeAPI.saveSettings(config);
    localStorage.setItem("study_settings", JSON.stringify(config));
    return true;
  },

  searchLibraryFTS: async (query) => {
    try {
      return await cloudRequest(
        `/library/search?q=${encodeURIComponent(query)}`,
      );
    } catch (err) {
      if (
        isElectron ||
        err.message === "ENDPOINT_NOT_FOUND" ||
        err.message === "ENDPOINT_SKIPPED"
      ) {
        return isElectron
          ? await window.youtubeAPI.searchLibraryFTS(query)
          : [];
      }
      return [];
    }
  },

  pullFromCloud: async () => {
    if (!isElectron) return { success: true, message: "Cloud Mode Active" };
    try {
      const cloudItems = await cloudRequest("/library");
      if (Array.isArray(cloudItems)) {
        for (const item of cloudItems) {
          const localItem = {
            ...item,
            videoTitle: item.video_title,
            archived: item.archived ? 1 : 0,
            synced: 1,
          };
          delete localItem.video_title;
          await window.youtubeAPI.saveVocabItem(localItem);
        }
        return { success: true, count: cloudItems.length };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  refineNotes: async (data) => {
    if (isElectron) return await window.youtubeAPI.refineNotes(data);

    // Web implementation: Mirror of main.js ai:refine
    const apiKey = await HybridRouter.getAiKey();
    if (!apiKey) throw new Error("Neural API Key missing.");

    const textToRefine = data.blocks
      .map((b, i) => `[ID:${i}] ${b.data.text || b.data.caption || ""}`)
      .join("\n\n");

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Professional research editor. Correct grammar/flow. Keep [ID:n] tags. Return only: [ID:n] Corrected text.",
          },
          { role: "user", content: textToRefine },
        ],
        temperature: 0.3,
      }),
    });
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    const refinedBlocks = JSON.parse(JSON.stringify(data.blocks));
    content.split("\n").forEach((line) => {
      const match = line.match(/\[ID:(\d+)\]\s*(.*)/i);
      if (match) {
        const idx = parseInt(match[1]);
        const text = match[2].trim();
        if (refinedBlocks[idx]) {
          if (refinedBlocks[idx].data.text !== undefined)
            refinedBlocks[idx].data.text = text;
          else if (refinedBlocks[idx].data.caption !== undefined)
            refinedBlocks[idx].data.caption = text;
        }
      }
    });
    return refinedBlocks;
  },

  checkGrammar: async (text) => {
    if (isElectron) return await window.youtubeAPI.checkGrammar(text);
    return []; // Web fallback for now
  },

  // Metadata & Shell (Electron Only)
  youtubeMetadata: async (url) =>
    isElectron ? window.youtubeAPI.metadata(url) : null,
  youtubeSearch: async (q) => {
    if (isElectron) return await window.youtubeAPI.search(q);
    try {
      return await cloudRequest(`/youtube/search?q=${encodeURIComponent(q)}`);
    } catch (err) {
      return []; // Web fallback
    }
  },
  openExternal: async (url) =>
    isElectron
      ? window.youtubeAPI.openExternal(url)
      : window.open(url, "_blank"),
  pickSavePath: async () =>
    isElectron ? window.youtubeAPI.pickSavePath() : null,
  getSavePath: async () =>
    isElectron ? await window.youtubeAPI.getSavePath() : "Cloud Root",
  setSavePath: async (path) =>
    isElectron ? await window.youtubeAPI.setSavePath(path) : "Cloud Root",
  getTheme: async () =>
    isElectron
      ? await window.youtubeAPI.getTheme()
      : localStorage.getItem("study_theme") || "dark",
  setTheme: async (t) => {
    if (isElectron) await window.youtubeAPI.setTheme(t);
    localStorage.setItem("study_theme", t);
    return t;
  },
  getVersion: async () =>
    isElectron
      ? (await window.youtubeAPI.getAppVersion?.()) || "1.0.11"
      : "1.0.11-web",

  onEngineStatus: (callback) =>
    isElectron
      ? (window.youtubeAPI.onEngineStatus || (() => {}))(callback)
      : () => {},
  onProgress: (callback) =>
    isElectron
      ? (window.youtubeAPI.onProgress || (() => {}))(callback)
      : () => {},
  onDownloadComplete: (callback) =>
    isElectron
      ? (window.youtubeAPI.onDownloadComplete || (() => {}))(callback)
      : () => {},
  onDownloadError: (callback) =>
    isElectron
      ? (window.youtubeAPI.onDownloadError || (() => {}))(callback)
      : () => {},
  onDownloadStatus: (callback) =>
    isElectron
      ? (window.youtubeAPI.onDownloadStatus || (() => {}))(callback)
      : () => {},
  onDone: (callback) =>
    isElectron ? (window.youtubeAPI.onDone || (() => {}))(callback) : () => {},

  updater: isElectron
    ? window.youtubeAPI.updater
    : { check: async () => ({}), install: async () => {} },
};

const api = HybridRouter;
export { api, isElectron };
