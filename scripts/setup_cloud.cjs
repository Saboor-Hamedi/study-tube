const Database = require("better-sqlite3");
const path = require("path");
const os = require("os");

// Industrial Path Resolution
const dbPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "StudyTube",
  "studytube.db",
);
console.log("--- Writella Neural Configurator ---");
console.log("Targeting Database:", dbPath);

try {
  const db = new Database(dbPath);

  // 1. Fetch current settings
  const row = db.prepare("SELECT config FROM settings WHERE id = 1").get();
  let config = row ? JSON.parse(row.config) : {};

  // 2. Inject Cloud Bridge Configuration
  config.cloudApiUrl = "http://127.0.0.1:8000";
  console.log("Injecting Cloud API URL: http://127.0.0.1:8000");

  // 3. Persist to SQLite
  db.prepare("INSERT OR REPLACE INTO settings (id, config) VALUES (1, ?)").run(
    JSON.stringify(config),
  );

  console.log("--- CONFIGURATION COMPLETE ---");
  console.log("✅ Your local research is now connected to the Cloud Bridge.");
  console.log("Please restart your Writella app to begin synchronization.");
} catch (err) {
  console.error("CRITICAL ERROR:", err.message);
  console.log(
    "\nTip: Make sure the Writella app is CLOSED before running this script.",
  );
}
