import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Folder,
  Download,
  Terminal,
  Sun,
  Moon,
  RefreshCcw,
  Check,
} from "lucide-react";
import { api as bridgeApi } from "./../../utils/api-bridge";

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
      enabled ? "bg-accent" : "bg-surface-3 border border-border"
    }`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </button>
);

const SettingsView = ({ api, theme, onToggleTheme, onExport }) => {
  const activeApi = api || bridgeApi;
  const [apiKey, setApiKey] = useState("");
  const [savePath, setSavePath] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [devToolsEnabled, setDevToolsEnabled] = useState(false);

  const [updateStatus, setUpdateStatus] = useState("idle");
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [version, setVersion] = useState("0.0.0");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const key = await activeApi.getAiKey();
        const path = await activeApi.getSavePath();
        setApiKey(key || "");
        setSavePath(path || "");
        const ver = await activeApi.getVersion?.();
        if (ver) setVersion(ver);
      } catch (err) {
        console.warn("[IPC SYNC] Version deferred.", err);
      }
    };
    loadSettings();

    if (activeApi?.updater?.onUpdateStatus) {
      const unsubs = activeApi.updater.onUpdateStatus((data) => {
        setUpdateStatus(data.status);
        if (data.info) setUpdateInfo(data.info);
        if (data.status === "downloading" && data.info?.percent) {
          setUpdateProgress(Math.round(data.info.percent));
        }
      });
      return () => unsubs();
    }
  }, [activeApi]);

  const handleSaveKey = async () => {
    setIsSaving(true);
    await activeApi.setAiKey(apiKey);
    setIsSaving(false);
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 2000);
  };

  const handlePickPath = async () => {
    const path = await activeApi.pickSavePath();
    if (path) {
      setSavePath(path);
      await activeApi.setSavePath(path);
    }
  };

  const handleCheckUpdate = () => activeApi?.updater?.check();
  const handleInstallUpdate = () => activeApi?.updater?.install();

  const handleToggleDevTools = async () => {
    if (activeApi?.toggleDevTools) {
      const state = await activeApi.toggleDevTools();
      setDevToolsEnabled(state);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-stable p-6 lg:p-10 bg-background transition-colors duration-300 custom-scroll select-text"
    >
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        <header className="border-b border-border pb-4">
          <h1 className="text-2xl font-semibold text-text">Settings</h1>
          <p className="text-sm text-muted mt-1">Manage application preferences and configurations.</p>
        </header>

        <div className="space-y-6">
          {/* General Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">General</h2>
            <div className="bg-surface border border-border rounded-lg divide-y divide-border overflow-hidden shadow-sm">
              
              <div className="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-3 rounded-md text-text"><Folder className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-text">Save Location</p>
                    <p className="text-xs text-muted font-mono mt-0.5">{savePath || "Not set"}</p>
                  </div>
                </div>
                <button onClick={handlePickPath} className="text-xs font-medium text-accent hover:text-accent/80 px-3 py-1.5 bg-accent/10 rounded-md transition-colors">
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-3 rounded-md text-text">
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Appearance</p>
                    <p className="text-xs text-muted mt-0.5">Toggle light or dark theme</p>
                  </div>
                </div>
                <Toggle enabled={theme === 'dark'} onChange={onToggleTheme} />
              </div>

            </div>
          </section>

          {/* Integration Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Integration</h2>
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm p-4 space-y-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text">
                  <Key className="w-4 h-4" /> API Key
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API Key..."
                    className="flex-1 bg-surface-3 border border-border rounded-md py-2 px-3 text-sm text-text outline-none focus:border-accent transition-colors font-mono"
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={isSaving}
                    className="px-4 py-2 bg-text text-background text-sm font-medium rounded-md hover:bg-text/90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Save"}
                  </button>
                </div>
                <AnimatePresence>
                  {showStatus && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-emerald-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved successfully
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Data Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Data</h2>
            <div className="bg-surface border border-border rounded-lg divide-y divide-border overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-3 rounded-md text-text"><Download className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-text">Export Data</p>
                    <p className="text-xs text-muted mt-0.5">Download a copy of your library</p>
                  </div>
                </div>
                <button onClick={onExport} className="text-xs font-medium text-text hover:text-text px-3 py-1.5 border border-border bg-surface-3 rounded-md transition-colors hover:bg-surface-2">
                  Export
                </button>
              </div>
            </div>
          </section>

          {/* Developer Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Developer</h2>
            <div className="bg-surface border border-border rounded-lg divide-y divide-border overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 text-red-500 rounded-md"><Terminal className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-text">Developer Tools</p>
                    <p className="text-xs text-muted mt-0.5">Allow F12 / Ctrl+Shift+I for debugging</p>
                  </div>
                </div>
                <Toggle enabled={devToolsEnabled} onChange={handleToggleDevTools} />
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">About</h2>
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text">Version {version}</span>
                  <span className="text-xs text-muted mt-0.5">
                    {updateStatus === "downloaded" ? "Update ready to install." : 
                     updateStatus === "available" ? "Downloading update..." : 
                     updateStatus === "checking" ? "Checking for updates..." : "Up to date."}
                  </span>
                </div>
                {updateStatus === "downloaded" ? (
                  <button onClick={handleInstallUpdate} className="text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-md transition-colors">
                    Restart to Update
                  </button>
                ) : (
                  <button onClick={handleCheckUpdate} disabled={updateStatus === "checking" || updateStatus === "downloading"} className="text-xs font-medium text-text px-3 py-1.5 border border-border bg-surface-3 rounded-md hover:bg-surface-2 transition-colors disabled:opacity-50">
                    Check for Updates
                  </button>
                )}
              </div>
              {updateStatus === "downloading" && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Downloading...</span>
                    <span>{updateProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-300" style={{ width: `${updateProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  );
};

export default SettingsView;
