import psycopg2
import re
import os

# Database Connection
conn = psycopg2.connect(
    host="localhost",
    database="writella",
    user="postgres",
    password="jan"
)
cur = conn.cursor()

# Load Common Words Reference
common_words_path = r'b:\study-tube\src\hooks\rigor\commonWords.js'
with open(common_words_path, 'r', encoding='utf-8') as f:
    content = f.read()
    # Extract words from the array
    reference_words = set(re.findall(r'"([^"]+)"', content))

# Fetch Whitelist
cur.execute("SELECT word FROM forensic_whitelist")
whitelist = [row[0] for row in cur.fetchall()]

candidates = []

print("Analyzing database for 'crushed' hyphenated words...")

for word in whitelist:
    # We only care about words that have NO hyphens but might need them
    if '-' in word or "'" in word:
        continue
    
    # Heuristic: Try to split the word into two parts that both exist in common_words
    # Example: "massproduced" -> "mass" + "produced"
    for i in range(3, len(word) - 3):
        part1 = word[:i]
        part2 = word[i:]
        
        if part1 in reference_words and part2 in reference_words:
            candidates.append((word, f"{part1}-{part2}"))
            break

if not candidates:
    print("No obvious crushed words found.")
else:
    print(f"Found {len(candidates)} potential crushed words:")
    for original, suggestion in candidates[:20]: # Show top 20
        print(f"  - {original} (Likely: {suggestion})")
    
    if len(candidates) > 20:
        print(f"  ... and {len(candidates) - 20} more.")

conn.close()
