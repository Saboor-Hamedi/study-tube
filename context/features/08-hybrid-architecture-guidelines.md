# 08: Hybrid Architecture Guidelines

> [!IMPORTANT]
> Read this document before modifying `main.js`, `api-bridge.js`, or core logic. It details critical regressions introduced during the Hybrid Cloud-Native Architecture migration and sets strict standards to prevent recurrence.

## DevTools and Keyboard Shortcuts

Never bypass `allowDevTools` with `!app.isPackaged`. A previous iteration forced `!app.isPackaged || allowDevTools`, which bypassed the DevTools toggle in development mode (`npm run dev`). Always enforce `allowDevTools` strictly across both development and production environments within `before-input-event` in `main.js`.

Do not use `globalShortcut` for DevTools. `globalShortcut` hijacks keyboard inputs across the entire operating system. Always use localized listeners like `before-input-event` directly on the `mainWindow.webContents`.

Prevent Shift-Key collisions. When implementing shortcut combinations like `Ctrl + I` in `useShortcuts.js`, you must explicitly verify `!e.shiftKey`. Failure to do so allows standard operating system shortcuts like `Ctrl + Shift + I` to trigger unintended listeners.

## API Bridge and IPC Routing

Never hardcode HTTP `fetch` requests without checking for the Electron environment first. The `api-bridge.js` file was previously modified to blindly request data from `http://127.0.0.1:8000` for the "Cloud-First Architecture". This broke the packaged `.exe` production build because the desktop app requires native PostgreSQL access via Electron's Inter-Process Communication (IPC).

Every data retrieval function in `api-bridge.js` (including settings, vocab, collections, and metadata) must check `if (isElectron)` and route the request to `window.youtubeAPI` before falling back to `cloudRequest` for web contexts.

## Database Initialization and Environment Resolution

Environment variables must be dynamically resolved in production. A static `dotenv/config` import previously caused the packaged application to fail to load database credentials. This crashed the PostgreSQL connection, preventing `initDatabase()` from executing and leaving the system without `settings` and `library` tables.

You must utilize `app.asar.unpacked` to load environment variables securely in packaged builds. Refer to `main.js` and `database.js` for the strict `envPath` resolution logic. Do not revert to standard `process.cwd()` fallbacks.
