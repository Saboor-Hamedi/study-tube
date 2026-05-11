from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import List, Optional, Any
import json
import os
from dotenv import load_dotenv
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

load_dotenv()

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Writella Cloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Connection Helper
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
    if not conn:
        print("CRITICAL: Could not connect to PostgreSQL to bootstrap tables.")
        return
    try:
        with conn.cursor() as cur:
            # 1. Library Table
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
            
            # 2. Notes Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS notes (
                    user_id UUID PRIMARY KEY,
                    data JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 3. Collections Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS collections (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 4. Settings Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    user_id UUID PRIMARY KEY,
                    config JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            print("PostgreSQL Bootstrap: All tables verified/created in 'writella'.")
    except Exception as e:
        print(f"PostgreSQL Bootstrap Error: {e}")
    finally:
        conn.close()

# Models
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

# --- Neural Sync Endpoint (Library) ---
@app.post("/sync")
async def sync_data(payload: SyncPayload, authorization: str = Header(None)):
    # Simple token validation (optional)
    # if authorization != f"Bearer {os.getenv('API_TOKEN')}":
    #    raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Cloud Database Offline")

    try:
        with conn.cursor() as cur:
            for item in payload.items:
                # Handle metadata serialization
                meta_str = item.metadata
                if isinstance(item.metadata, (dict, list)):
                    meta_str = json.dumps(item.metadata)
                elif item.metadata is None:
                    meta_str = "{}"

                # PostgreSQL Upsert (INSERT ... ON CONFLICT)
                print(f"[CLOUD] Upserting item: {item.id} - {item.text[:20]}...")
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
                """, (
                    item.id, item.text, item.definition, item.videoTitle, 
                    item.timestamp, item.date, bool(item.archived), 
                    item.collection, item.type, meta_str
                ))
            
            conn.commit()
            print(f"[CLOUD] Sync Complete: Processed {len(payload.items)} library items.")
            return {"status": "success", "synced_count": len(payload.items)}
    except Exception as e:
        conn.rollback()
        print(f"Sync Execution Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- Neural Sync Endpoint (Notes) ---
@app.post("/notes")
async def sync_notes(payload: NotesPayload):
    import json
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    # Use a fixed UUID for the singleton record to match the UUID type
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

# --- Neural Sync Endpoint (Collections) ---
@app.post("/collections")
async def sync_collections(payload: CollectionsPayload):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    try:
        with conn.cursor() as cur:
            # Simple approach: clear and re-insert for collections
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

# --- Neural Sync Endpoint (Settings) ---
@app.post("/settings")
async def sync_settings(payload: SettingsPayload):
    import json
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Cloud Database Offline")
    # Use a fixed UUID for the singleton record
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
    if not conn:
        return {"error": "DB Connection Failed"}
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM library ORDER BY date DESC")
            items = cur.fetchall()
            return items
    except Exception as e:
        return {"error": str(e)}
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
            cur.execute("""
                SELECT * FROM library 
                WHERE text ILIKE %s OR video_title ILIKE %s 
                ORDER BY updated_at DESC
            """, (query_param, query_param))
            rows = cur.fetchall()
            
            # Apply Neural Highlighting (Simulating SQLite FTS snippet)
            highlight_tag = r'<mark>\g<0></mark>'
            pattern = re.compile(re.escape(q), re.IGNORECASE)
            
            for row in rows:
                text = row.get('text', '')
                definition = row.get('definition', '')
                
                # Create the snippet expected by the frontend (with highlights)
                snippet_source = definition if definition else text
                highlighted_snippet = pattern.sub(highlight_tag, snippet_source)
                
                # Truncate for high-density visualization if too long
                if len(highlighted_snippet) > 150:
                    row['definitionSnippet'] = highlighted_snippet[:150] + "..."
                else:
                    row['definitionSnippet'] = highlighted_snippet
                    
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
    ydl_opts = {
        'quiet': True,
        'extract_flat': 'in_playlist',
        'skip_download': True,
    }
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
                    # Standard high-quality thumbnail fallback
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
        # Fetching transcript using the correct instance-based API
        api = YouTubeTranscriptApi()
        transcript_list = api.list(videoId)
        
        # Prioritize English, but fall back to any available transcript
        try:
            t = transcript_list.find_transcript(['en'])
        except:
            # If English is not available, take the first one (could be any language)
            t = next(iter(transcript_list))
            
        return t.fetch()
    except Exception as e:
        print(f"[CLOUD] Transcript error for {videoId}: {e}")
        return []

@app.on_event("startup")
async def startup_event():
    bootstrap_db()
