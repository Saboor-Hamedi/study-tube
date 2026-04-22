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
      summary TEXT,
      videoTitle TEXT,
      timestamp REAL,
      date TEXT,
      archived INTEGER DEFAULT 0,
      collection TEXT,
      type TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 2a. Industrial Migration: Ensure 'summary' column exists for legacy databases
  try {
    db.prepare('ALTER TABLE library ADD COLUMN summary TEXT').run();
    console.log('[SQLITE] Database Migrated: Added summary column');
  } catch (e) {
    // Column already exists, ignore error
  }

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
 * Library API - Industrial Scale Optimized
 */
export function getLibraryPage({ collection = 'all', sortBy = 'newest', limit = 12, offset = 0 }) {
  let query = 'SELECT * FROM library';
  const params = [];

  // Filter Logic
  if (collection === 'all') {
    query += ' WHERE IFNULL(archived, 0) = 0';
  } else if (collection === 'trash') {
    query += ' WHERE IFNULL(archived, 0) = 1';
  } else {
    query += ' WHERE IFNULL(archived, 0) = 0 AND collection = ?';
    params.push(collection);
  }

  // Sorting Logic
  if (sortBy === 'alpha') {
    query += ' ORDER BY text ASC';
  } else {
    query += ' ORDER BY date DESC';
  }

  // Pagination
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({ ...r, archived: !!r.archived }));
}

export function getCollectionStats() {
  try {
    // Industrial Counting: Treat NULL as 0 (Unarchived)
    const all = db.prepare('SELECT COUNT(*) as count FROM library WHERE IFNULL(archived, 0) = 0').get().count;
    const trash = db.prepare('SELECT COUNT(*) as count FROM library WHERE IFNULL(archived, 0) = 1').get().count;
    
    const collections = db.prepare(`
      SELECT collection as name, COUNT(*) as count 
      FROM library 
      WHERE IFNULL(archived, 0) = 0 AND collection IS NOT NULL AND collection != ''
      GROUP BY collection
    `).all();

    return { all, trash, collections };
  } catch (err) {
    console.error('[SQLITE STATS ERROR]', err.message);
    return { all: 0, trash: 0, collections: [] };
  }
}

export function saveVocabItem(item) {
  const stmt = db.prepare(`
    INSERT INTO library (id, text, definition, summary, videoTitle, timestamp, date, archived, collection, type)
    VALUES (@id, @text, @definition, @summary, @videoTitle, @timestamp, @date, @archived, @collection, @type)
    ON CONFLICT(id) DO UPDATE SET
      text = excluded.text,
      definition = excluded.definition,
      summary = excluded.summary,
      videoTitle = excluded.videoTitle,
      archived = excluded.archived,
      collection = excluded.collection,
      type = excluded.type,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run({
    id: item.date || item.id || new Date().toISOString(),
    text: item.text || '',
    definition: item.definition || '',
    summary: item.summary || null,
    videoTitle: item.videoTitle || 'Universal Knowledge',
    timestamp: item.timestamp || 0,
    date: item.date || new Date().toISOString(),
    archived: item.archived ? 1 : 0,
    collection: item.collection || null,
    type: item.type || ''
  });
}

export function migrateCollection(oldName, newName) {
  db.prepare('UPDATE library SET collection = ? WHERE collection = ?').run(newName, oldName);
  db.prepare('UPDATE collections SET name = ? WHERE name = ?').run(newName, oldName);
}

export function disbandCollection(name) {
  db.prepare('UPDATE library SET collection = NULL WHERE collection = ?').run(name);
  db.prepare('DELETE FROM collections WHERE name = ?').run(name);
}

export function getLibrary() {
  const rows = db.prepare('SELECT * FROM library ORDER BY date DESC').all();
  return rows.map(r => ({ ...r, archived: !!r.archived }));
}

export function deleteVocabItem(id) {
  db.prepare('DELETE FROM library WHERE id = ?').run(id);
}

// Legacy support for smaller migrations, but we should move away from this
export function saveLibrary(items) {
  db.transaction(() => {
    db.prepare('DELETE FROM library').run();
    const insert = db.prepare(`
      INSERT INTO library (id, text, definition, videoTitle, timestamp, date, archived, collection, type)
      VALUES (@date, @text, @definition, @videoTitle, @timestamp, @date, @archived, @collection, @type)
    `);
    for (const item of items) {
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
      LIMIT 6
    `).all(query);

    return rows;
  } catch (err) {
    console.error('[SQLITE FTS ERROR]:', err.message);
    return [];
  }
}

export default db;
