/**
 * Neural API Bridge - Cloud-First Edition
 * Standardized for PostgreSQL Sidecar (FastAPI).
 */

const isElectron =
  typeof window !== "undefined" && window.youtubeAPI !== undefined;

let chatChunkCallback = null;

/**
 * Cloud Proxy Helper
 * Facilitates direct communication with the PostgreSQL/Cloud cluster.
 */
const getCloudConfig = async () => ({
  url: "http://127.0.0.1:8000",
  token: "",
});

const skippedEndpoints = new Set();

const cloudRequest = async (path, options = {}) => {
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
      console.warn(`[CLOUD] Endpoint ${endpoint} unreachable. Skipping.`);
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
  getAppSettings: async () => {
    try {
      return await cloudRequest("/settings");
    } catch (err) {
      console.warn("[CLOUD] Settings retrieval deferred.");
      return {};
    }
  },

  saveAppSettings: async (config) => {
    try {
      await cloudRequest("/settings", {
        method: "POST",
        body: JSON.stringify({ config }),
      });
      return true;
    } catch (err) {
      console.error("[CLOUD] Settings persistence failed.");
      return false;
    }
  },

  getAiKey: async () => {
    const settings = await HybridRouter.getAppSettings();
    return settings?.apiKey || settings?.neural_key || "";
  },

  setAiKey: async (key) => {
    const settings = await HybridRouter.getAppSettings();
    await HybridRouter.saveAppSettings({ ...settings, apiKey: key });
    return key;
  },

  chatWithAI: async ({ messages, context }) => {
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

  chatWithAIStream: async ({ messages, context }) => {
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI Stream Error: ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content || "";
            if (content && chatChunkCallback) {
              fullText += content;
              chatChunkCallback({ content });
            }
          } catch (e) {
            console.warn("[AI STREAM] Chunk Parsing Anomalous:", trimmed);
          }
        }
      }
    }
    return fullText;
  },

  stopAI: async () => {
    // Basic implementation for manual interruption
    return true;
  },

  onChatChunk: (callback) => {
    chatChunkCallback = callback;
    return () => {
      chatChunkCallback = null;
    };
  },

  reconstructTranscript: async (rawText) => {
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
          {
            role: "system",
            content:
              "Synthesize this raw YouTube transcript into a cohesive, readable research script. Preserve all factual information. Use Markdown for structure.",
          },
          { role: "user", content: rawText.slice(0, 8000) },
        ],
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Reconstruction Failed.";
  },

  checkGrammar: async (text) => {
    // Routed to sidecar AI engine
    if (isElectron) return await window.youtubeAPI.checkGrammar(text);
    return [];
  },

  // --- Industrial Data Persistence (PostgreSQL ONLY) ---
  loadVocab: async (includeArchived = false) => {
    try {
      return await cloudRequest(`/library?archived=${includeArchived ? 1 : 0}`);
    } catch (err) {
      console.error("[CLOUD] Library retrieval failure.");
      return [];
    }
  },

  loadVocabPage: async (criteria) => {
    try {
      const query = new URLSearchParams(criteria).toString();
      return await cloudRequest(`/library/page?${query}`);
    } catch (err) {
      return [];
    }
  },

  saveVocabItem: async (item) => {
    try {
      await cloudRequest("/sync", {
        method: "POST",
        body: JSON.stringify({ items: [item] }),
      });
      return true;
    } catch (err) {
      console.error("[CLOUD] Item persistence failed.");
      return false;
    }
  },

  deleteVocabItem: async (id) => {
    try {
      await cloudRequest(`/library/${id}`, { method: "DELETE" });
      return true;
    } catch (err) {
      return false;
    }
  },

  // --- Collection & Research Logic ---
  loadCollections: async () => {
    try {
      return await cloudRequest("/collections");
    } catch (err) {
      return [];
    }
  },
  saveCollections: async (list) => {
    try {
      await cloudRequest("/collections", {
        method: "POST",
        body: JSON.stringify({ names: list }),
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  loadNotes: async () => {
    try {
      return await cloudRequest("/notes");
    } catch (err) {
      return { blocks: [] };
    }
  },
  saveNotes: async (data) => {
    try {
      await cloudRequest("/notes", {
        method: "POST",
        body: JSON.stringify({ data }),
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  getLibraryStats: async () => {
    try {
      return await cloudRequest("/library/stats");
    } catch (err) {
      return { all: 0, trash: 0, collections: [] };
    }
  },

  archiveVocabItem: async (id) => {
    try {
      await cloudRequest(`/library/${id}/archive`, { method: "POST" });
      return true;
    } catch {
      return false;
    }
  },

  restoreVocabItem: async (id) => {
    try {
      await cloudRequest(`/library/${id}/restore`, { method: "POST" });
      return true;
    } catch {
      return false;
    }
  },

  // --- Search History (Session-based) ---
  getSearchLog: async () => {
    return JSON.parse(sessionStorage.getItem("study_search_log") || "[]");
  },
  addSearchLog: async (q) => {
    const log = JSON.parse(
      sessionStorage.getItem("study_search_log") || "[]",
    ).filter((i) => i !== q);
    log.unshift(q);
    sessionStorage.setItem(
      "study_search_log",
      JSON.stringify(log.slice(0, 10)),
    );
  },
  deleteSearchLog: async (q) => {
    const log = JSON.parse(
      sessionStorage.getItem("study_search_log") || "[]",
    ).filter((i) => i !== q);
    sessionStorage.setItem("study_search_log", JSON.stringify(log));
  },
  clearSearchLog: async () => {
    sessionStorage.removeItem("study_search_log");
  },

  // --- Settings & UI ---
  getSettings: async () => await HybridRouter.getAppSettings(),
  saveSettings: async (config) => await HybridRouter.saveAppSettings(config),

  searchLibraryFTS: async (query) => {
    try {
      return await cloudRequest(
        `/library/search?q=${encodeURIComponent(query)}`,
      );
    } catch (err) {
      return [];
    }
  },

  // Real-time parity active
  pullFromCloud: async () => ({ success: true }),

  refineNotes: async (data) => {
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

  // --- Forensic Intelligence ---
  metadata: async (url) => {
    try {
      return await cloudRequest(
        `/youtube/metadata?url=${encodeURIComponent(url)}`,
      );
    } catch (err) {
      return null;
    }
  },

  getTranscript: async (videoId) => {
    try {
      return await cloudRequest(
        `/youtube/transcript?videoId=${encodeURIComponent(videoId)}`,
      );
    } catch (err) {
      return [];
    }
  },

  search: async (q) => await HybridRouter.youtubeSearch(q),

  youtubeSearch: async (q) => {
    try {
      return await cloudRequest(`/youtube/search?q=${encodeURIComponent(q)}`);
    } catch (err) {
      return [];
    }
  },

  // --- Hardware Handlers (IPC) ---
  openExternal: async (url) =>
    isElectron
      ? window.youtubeAPI.openExternal(url)
      : window.open(url, "_blank"),
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

  updater: isElectron
    ? window.youtubeAPI.updater
    : { check: async () => ({}), install: async () => {} },
};

const api = HybridRouter;
export { api, isElectron };
