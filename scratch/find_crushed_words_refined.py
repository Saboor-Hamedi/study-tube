import psycopg2
import re

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
    reference_words = set(re.findall(r'"([^"]+)"', content))

# Fetch Whitelist
cur.execute("SELECT word FROM forensic_whitelist")
whitelist = [row[0] for row in cur.fetchall()]

# Suffixes that often cause false positives
common_suffixes = {'able', 'ability', 'ment', 'ness', 'ly', 'ing', 'ed', 'er', 'est', 'ity', 'ive', 'ious', 'ous', 'tion', 'sion'}

candidates = []

for word in whitelist:
    if '-' in word or "'" in word:
        continue
    
    # Check for compound word splits
    for i in range(3, len(word) - 3):
        part1 = word[:i]
        part2 = word[i:]
        
        if part1 in reference_words and part2 in reference_words:
            # Filter out simple suffixes
            if part2 in common_suffixes:
                continue
            
            candidates.append((word, f"{part1}-{part2}"))
            break

print(f"IDENTIFIED {len(candidates)} POTENTIAL CRUSHED WORDS:")
for original, suggestion in candidates:
    print(f"  {original} -> {suggestion}")

conn.close()
