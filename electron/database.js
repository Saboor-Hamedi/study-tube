import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const dbPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "StudyTube",
  "studytube.db",
);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize Tables
export function initDatabase() {
  // 1. Library Table (FTS5 enabled)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS library (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      definition TEXT,
      videoTitle TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      collection TEXT,
      archived INTEGER DEFAULT 0,
      metadata TEXT,
      synced INTEGER DEFAULT 0
    )
  `,
  ).run();

  // 2. FTS5 Virtual Table for Library
  try {
    db.prepare(
      `
      CREATE VIRTUAL TABLE IF NOT EXISTS library_fts USING fts5(
        text, 
        definition, 
        videoTitle, 
        content='library', 
        content_rowid='rowid'
      )
    `,
    ).run();
  } catch (e) {
    console.error("FTS5 Init Failure:", e.message);
  }

  // 3. Notes Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  ).run();

  // 4. Collections Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  ).run();

  // 5. Search Log Table (Persistent History)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS search_log (
      query TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  ).run();

  // 6. Global Settings Table (Universal Configuration)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton record
      config TEXT, -- JSON blob of all user preferences/API keys
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  ).run();

  // 7. Forensic Whitelist (Custom Dictionary)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS forensic_whitelist (
      word TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  ).run();

  // 8. Migrations: Add new columns if missing
  try {
    const tableInfo = db.prepare("PRAGMA table_info(library)").all();

    if (!tableInfo.some((col) => col.name === "metadata")) {
      db.exec("ALTER TABLE library ADD COLUMN metadata TEXT");
      console.log("[SQLITE] Migration: Added metadata column to library table");
    }

    if (!tableInfo.some((col) => col.name === "synced")) {
      db.exec("ALTER TABLE library ADD COLUMN synced INTEGER DEFAULT 0");
      console.log(
        "[SQLITE] Migration: Added synced column to library table (Default 0)",
      );
    }
  } catch (e) {
    console.error("[SQLITE] Migration Failure:", e.message);
  }

  // Forced Neural Sync Reset: One-time migration for initial bridge setup
  db.prepare("UPDATE library SET synced = 0").run();
  console.log(
    "[SQLITE] Neural Sync Reset: All local records flagged for Cloud Migration.",
  );
}

/**
 * Notes API
 */
export function getNotes() {
  const row = db.prepare("SELECT data FROM notes WHERE id = 1").get();
  return row ? JSON.parse(row.data) : { blocks: [] };
}

export function saveNotes(data) {
  const raw = JSON.stringify(data);
  db.prepare(
    `
    INSERT OR REPLACE INTO notes (id, data, updated_at) 
    VALUES ('default', ?, CURRENT_TIMESTAMP)
  `,
  ).run(raw);
}

/**
 * Library API
 */
export function getLibrary(includeArchived = false) {
  const query = includeArchived
    ? "SELECT * FROM library ORDER BY date DESC"
    : "SELECT * FROM library WHERE archived = 0 ORDER BY date DESC";
  return db.prepare(query).all();
}

export function getLibraryPage({ collection, sortBy, limit }) {
  let query = "SELECT * FROM library";
  const params = [];

  if (collection === "trash") {
    query += " WHERE archived = 1";
  } else if (collection === "unorganized") {
    query += ' WHERE (collection IS NULL OR collection = "") AND archived = 0';
  } else if (collection && collection !== "all") {
    query += " WHERE collection = ? AND archived = 0";
    params.push(collection);
  } else {
    query += " WHERE archived = 0";
  }

  if (sortBy === "alpha") query += " ORDER BY text ASC";
  else query += " ORDER BY date DESC";

  if (limit) {
    query += " LIMIT ?";
    params.push(limit);
  }

  return db.prepare(query).all(...params);
}

export function getCollectionStats() {
  // Industrial Audit: Ensure NULL archived states are treated as active (0)
  const allCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM library WHERE IFNULL(archived, 0) = 0",
    )
    .get().count;
  const trashCount = db
    .prepare("SELECT COUNT(*) as count FROM library WHERE archived = 1")
    .get().count;
  const collections = db
    .prepare(
      `
    SELECT collection as name, COUNT(*) as count 
    FROM library 
    WHERE IFNULL(archived, 0) = 0 AND collection IS NOT NULL AND collection != ''
    GROUP BY collection
  `,
    )
    .all();

  return { all: allCount, trash: trashCount, collections };
}

export function saveLibrary(items) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO library (id, text, definition, videoTitle, date, collection, archived, metadata, synced) 
    VALUES (@id, @text, @definition, @videoTitle, @date, @collection, @archived, @metadata, 0)
  `);

  const insertFTS = db.prepare(`
    INSERT INTO library_fts (rowid, text, definition, videoTitle) 
    VALUES (@rowid, @text, @definition, @videoTitle)
  `);

  const transaction = db.transaction((list) => {
    for (const item of list) {
      const res = insert.run(item);
      insertFTS.run({
        rowid: res.lastInsertRowid,
        text: item.text,
        definition: item.definition,
        videoTitle: item.videoTitle,
      });
    }
  });

  transaction(items);
}

