# Neural Forensic Suite: Maintenance & Troubleshooting Guide

This document outlines the critical architecture and constraints of the **Writella Neural Forensic Suite**. Follow these guidelines strictly to maintain synchronization between the Electron desktop app, the Web interface, and the PostgreSQL cloud backend.

---

## 🚫 CRITICAL: DO NOT MODIFY THESE SETTINGS

If you change these, the bridge between the Frontend and Backend will break immediately.

### 1. The Port Protocol (8000)

- **FastAPI Port**: Must remain `8000`.
- **The Conflict**: If you see `WinError 10013`, it means another process (or a zombie `uvicorn` instance) is using Port 8000.
- **Fix**: Kill the process manually or restart your machine.

### 2. The Loopback Address (`127.0.0.1`)

- **Consistency**: All internal communication is hardcoded to `127.0.0.1`.
- **Why**: Using `localhost` can sometimes resolve to IPv6 (`::1`) on Windows, which causes connection timeouts in the Python backend.

### 3. The API Bridge (`api-bridge.js`)

- **The Retry Loop**: The bridge has a 10-retry logic to wait for the backend to wake up. **Do not remove this.**
- **The Hybrid Switch**: It automatically detects if it's in Electron (`window.youtubeAPI`) or Web (Direct HTTP). Modifying this logic will break cross-platform compatibility.

---

## 🏗️ ARCHITECTURE: ELECTRON vs. WEB

The app uses a **Hybrid Router** system to ensure data parity.

| Feature           | Electron (Desktop)              | Web (Cloud)                       |
| :---------------- | :------------------------------ | :-------------------------------- |
| **Storage**       | Local PostgreSQL via `pg`       | Remote PostgreSQL via `FastAPI`   |
| **Communication** | `IPC Main` -> `Preload` -> `UI` | `HTTP Fetch` -> `Uvicorn` -> `DB` |
| **Bridge**        | `youtubeAPI` (Electron Bridge)  | `Standard Fetch`                  |

### ⚠️ Common Errors & Fixes

#### 1. "Empty Settings" (The Persistence Bug)

- **Cause**: The UI loaded before the PostgreSQL handshake was complete.
- **Fix**: We implemented **Retry Persistence** in `api-bridge.js`. If the first fetch fails, the app polls every 1 second until the data is retrieved.

#### 2. "Large File Push Failure" (Git Blocks)

- **Cause**: PyInstaller build artifacts (`server/build/`) exceed GitHub's 100MB limit.
- **Rules**:
  - NEVER commit `server/build/` or `server/dist/`.
  - These are added to `.gitignore`. If you accidentally commit them, run `git reset --soft HEAD~1`.

#### 3. "Infinite Scanning Loop"

- **Cause**: React state update in a `useEffect` loop triggered by polling.
- **Fix**: Use **Optimistic Updates**. When adding a word to the dictionary, clear the highlight immediately in the UI instead of triggering a full re-scan.

---

## ⚖️ FORENSIC RIGOR CONSTRAINTS

### `legitimateDoubles.js` (The 7MB Giant)

This file contains over 450,000 legitimate English words and scientific terms.

- **Status**: It is large, but **REQUIRED**.
- **Performance**: It is loaded into a **Trie (Prefix Tree)** for $O(L)$ lookup speed.
- **DO NOT** delete this file or the Forensic Engine will flag every second word as an anomaly.

---

## 🚀 DEPLOYMENT CHECKLIST

Before publishing a new version:

1. Update `version` in `package.json`.
2. Run `npm run build` for the frontend.
3. Ensure `server/build` is deleted to keep the Git history clean.
4. Verify the `PostgreSQL` connection string in `.env`.

> [!IMPORTANT]
> Always maintain the **Neural Sentry** logs in development mode. If the logs are missing, the bridge is likely offline.
