from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Any
import json, os, yt_dlp, psycopg2
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Writella Cloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "writella"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS", "jan"),
            port=os.getenv("DB_PORT", "5432"),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Database Connection Error: {e}")
        return None

def bootstrap_db():
    conn = get_db_connection()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS \"pg_trgm\"")
            cur.execute("""
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
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS notes (
                    user_id UUID PRIMARY KEY,
                    data JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS collections (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    user_id UUID PRIMARY KEY,
                    config JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS forensic_whitelist (
                    word TEXT PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
    except Exception as e:
        print(f"PostgreSQL Bootstrap Error: {e}")
    finally:
        conn.close()

class LibraryItem(BaseModel):
    id: str
    text: str
    definition: Optional[str] = ""
    videoTitle: Optional[str] = "Universal Knowledge"
    timestamp: Optional[float] = 0.0
    date: str
    archived: Optional[int] = 0
    collection: Optional[str] = "all"
    type: Optional[str] = ""
    metadata: Optional[Any] = "{}"

class SyncPayload(BaseModel):
    items: List[LibraryItem]

class NotesPayload(BaseModel):
    data: dict

class CollectionsPayload(BaseModel):
    names: List[str]

class SettingsPayload(BaseModel):
    config: dict

@app.post("/sync")
async def sync_data(payload: SyncPayload, authorization: str = Header(None)):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    try:
        with conn.cursor() as cur:
            for item in payload.items:
                meta_str = item.metadata if isinstance(item.metadata, str) else json.dumps(item.metadata)
                cur.execute("""
                    INSERT INTO library (
                        id, text, definition, video_title, timestamp, date, archived, collection, type, metadata, synced
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                    ON CONFLICT (id) DO UPDATE SET
                        text = EXCLUDED.text,
                        definition = EXCLUDED.definition,
                        video_title = EXCLUDED.video_title,
                        timestamp = EXCLUDED.timestamp,
                        date = EXCLUDED.date,
                        archived = EXCLUDED.archived,
                        collection = EXCLUDED.collection,
                        type = EXCLUDED.type,
                        metadata = EXCLUDED.metadata,
                        synced = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                """, (item.id, item.text, item.definition, item.videoTitle, item.timestamp, item.date, bool(item.archived), item.collection, item.type, meta_str))
            conn.commit()
            return {"status": "success", "synced_count": len(payload.items)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/notes")
async def sync_notes(payload: NotesPayload):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    SINGLETON_ID = "00000000-0000-0000-0000-000000000001"
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO notes (user_id, data, updated_at) 
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
            """, (SINGLETON_ID, json.dumps(payload.data)))
            conn.commit()
            return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/collections")
async def sync_collections(payload: CollectionsPayload):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM collections")
            for name in payload.names:
                cur.execute("INSERT INTO collections (name) VALUES (%s)", (name,))
            conn.commit()
            return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/settings")
async def sync_settings(payload: SettingsPayload):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    SINGLETON_ID = "00000000-0000-0000-0000-000000000001"
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO settings (user_id, config, updated_at) 
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()
            """, (SINGLETON_ID, json.dumps(payload.config)))
            conn.commit()
            return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/")
def read_root():
    return {"message": "Writella Cloud Engine Online"}

@app.get("/library")
def get_cloud_library():
    conn = get_db_connection()
    if not conn: return {"error": "DB Connection Failed"}
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM library ORDER BY date DESC")
            return cur.fetchall()
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

@app.delete("/library/{id}")
async def delete_item(id: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="DB Offline")
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM library WHERE id = %s", (id,))
            conn.commit()
            return {"status": "success"}
    finally:
        conn.close()

@app.post("/library/{id}/archive")
async def archive_item(id: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="DB Offline")
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE library SET archived = TRUE, updated_at = NOW() WHERE id = %s", (id,))
            conn.commit()
            return {"status": "success"}
    finally:
        conn.close()

@app.post("/library/{id}/restore")
async def restore_item(id: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="DB Offline")
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE library SET archived = FALSE, updated_at = NOW() WHERE id = %s", (id,))
            conn.commit()
            return {"status": "success"}
    finally:
        conn.close()

@app.get("/library/search")
def search_cloud_library(q: str):
    import re
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="DB Connection Failed")
    try:
        with conn.cursor() as cur:
            query_param = f"%{q}%"
            cur.execute("SELECT * FROM library WHERE text ILIKE %s OR video_title ILIKE %s ORDER BY updated_at DESC", (query_param, query_param))
            rows = cur.fetchall()
            highlight_tag = r'<mark>\g<0></mark>'
            pattern = re.compile(re.escape(q), re.IGNORECASE)
            for row in rows:
                snippet_source = row.get('definition') or row.get('text', '')
                highlighted_snippet = pattern.sub(highlight_tag, snippet_source)
                row['definitionSnippet'] = highlighted_snippet[:150] + "..." if len(highlighted_snippet) > 150 else highlighted_snippet
            return rows
    finally:
        conn.close()

@app.get("/library/stats")
def get_library_stats():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="DB Connection Failed")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as all_count FROM library WHERE archived = FALSE")
            all_count = cur.fetchone()['all_count']
            cur.execute("SELECT COUNT(*) as trash_count FROM library WHERE archived = TRUE")
            trash_count = cur.fetchone()['trash_count']
            return {"all": all_count, "trash": trash_count, "collections": []}
    finally:
        conn.close()

@app.get("/collections")
def get_collections():
    conn = get_db_connection()
    if not conn: return []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT name FROM collections ORDER BY name ASC")
            return [row['name'] for row in cur.fetchall()]
    finally:
        conn.close()

@app.get("/notes")
def get_notes():
    conn = get_db_connection()
    if not conn: return {"blocks": []}
    SINGLETON_ID = "00000000-0000-0000-0000-000000000001"
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT data FROM notes WHERE user_id = %s", (SINGLETON_ID,))
            row = cur.fetchone()
            return row['data'] if row else {"blocks": []}
    finally:
        conn.close()

@app.get("/settings")
def get_settings():
    conn = get_db_connection()
    if not conn: return {}
    SINGLETON_ID = "00000000-0000-0000-0000-000000000001"
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT config FROM settings WHERE user_id = %s", (SINGLETON_ID,))
            row = cur.fetchone()
            return row['config'] if row else {}
    finally:
        conn.close()

@app.get("/youtube/search")
def proxy_youtube_search(q: str):
    ydl_opts = {'quiet': True, 'extract_flat': 'in_playlist', 'skip_download': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            search_results = ydl.extract_info(f"ytsearch15:{q}", download=False)
            videos = []
            for entry in search_results.get('entries', []):
                if not entry: continue
                v_id = entry.get('id')
                videos.append({
                    "id": v_id,
                    "title": entry.get('title'),
                    "duration": entry.get('duration'),
                    "thumbnail": f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg",
                    "url": f"https://www.youtube.com/watch?v={v_id}",
                    "author": entry.get('uploader'),
                    "views": entry.get('view_count'),
                })
            return videos
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/youtube/metadata")
def proxy_youtube_metadata(url: str):
    ydl_opts = {'quiet': True, 'skip_download': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            v_id = info.get('id')
            heights = sorted(list(set([f.get('height') for f in info.get('formats', []) if f.get('height')] )), reverse=True)
            quality_options = [{"label": f"{h}p", "value": f"video:{h}"} for h in heights[:6]]
            quality_options.append({"label": "MP3 (192kbps)", "value": "audio:mp3"})
            return {
                "id": v_id,
                "title": info.get('title'),
                "duration": info.get('duration'),
                "thumbnail": f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg",
                "url": url,
                "author": info.get('uploader'),
                "views": info.get('view_count'),
                "description": info.get('description'),
                "qualityOptions": quality_options
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/youtube/transcript")
def proxy_youtube_transcript(videoId: str):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(videoId)
        try: t = transcript_list.find_transcript(['en'])
        except: t = next(iter(transcript_list))
        return t.fetch()
    except Exception as e:
        print(f"Transcript Error: {e}")
        return []
@app.get("/forensic/whitelist")
def get_forensic_whitelist():
    conn = get_db_connection()
    if not conn: return []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT word FROM forensic_whitelist")
            return [row['word'] for row in cur.fetchall()]
    finally:
        conn.close()

class WhitelistPayload(BaseModel):
    word: str

@app.post("/forensic/whitelist")
async def add_to_whitelist(payload: WhitelistPayload):
    print(f"[FASTAPI] Whitelisting Word: {payload.word}")
    conn = get_db_connection()
    if not conn: 
        print("[FASTAPI] DB Connection Failure")
        raise HTTPException(status_code=500, detail="DB Offline")
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO forensic_whitelist (word) VALUES (%s) ON CONFLICT DO NOTHING", (payload.word,))
            conn.commit()
            print(f"[FASTAPI] Word Persisted Successfully: {payload.word}")
            return {"status": "success"}
    except Exception as e:
        print(f"[FASTAPI] Persistence Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@app.delete("/forensic/whitelist/{word}")
async def remove_from_whitelist(word: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="DB Offline")
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM forensic_whitelist WHERE word = %s", (word,))
            conn.commit()
            return {"status": "success"}
    finally:
        conn.close()

@app.on_event("startup")
async def startup_event():
    bootstrap_db()
