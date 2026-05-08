import sqlite3
import os
import json

db_path = os.path.join(os.environ['USERPROFILE'], 'AppData', 'Roaming', 'StudyTube', 'studytube.db')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT config FROM settings WHERE id = 1")
    row = cur.fetchone()
    if row:
        print("Current Settings JSON:")
        print(json.dumps(json.loads(row[0]), indent=2))
    else:
        print("No settings found.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
