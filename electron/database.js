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

  // 3. Collections Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS collections (
      name TEXT PRIMARY KEY
    )
  `).run();

  // 4. FTS5 Virtual Table for Library Search
  try {
    db.prepare(`
      CREATE VIRTUAL TABLE IF NOT EXISTS library_fts USING fts5(
        text, 
        definition, 
        videoTitle, 
        collection,
        content='library',
        content_rowid='rowid'
      )
    `).run();
    
    // Create Triggers to keep FTS in sync
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS library_ai AFTER INSERT ON library BEGIN
        INSERT INTO library_fts(rowid, text, definition, videoTitle, collection) 
        VALUES (new.rowid, new.text, new.definition, new.videoTitle, new.collection);
      END;
      CREATE TRIGGER IF NOT EXISTS library_ad AFTER DELETE ON library BEGIN
        INSERT INTO library_fts(library_fts, rowid, text, definition, videoTitle, collection) 
        VALUES('delete', old.rowid, old.text, old.definition, old.videoTitle, old.collection);
      END;
      CREATE TRIGGER IF NOT EXISTS library_au AFTER UPDATE ON library BEGIN
        INSERT INTO library_fts(library_fts, rowid, text, definition, videoTitle, collection) 
        VALUES('delete', old.rowid, old.text, old.definition, old.videoTitle, old.collection);
        INSERT INTO library_fts(rowid, text, definition, videoTitle, collection) 
        VALUES (new.rowid, new.text, new.definition, new.videoTitle, new.collection);
      END;
    `);
  } catch (e) {
    console.warn('FTS5 Initialization Anomaly:', e.message);
  }
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

export default db;