export function saveVocabItem(item) {
  // Hardened Industrial Extraction: Only bind fields present in the schema
  const dbItem = {
    id: item.id,
    text: item.text,
    definition: item.definition || "",
    videoTitle: item.videoTitle || item.video_title || "",
    date: item.date || new Date().toISOString(),
    collection: item.collection || null,
    archived: item.archived === 1 || item.archived === true ? 1 : 0,
    metadata:
      typeof item.metadata === "object"
        ? JSON.stringify(item.metadata)
        : item.metadata || "{}",
    synced: item.synced === 1 || item.synced === true ? 1 : 0,
  };

  const res = db
    .prepare(
      `
    INSERT OR REPLACE INTO library (id, text, definition, videoTitle, date, collection, archived, metadata, synced) 
    VALUES (@id, @text, @definition, @videoTitle, @date, @collection, @archived, @metadata, @synced)
  `,
    )
    .run(dbItem);

  // Update FTS (Forensic Search Index)
  db.prepare("DELETE FROM library_fts WHERE rowid = ?").run(
    res.lastInsertRowid,
  );
  db.prepare(
    `
    INSERT INTO library_fts (rowid, text, definition, videoTitle) 
    VALUES (?, ?, ?, ?)
  `,
  ).run(res.lastInsertRowid, dbItem.text, dbItem.definition, dbItem.videoTitle);
}

export function deleteVocabItem(id) {
  db.prepare("DELETE FROM library WHERE id = ?").run(id);
}

export function archiveVocabItem(id) {
  db.prepare("UPDATE library SET archived = 1 WHERE id = ?").run(id);
}

export function restoreVocabItem(id) {
  db.prepare("UPDATE library SET archived = 0 WHERE id = ?").run(id);
}

// --- Forensic Whitelist System ---

export function getForensicWhitelist() {
  return db.prepare("SELECT word FROM forensic_whitelist").all().map(r => r.word);
}

export function addForensicWord(word) {
  db.prepare("INSERT OR IGNORE INTO forensic_whitelist (word) VALUES (?)").run(word);
}

export function removeForensicWord(word) {
  db.prepare("DELETE FROM forensic_whitelist WHERE word = ?").run(word);
}

/**
 * Collections API
 */
export function getCollections() {
  return db.prepare("SELECT * FROM collections ORDER BY name ASC").all();
}

export function saveCollections(list) {
  db.prepare("DELETE FROM collections").run();
  const insert = db.prepare("INSERT INTO collections (name) VALUES (?)");
  const transaction = db.transaction((names) => {
    for (const name of names) insert.run(name);
  });
  transaction(list);
}

export function migrateCollection(oldName, newName) {
  db.prepare("UPDATE library SET collection = ? WHERE collection = ?").run(
    newName,
    oldName,
  );
}

export function disbandCollection(name) {
  db.prepare("UPDATE library SET collection = NULL WHERE collection = ?").run(
    name,
  );
}

/**
 * Search History / Logs
 */
export function getSearchLog() {
  return db
    .prepare("SELECT query FROM search_log ORDER BY created_at DESC LIMIT 10")
    .all()
    .map((r) => r.query);
}

export function addSearchLog(query) {
  try {
    db.prepare(
      `
      INSERT INTO search_log (query, created_at) 
      VALUES (?, CURRENT_TIMESTAMP)
      ON CONFLICT(query) DO UPDATE SET created_at = CURRENT_TIMESTAMP
    `,
    ).run(query);
  } catch (err) {
    console.error("[SYSTEM] Search Log Persistence Failure:", err.message);
  }
}

export function deleteSearchLog(query) {
  db.prepare("DELETE FROM search_log WHERE query = ?").run(query);
}

export function clearSearchLog() {
  db.prepare("DELETE FROM search_log").run();
}

/**
 * Neural FTS Search: Returns matches with highlights
 */
export function searchLibraryFTS(query) {
  if (!query || query.trim().length === 0) return [];
  try {
    const rows = db
      .prepare(
        `
      SELECT 
        l.id, 
        l.text, 
        l.definition,
        l.date,
        l.videoTitle,
        snippet(library_fts, 1, '<mark>', '</mark>', '...', 20) as definitionSnippet
      FROM library l
      JOIN library_fts ON l.rowid = library_fts.rowid
      WHERE library_fts MATCH '"' || ? || '"*'
      ORDER BY rank
      LIMIT 6
    `,
      )
      .all(query);
    return rows;
  } catch (err) {
    console.error("[SQLITE FTS ERROR]:", err.message);
    return [];
  }
}

/**
 * Settings API - Blueprint for Neural Config
 */
export function getAppSettings() {
  try {
    const row = db.prepare("SELECT config FROM settings WHERE id = 1").get();
    return row ? JSON.parse(row.config) : {};
  } catch (err) {
    console.error("[SQLITE SETTINGS FETCH ERROR]", err);
    return {};
  }
}

export function saveAppSettings(config) {
  try {
    const raw = typeof config === "string" ? config : JSON.stringify(config);
    db.prepare(
      `
      INSERT OR REPLACE INTO settings (id, config, updated_at) 
      VALUES (1, ?, CURRENT_TIMESTAMP)
    `,
    ).run(raw);
    return true;
  } catch (err) {
    console.error("[SQLITE SETTINGS SAVE ERROR]", err);
    return false;
  }
}

// ─── Cloud Sync Helpers ─────────────────────────────────────────────────────

export function getUnsyncedLibraryItems() {
  try {
    return db
      .prepare(
        "SELECT * FROM library WHERE synced = 0 OR synced IS NULL LIMIT 100",
      )
      .all();
  } catch (err) {
    console.error("[SQLITE SYNC FETCH FAIL]", err);
    return [];
  }
}

export function markItemsAsSynced(ids) {
  if (!ids || ids.length === 0) return;
  try {
    const placeholders = ids.map(() => "?").join(",");
    db.prepare(
      `UPDATE library SET synced = 1 WHERE id IN (${placeholders})`,
    ).run(...ids);
  } catch (err) {
    console.error("[SQLITE SYNC MARK FAIL]", err);
  }
}

export default db;
