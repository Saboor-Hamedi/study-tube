import spacy
from forensic_logic import analyze_linguistics

text = "At this point in time, the research is completely finished. I don't need no help with the end result. Due to the fact that we worked hard. The data was analyzed by me. Walking in the rain yesterday."

print(f"Testing text: {text}")
highlights = analyze_linguistics(text)

print(f"\nFound {len(highlights)} highlights:")
for h in highlights:
    print(f"- [{h['type']}] {h['reason']}: {text[h['start']:h['end']]} -> {h['suggestion']}")
