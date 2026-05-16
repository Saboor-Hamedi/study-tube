import os
import re

file_path = r'b:\study-tube\src\hooks\rigor\legitimateDoubles.js'

print("Commencing Industrial Formatting of 450k words...")

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
new_lines.append('export const legitimateDoubles = [\n')

# Regex to skip the first and last lines if they are already boilerplate
# But since the user might have messed them up, we'll just extract words
for line in lines:
    word = line.strip()
    if not word or word.startswith('export') or word.startswith('];'):
        continue
    
    # Clean the word: remove trailing commas or quotes if they exist
    word = word.strip(',').strip('"').strip("'")
    if word:
        # Escape any internal quotes
        safe_word = word.replace('"', '\\"')
        new_lines.append(f'  "{safe_word}",\n')

new_lines.append('];\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Success! Reformatted {len(new_lines) - 2} words. App should now boot.")
