-- ==========================================
-- STUDYTUBE UNIVERSAL POSTGRESQL SCHEMA
-- Matches local SQLite (studytube.db)
-- ==========================================

-- Enable extensions for performance and uniqueness
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For ultra-fast search like FTS5


select * from library ;
-- 1. Research Library (The Core Data)
CREATE TABLE IF NOT EXISTS library (
    id TEXT PRIMARY KEY, 
    text TEXT NOT NULL,
    definition TEXT,
    video_title TEXT, -- Unified casing (Postgres prefers snake_case or consistent casing)
    timestamp DOUBLE PRECISION,
    date TIMESTAMPTZ DEFAULT NOW(),
    archived BOOLEAN DEFAULT FALSE,
    collection TEXT DEFAULT 'all',
    type TEXT,
    metadata JSONB, -- Stores extra flags, analysis, etc.
    synced BOOLEAN DEFAULT TRUE, -- For the Electron-to-Cloud sync engine
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search Index (Postgres equivalent of FTS5)
CREATE INDEX idx_library_search ON library USING GIN (text gin_trgm_ops);
CREATE INDEX idx_library_collection ON library(collection);


select * from collections;
-- 2. Research Collections
CREATE TABLE IF NOT EXISTS collections (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Research Notes (Singleton per user)
CREATE TABLE IF NOT EXISTS notes (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data JSONB DEFAULT '{"blocks": []}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
select * from public.search_log;
select * from notes;
-- 4. Search Analytics Log
CREATE TABLE IF NOT EXISTS search_log (
    id SERIAL PRIMARY KEY,
    query TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Global Application Settings
-- Blueprint for Cloud Parity
CREATE TABLE IF NOT EXISTS settings (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB DEFAULT '{}'::jsonb, -- Stores API Keys, Theme, Preferences
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

select * from settings;
-- ==========================================
-- TRIGGER: Update timestamp on change
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_library_modtime BEFORE UPDATE ON library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_modtime BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS forensic_whitelist (
    word TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

select * from forensic_whitelist;

select word from forensic_whitelist where word = 'accomplishment';
INSERT INTO forensic_whitelist (word) values('directory');
SELECT * FROM forensic_whitelist fw LIMIT 500;
select count(word) from forensic_whitelist fw ;
CREATE INDEX index_forensic_whitelist ON forensic_whitelist (word);
CREATE INDEX idx_forensic_word_trgm ON forensic_whitelist USING gin (word gin_trgm_ops);
EXPLAIN ANALYZE SELECT * FROM forensic_whitelist WHERE word = 'example';
DELETE FROM forensic_whitelist ;


ALTER TABLE settings RENAME COLUMN id TO user_id;
ALTER TABLE notes RENAME COLUMN id TO user_id;



