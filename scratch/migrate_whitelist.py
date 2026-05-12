import sqlite3
import psycopg2
import os

def migrate_whitelist():
    sqlite_path = "studytube.db"
    if not os.path.exists(sqlite_path):
        print(f"[ERROR] Legacy database not found at {sqlite_path}")
        return

    try:
        # 1. Connect to Legacy SQLite
        sl_conn = sqlite3.connect(sqlite_path)
        sl_cur = sl_conn.cursor()
        
        # Check if table exists
        sl_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='forensic_whitelist';")
        if not sl_cur.fetchone():
            print("[INFO] No forensic_whitelist table in SQLite. Nothing to migrate.")
            return

        sl_cur.execute("SELECT word FROM forensic_whitelist")
        words = [row[0] for row in sl_cur.fetchall()]
        print(f"[MIGRATE] Found {len(words)} words in legacy SQLite.")

        if not words:
            return

        # 2. Connect to Production PostgreSQL
        pg_conn = psycopg2.connect(
            host="localhost",
            database="writella",
            user="postgres",
            password="jan",
            port="5432"
        )
        pg_cur = pg_conn.cursor()

        # 3. Industrial Batch Insert
        inserted_count = 0
        for word in words:
            pg_cur.execute(
                "INSERT INTO forensic_whitelist (word) VALUES (%s) ON CONFLICT DO NOTHING",
                (word.strip().lower(),)
            )
            if pg_cur.rowcount > 0:
                inserted_count += 1

        pg_conn.commit()
        print(f"[SUCCESS] Migrated {inserted_count} new words to PostgreSQL.")

        pg_cur.close()
        pg_conn.close()
        sl_conn.close()

    except Exception as e:
        print(f"[CRITICAL] Migration Failed: {e}")

if __name__ == "__main__":
    migrate_whitelist()
