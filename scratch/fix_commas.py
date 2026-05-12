import os

file_path = r'b:\study-tube\src\hooks\rigor\commonWords.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Only process lines that look like "word" (not the first or last lines)
    stripped = line.strip()
    if stripped.startswith('"') and stripped.endswith('"'):
        # Add a comma if it doesn't have one
        new_lines.append(line.rstrip() + ',\n')
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully added commas to commonWords.js")
