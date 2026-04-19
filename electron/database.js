import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'studytube.db');
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

/**
 * Initialize Tables and FTS5
 */
export function initDatabase() {
  // 1. Notes Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY CHECK (id = 1), -- Hardcoded ID to ensure singleton
      data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 2. Library Table (Vocabulary/Captures)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS library (
      id TEXT PRIMARY KEY, 
      text TEXT,
      definition TEXT,
      videoTitle TEXT,
      timestamp REAL,
      date TEXT,
      archived INTEGER DEFAULT 0,
      collection TEXT,
      type TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 2b. High-Performance B-Tree Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_library_collection ON library(collection);
    CREATE INDEX IF NOT EXISTS idx_library_date ON library(date);
    CREATE INDEX IF NOT EXISTS idx_library_archived ON library(archived);
  `);

  // 3. Collections Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS collections (
      name TEXT PRIMARY KEY
    )
  `).run();

  // 4. FTS5 Virtual Table for Library Search
  try {
    // Industrial Search: Library FTS5 Index with Porter Stemming
    db.exec(`
      DROP TABLE IF EXISTS library_fts;
      CREATE VIRTUAL TABLE library_fts USING fts5(
        text, 
        definition, 
        videoTitle, 
        collection,
        content='library',
        content_rowid='rowid',
        tokenize="porter unicode61 remove_diacritics 1"
      );
      
      -- Initial Indexing Migration
      INSERT INTO library_fts(rowid, text, definition, videoTitle, collection)
      SELECT rowid, text, definition, videoTitle, collection FROM library;

      -- Sync Triggers (Recreated with table)
      DROP TRIGGER IF EXISTS library_ai;
      DROP TRIGGER IF EXISTS library_ad;
      DROP TRIGGER IF EXISTS library_au;

      CREATE TRIGGER library_ai AFTER INSERT ON library BEGIN
        INSERT INTO library_fts(rowid, text, definition, videoTitle, collection) 
        VALUES (new.rowid, new.text, new.definition, new.videoTitle, new.collection);
      END;

      CREATE TRIGGER library_ad AFTER DELETE ON library BEGIN
        INSERT INTO library_fts(library_fts, rowid, text, definition, videoTitle, collection) 
        VALUES('delete', old.rowid, old.text, old.definition, old.videoTitle, old.collection);
      END;

      CREATE TRIGGER library_au AFTER UPDATE ON library BEGIN
        INSERT INTO library_fts(library_fts, rowid, text, definition, videoTitle, collection) 
        VALUES('delete', old.rowid, old.text, old.definition, old.videoTitle, old.collection);
        INSERT INTO library_fts(rowid, text, definition, videoTitle, collection) 
        VALUES (new.rowid, new.text, new.definition, new.videoTitle, new.collection);
      END;
    `);
  } catch (e) {
    console.warn('FTS5 Initialization Anomaly:', e.message);
  }

  // 5. Search Log Table (Persistent History)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS search_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}


/**
 * Notes API
 */
export function getNotes() {
  const row = db.prepare('SELECT data FROM notes WHERE id = 1').get();
  return row ? JSON.parse(row.data) : { blocks: [] };
}

export function saveNotes(data) {
  const raw = typeof data === 'string' ? data : JSON.stringify(data);
  db.prepare('INSERT OR REPLACE INTO notes (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)').run(raw);
}

/**
 * Library API
 */
export function getLibrary() {
  const rows = db.prepare('SELECT * FROM library ORDER BY date DESC').all();
  return rows.map(r => ({ ...r, archived: !!r.archived }));
}

export function saveLibrary(items) {
  db.transaction(() => {
    db.prepare('DELETE FROM library').run();
    const insert = db.prepare(`
      INSERT INTO library (id, text, definition, videoTitle, timestamp, date, archived, collection, type)
      VALUES (@date, @text, @definition, @videoTitle, @timestamp, @date, @archived, @collection, @type)
    `);
    for (const item of items) {
      try {
        insert.run({
          text: item.text || '',
          videoTitle: item.videoTitle || 'Universal Source',
          timestamp: item.timestamp || 0,
          date: item.date || new Date().toISOString(),
          archived: item.archived ? 1 : 0,
          collection: item.collection || null,
          type: item.type || '',
          definition: item.definition || ''
        });
      } catch (err) {
        console.error('[SYSTEM] Row Persistence Failure:', err.message);
      }
    }
  })();
}

/**
 * Collections API
 */
export function getCollections() {
  const rows = db.prepare('SELECT name FROM collections').all();
  return rows.map(r => r.name);
}

export function saveCollections(names) {
  db.transaction(() => {
    db.prepare('DELETE FROM collections').run();
    const insert = db.prepare('INSERT INTO collections (name) VALUES (?)');
    for (const name of names) insert.run(name);
  })();
}

/**
 * Search Log API
 */
export function getSearchLog() {
  try {
    const rows = db.prepare('SELECT query FROM search_log ORDER BY created_at DESC LIMIT 10').all();
    console.log(`[SQLITE] Fetched ${rows.length} search logs`);
    return rows.map(r => r.query);
  } catch (err) {
    console.error('[SQLITE ERROR] Fetch Log Failure:', err.message);
    return [];
  }
}

export function addSearchLog(query) {
  try {
    console.log(`[SQLITE] Committing Query: "${query}"`);
    // Insert or update timestamp if exists
    db.prepare(`
      INSERT INTO search_log (query, created_at) 
      VALUES (?, CURRENT_TIMESTAMP)
      ON CONFLICT(query) DO UPDATE SET created_at = CURRENT_TIMESTAMP
    `).run(query);
    console.log(`[SQLITE] Query Saved Successfully`);
  } catch (err) {
    console.error('[SYSTEM] Search Log Persistence Failure:', err.message);
  }
}

export function deleteSearchLog(query) {
  db.prepare('DELETE FROM search_log WHERE query = ?').run(query);
}

export function clearSearchLog() {
  db.prepare('DELETE FROM search_log').run();
}

/**
 * Neural FTS Search: Returns matches with highlights
 */
export function searchLibraryFTS(query) {
  if (!query || query.trim().length === 0) return [];
  try {
    // Search across word, definition, and title using FTS5
    // We use snippet() to get the highlighted context
    const rows = db.prepare(`
      SELECT 
        l.id, 
        l.text, 
        l.videoTitle,
        snippet(library_fts, 1, '<mark>', '</mark>', '...', 20) as definitionSnippet
      FROM library l
      JOIN library_fts ON l.rowid = library_fts.rowid
      WHERE library_fts MATCH '"' || ? || '"*'
      ORDER BY rank
      LIMIT 10
    `).all(query);

    return rows;
  } catch (err) {
    console.error('[SQLITE FTS ERROR]:', err.message);
    return [];
  }
}

export default db;
