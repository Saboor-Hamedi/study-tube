import psycopg2
from psycopg2.extras import RealDictCursor
try:
    conn = psycopg2.connect(host='localhost', database='writella', user='postgres', password='jan')
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM settings")
    rows = cur.fetchall()
    print("--- SETTINGS TABLE CONTENT ---")
    for row in rows:
        print(row)
    print("------------------------------")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
