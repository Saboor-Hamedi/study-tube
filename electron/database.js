import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

// Industrial PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "writella",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "jan",
  port: parseInt(process.env.DB_PORT || "5432"),
  max: 20, // Connection safety limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper for industrial error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('[POSTGRES] Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[POSTGRES] Query Error:', err.message);
    throw err;
  }
};

/**
 * Initialize Tables (Mirror Cloud Schema)
 */
export async function initDatabase() {
  // console.log("[POSTGRES] Initializing Industrial Schema...");
  try {
    // 1. Extensions
    await query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

    // 2. Library Table
    await query(`
      CREATE TABLE IF NOT EXISTS library (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        definition TEXT,
        video_title TEXT,
        timestamp DOUBLE PRECISION,
        date TEXT,
        archived BOOLEAN DEFAULT FALSE,
        collection TEXT,
        type TEXT,
        metadata TEXT,
        synced BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Notes Table
    await query(`
      CREATE TABLE IF NOT EXISTS notes (
        user_id TEXT PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Collections Table
    await query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Search Log Table
    await query(`
      CREATE TABLE IF NOT EXISTS search_log (
        query TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Global Settings Table
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        config JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Forensic Whitelist
    await query(`
      CREATE TABLE IF NOT EXISTS forensic_whitelist (
        word TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // console.log("[POSTGRES] Industrial Synchronization Successful.");
  } catch (err) {
    console.error("[POSTGRES] Schema Init Failure:", err.message);
  }
}

/**
 * Notes API
 */
const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

export async function getNotes() {
  const res = await query("SELECT data FROM notes WHERE user_id = $1", [SINGLETON_ID]);
  return res.rows[0] ? res.rows[0].data : { blocks: [] };
}

export async function saveNotes(data) {
  await query(
    `INSERT INTO notes (user_id, data, updated_at) 
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
    [SINGLETON_ID, JSON.stringify(data)]
  );
}

/**
 * Library API
 */
export async function getLibrary(includeArchived = false) {
  const sql = includeArchived
    ? "SELECT * FROM library ORDER BY date DESC"
    : "SELECT * FROM library WHERE archived = FALSE ORDER BY date DESC";
  const res = await query(sql);
  
  // Map snake_case to camelCase for UI compatibility
  return res.rows.map(r => ({
    ...r,
    videoTitle: r.video_title,
    archived: r.archived ? 1 : 0,
    synced: r.synced ? 1 : 0
  }));
}

export async function getLibraryPage({ collection, sortBy, limit }) {
  let sql = "SELECT * FROM library";
  const params = [];
  let paramCount = 1;

  if (collection === "trash") {
    sql += " WHERE archived = TRUE";
  } else if (collection === "unorganized") {
    sql += ' WHERE (collection IS NULL OR collection = \'\') AND archived = FALSE';
  } else if (collection && collection !== "all") {
    sql += ` WHERE collection = $${paramCount++} AND archived = FALSE`;
    params.push(collection);
  } else {
    sql += " WHERE archived = FALSE";
  }

  if (sortBy === "alpha") sql += " ORDER BY text ASC";
  else sql += " ORDER BY date DESC";

  if (limit) {
    sql += ` LIMIT $${paramCount++}`;
    params.push(limit);
  }

  const res = await query(sql, params);
  return res.rows.map(r => ({
    ...r,
    videoTitle: r.video_title,
    archived: r.archived ? 1 : 0,
    synced: r.synced ? 1 : 0
  }));
}

export async function getCollectionStats() {
  const allCount = (await query("SELECT COUNT(*) FROM library WHERE archived = FALSE")).rows[0].count;
  const trashCount = (await query("SELECT COUNT(*) FROM library WHERE archived = TRUE")).rows[0].count;
  const collections = (await query(`
    SELECT collection as name, COUNT(*) 
    FROM library 
    WHERE archived = FALSE AND collection IS NOT NULL AND collection != ''
    GROUP BY collection
  `)).rows;

  return { 
    all: parseInt(allCount), 
    trash: parseInt(trashCount), 
    collections: collections.map(c => ({ name: c.name, count: parseInt(c.count) })) 
  };
}

export async function saveLibrary(items) {
  for (const item of items) {
    await saveVocabItem(item);
  }
}

export async function saveVocabItem(item) {
  const metaStr = typeof item.metadata === "object" ? JSON.stringify(item.metadata) : item.metadata || "{}";
  
  await query(`
    INSERT INTO library (id, text, definition, video_title, timestamp, date, archived, collection, metadata, synced) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
    ON CONFLICT (id) DO UPDATE SET
      text = EXCLUDED.text,
      definition = EXCLUDED.definition,
      video_title = EXCLUDED.video_title,
      timestamp = EXCLUDED.timestamp,
      date = EXCLUDED.date,
      archived = EXCLUDED.archived,
      collection = EXCLUDED.collection,
      metadata = EXCLUDED.metadata,
      synced = TRUE,
      updated_at = CURRENT_TIMESTAMP
  `, [
    item.id, 
    item.text, 
    item.definition || "", 
    item.videoTitle || item.video_title || "", 
    item.timestamp || 0,
    item.date || new Date().toISOString(),
    item.archived === 1 || item.archived === true,
    item.collection || null,
    metaStr
  ]);
}

export async function deleteVocabItem(id) {
  await query("DELETE FROM library WHERE id = $1", [id]);
}

export async function archiveVocabItem(id) {
  await query("UPDATE library SET archived = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

export async function restoreVocabItem(id) {
  await query("UPDATE library SET archived = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

// --- Forensic Whitelist System ---

export async function getForensicWhitelist() {
  // console.log("[POSTGRES] >>> FETCHING FORENSIC WHITELIST <<<");
  const res = await query("SELECT word FROM forensic_whitelist");
  // console.log(`[POSTGRES] >>> SYNC SUCCESSFUL: ${res.rowCount} WORDS RETRIEVED <<<`);
  return res.rows.map(r => r.word);
}

export async function addForensicWord(word) {
  // console.log(`[POSTGRES] >>> ATTEMPTING TO WHITELIST WORD: "${word}" <<<`);
  await query("INSERT INTO forensic_whitelist (word) VALUES ($1) ON CONFLICT DO NOTHING", [word]);
  // console.log(`[POSTGRES] >>> WORD PERMANENTLY WHITELISTED: "${word}" <<<`);
}

export async function removeForensicWord(word) {
  await query("DELETE FROM forensic_whitelist WHERE word = $1", [word]);
}

export async function getForensicWhitelistMetadata() {
  const res = await query("SELECT COUNT(*) as count, MAX(created_at) as last_updated FROM forensic_whitelist");
  return {
    count: parseInt(res.rows[0].count),
    lastUpdated: res.rows[0].last_updated ? new Date(res.rows[0].last_updated).getTime() : 0
  };
}

/**
 * Collections API
 */
export async function getCollections() {
  const res = await query("SELECT name FROM collections ORDER BY name ASC");
  return res.rows;
}

export async function saveCollections(list) {
  await query("DELETE FROM collections");
  for (const name of list) {
    await query("INSERT INTO collections (name) VALUES ($1)", [name]);
  }
}

export async function migrateCollection(oldName, newName) {
  await query("UPDATE library SET collection = $1 WHERE collection = $2", [newName, oldName]);
}

export async function disbandCollection(name) {
  await query("UPDATE library SET collection = NULL WHERE collection = $1", [name]);
}

/**
 * Search History / Logs
 */
export async function getSearchLog() {
  const res = await query("SELECT query FROM search_log ORDER BY created_at DESC LIMIT 10");
  return res.rows.map(r => r.query);
}

export async function addSearchLog(queryText) {
  await query(`
    INSERT INTO search_log (query, created_at) 
    VALUES ($1, CURRENT_TIMESTAMP)
    ON CONFLICT (query) DO UPDATE SET created_at = CURRENT_TIMESTAMP
  `, [queryText]);
}

export async function deleteSearchLog(queryText) {
  await query("DELETE FROM search_log WHERE query = $1", [queryText]);
}

export async function clearSearchLog() {
  await query("DELETE FROM search_log");
}

/**
 * Neural FTS Search: Utilizing PostgreSQL pg_trgm for fuzzy search
 */
export async function searchLibraryFTS(q) {
  if (!q || q.trim().length === 0) return [];
  const res = await query(`
    SELECT *, 
           similarity(text, $1) as rank
    FROM library 
    WHERE text ILIKE $2 OR video_title ILIKE $2
    ORDER BY rank DESC
    LIMIT 10
  `, [q, `%${q}%`]);
  
  return res.rows.map(r => ({
    ...r,
    videoTitle: r.video_title,
    archived: r.archived ? 1 : 0,
    synced: r.synced ? 1 : 0
  }));
}

/**
 * Settings API
 */
export async function getAppSettings() {
  const res = await query("SELECT config FROM settings WHERE user_id = $1", [SINGLETON_ID]);
  return res.rows[0] ? res.rows[0].config : {};
}

export async function saveAppSettings(config) {
  await query(`
    INSERT INTO settings (user_id, config, updated_at) 
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET config = EXCLUDED.config, updated_at = CURRENT_TIMESTAMP
  `, [SINGLETON_ID, JSON.stringify(config)]);
  return true;
}

// ─── Sync Compatibility (Placeholder for Legacy Code) ──────────────────────
export async function getUnsyncedLibraryItems() { return []; }
export async function markItemsAsSynced() { return; }

export default pool;
