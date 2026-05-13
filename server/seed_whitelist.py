import os, json, re, psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "writella"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS", "jan"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except Exception as e:
        print(f"Database Connection Error: {e}")
        return None

def seed():
    js_path = os.path.join(os.path.dirname(__file__), "..", "src", "hooks", "rigor", "legitimateDoubles.js")
    
    if not os.path.exists(js_path):
        print(f"Error: Could not find {js_path}")
        return

    print("Extracting words from legitimateDoubles.js...")
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to find all words in double quotes inside the array
    words = re.findall(r'"([^"]+)"', content)
    
    # Filter out common JS artifacts if any
    words = [w.lower().strip() for w in words if len(w) > 1]
    
    print(f"Found {len(words)} unique terms. Connecting to PostgreSQL...")
    
    conn = get_db_connection()
    if not conn: return
    
    try:
        with conn.cursor() as cur:
            print("Beginning industrial batch insertion...")
            # Using execute_values or manual batching for efficiency
            # For simplicity with psycopg2, we'll use a large executemany or a single query
            
            # Prepare data for insertion
            values = [(w,) for w in words]
            
            # PostgreSQL Batch Insert
            cur.executemany(
                "INSERT INTO forensic_whitelist (word) VALUES (%s) ON CONFLICT (word) DO NOTHING",
                values
            )
            
            conn.commit()
            print(f"SUCCESS: {len(words)} terms synchronized to PostgreSQL forensic_whitelist.")
    except Exception as e:
        conn.rollback()
        print(f"Seeding Failure: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed()
