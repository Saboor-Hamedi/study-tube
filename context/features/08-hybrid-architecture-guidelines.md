# 08: Hybrid Architecture Guidelines

> [!IMPORTANT]
> Read this document before modifying `main.js`, `api-bridge.js`, or core logic. It details critical regressions introduced during the Hybrid Cloud-Native Architecture migration and sets strict standards to prevent recurrence. NEVER TOUCH OR REVERT THE ESTABLISHED LOGIC DOCUMENTED BELOW.

## DevTools and Keyboard Shortcuts (CRITICAL: NEVER TOUCH THIS LOGIC)

Never bypass `allowDevTools` with `!app.isPackaged`. A previous iteration forced `!app.isPackaged || allowDevTools`, which bypassed the DevTools toggle in development mode (`npm run dev`). Always enforce `allowDevTools` strictly across both development and production environments within `before-input-event` in `main.js`.

Do not use `globalShortcut` for DevTools. `globalShortcut` hijacks keyboard inputs across the entire operating system. Always use localized listeners like `before-input-event` directly on the `mainWindow.webContents`.

Prevent Shift-Key collisions. When implementing shortcut combinations like `Ctrl + I` in `useShortcuts.js`, you must explicitly verify `!e.shiftKey`. Failure to do so allows standard operating system shortcuts like `Ctrl + Shift + I` to trigger unintended listeners.

### The Chromium DevTools Flash Bug & Window Menu Interception
In packaged production builds (`app.isPackaged`), do NOT call `mainWindow.removeMenu()`. Calling `removeMenu()` strips the window of an Electron menu, causing Chromium's built-in hardcoded browser accelerators (`F12` and `Ctrl+Shift+I`) to fire natively. This causes a severe visual glitch where DevTools flashes open before `devtools-opened` can slam it shut.

**Mandatory Architecture**: You MUST attach a custom window menu containing the DevTools accelerators (`CommandOrControl+Shift+I`, `F12`) and immediately hide it using `mainWindow.setMenuBarVisibility(false)`. This allows Electron to intercept the keypresses at the native window level before Chromium receives them. When `allowDevTools` is false, the menu click handler does nothing, ensuring DevTools never opens, flashes, or closes.

### Dual-Layer DevTools Persistence
`allowDevTools` must never be a volatile in-memory variable. It MUST be persisted across application restarts via two synchronized layers:
1. **Backend (`main.js`)**: Saved to disk via `writeAppState({ allowDevTools })` and initialized from `readAppState().allowDevTools`.
2. **Frontend (`api-bridge.js` & `SettingsView.jsx`)**: Mirrored into `localStorage.setItem("study_devtools_enabled", state)`. The frontend must actively hydrate this state on mount via `activeApi.getDevTools()`.

## API Bridge and IPC Routing

Never hardcode HTTP `fetch` requests without checking for the Electron environment first. The `api-bridge.js` file was previously modified to blindly request data from `http://127.0.0.1:8000` for the "Cloud-First Architecture". This broke the packaged `.exe` production build because the desktop app requires native PostgreSQL access via Electron's Inter-Process Communication (IPC).

Every data retrieval function in `api-bridge.js` (including settings, vocab, collections, notes, FTS search, transcripts, and metadata) must check `if (isElectron)` and route the request to `window.youtubeAPI` before falling back to `cloudRequest` for web contexts.

## Database Initialization and Environment Resolution

Environment variables must be dynamically resolved in production. A static `dotenv/config` import previously caused the packaged application to fail to load database credentials. This crashed the PostgreSQL connection, preventing `initDatabase()` from executing and leaving the system without `settings` and `library` tables.

You must utilize `app.asar.unpacked` to load environment variables securely in packaged builds. Refer to `main.js` and `database.js` for the strict `envPath` resolution logic. Do not revert to standard `process.cwd()` fallbacks.

## Port Collisions and Lingering Cloud Binaries (`[WinError 10013]`)

When running `npm run publish:win` or testing production builds, Electron spawns the compiled FastAPI cloud binary (`main.exe`) on port 8000. If the application is terminated forcefully or packages asynchronously, `main.exe` can linger in the background as an orphaned process holding port 8000.

Subsequent attempts to run `npm run dev` will fail with `[WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions`. 

**Mandatory Resolution**: Agents must never change port numbers to bypass this error. You must identify the lingering process (`netstat -ano | findstr :8000`) and terminate it cleanly (`taskkill /F /PID <PID> /T` or `taskkill /F /IM main.exe /T` / `taskkill /F /IM python.exe /T`).
