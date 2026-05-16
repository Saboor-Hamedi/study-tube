import psycopg2
try:
    conn = psycopg2.connect(host='localhost', database='writella', user='postgres', password='jan')
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'settings'")
    cols = cur.fetchall()
    print("--- SETTINGS COLUMNS ---")
    for col in cols:
        print(col)
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'notes'")
    cols = cur.fetchall()
    print("--- NOTES COLUMNS ---")
    for col in cols:
        print(col)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
