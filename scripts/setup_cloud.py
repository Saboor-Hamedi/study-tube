import sqlite3
import json
import os
from pathlib import Path

# Industrial Path Resolution for Windows
db_path = Path.home() / "AppData" / "Roaming" / "StudyTube" / "studytube.db"

print("--- Writella Neural Configurator (Python Edition) ---")
print(f"Targeting Database: {db_path}")

if not db_path.exists():
    print(f"CRITICAL ERROR: Database not found at {db_path}")
    print("Please make sure you have run the Writella app at least once.")
    exit(1)

try:
    # Connect to SQLite
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    # 1. Fetch current settings
    cur.execute("SELECT config FROM settings WHERE id = 1")
    row = cur.fetchone()
    
    config = json.loads(row[0]) if row and row[0] else {}

    # 2. Inject Cloud Bridge Configuration
    config["cloudApiUrl"] = "http://127.0.0.1:8000"
    print("Injecting Cloud API URL: http://127.0.0.1:8000")

    # 3. Persist to SQLite
    cur.execute(
        "INSERT OR REPLACE INTO settings (id, config) VALUES (1, ?)",
        (json.dumps(config),)
    )
    
    conn.commit()
    conn.close()

    print("--- CONFIGURATION COMPLETE ---")
    print("✅ Your local research is now connected to the Cloud Bridge.")
    print("Please restart your Writella app to begin synchronization.")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    print("\nTip: Make sure the Writella app is CLOSED before running this script.")
