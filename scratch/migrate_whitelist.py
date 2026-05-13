import psycopg2
import re
import os

def migrate_from_js():
    js_path = r'b:\study-tube\src\hooks\rigor\legitimateDoubles.js'
    
    if not os.path.exists(js_path):
        print(f"[ERROR] Lexicon file not found at {js_path}")
        return

    print("[MIGRATE] Extracting words from legitimateDoubles.js...")
    
    try:
        with open(js_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract words from the "word", syntax
            words = re.findall(r'"([^"]+)"', content)
        
        print(f"[MIGRATE] Found {len(words)} words in Lexicon.")

        # Connect to Production PostgreSQL
        pg_conn = psycopg2.connect(
            host="localhost",
            database="writella",
            user="postgres",
            password="jan",
            port="5432"
        )
        pg_cur = pg_conn.cursor()

        print("[MIGRATE] Synchronizing with PostgreSQL (Skipping Duplicates)...")

        # Use batching for industrial speed
        batch_size = 1000
        for i in range(0, len(words), batch_size):
            batch = words[i:i + batch_size]
            # Strip and lower for consistency
            clean_batch = [(w.strip().lower(),) for w in batch]
            
            # Execute batch insert
            pg_cur.executemany(
                "INSERT INTO forensic_whitelist (word) VALUES (%s) ON CONFLICT DO NOTHING",
                clean_batch
            )
            
            if i % 50000 == 0 and i > 0:
                pg_conn.commit()
                print(f"[PROGRESS] {i} words processed...")

        pg_conn.commit()
        print(f"[SUCCESS] Migration complete! All {len(words)} words are now in PostgreSQL.")

        pg_cur.close()
        pg_conn.close()

    except Exception as e:
        print(f"[CRITICAL] Migration Failed: {e}")

if __name__ == "__main__":
    migrate_from_js()
