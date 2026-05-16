```python
with open('forensicRules.js', 'r') as f:
    rules = f.read()
print("Rules sample around regex:")
print(rules[:1000])

with open('01-paragraphs.md', 'r') as f:
    p = f.read()
print("\nParagraphs sample:")
print(p[:2000])


```

```text
Rules sample around regex:
export const forensicRules = [
  // Grammar: Capitalization & Sentence Structure (BLUE)
  {
    regex: /(?<=^|[.!?]\s*)([a-z]\w*)(?![.)\]])/g,
    type: "grammar",
    suggestion: (match) => {
      const word = match[0];
      return word.charAt(0).toUpperCase() + word.slice(1);
    },
    exp: "Sentences must start with a capital letter.",
  },

  // Spelling & Phonetics (RED)
  {
    regex: /\bfroot\b/gi,
    type: "spelling",
    suggestion: "fruit",
    exp: "Phonetic spelling anomaly.",
  },
  {
    regex: /\bwheather\b/gi,
    type: "spelling",
    suggestion: "weather",
    exp: "Semantic confusion (weather vs whether).",
  },
  {
    regex: /\bTheir\s+was\b/gi,
    type: "spelling",
    suggestion: "There was",
    exp: "Homophone confusion (There/Their).",
  },
  {
    regex: /\bpeples\b/gi,
    type: "spelling",
    suggestion: "people",
    exp: "Irregular plural spelling error.",
  },
  {
    regex: /\bshoping\b/gi,
    type: "spelling",
    suggestion: "shopping",
    exp

Paragraphs sample:
Neural Analytics
Gram
85%
Spell
90%
Syntx
100%
Dictn
91%
Acad
86%
Flow
91%
Linguistic Rigor
Cohesion
91%
Rhythm
91%
Rigor Index
IELTS Band Estimate

7.4
Band Est.

Detected Flags
8
Anomaly Map
8 Flagged
Neural Audit
diction
Specialized Term

This word is not recognized by the system.

Manual Fix Required
Neural Audit
grammar
Grammar Anomaly

Sentences must start with a capital letter.

Current

our

Suggest

Our

Apply
Neural Audit
diction
Specialized Term

This word is not recognized by the system.

Manual Fix Required
Neural Audit
grammar
Grammar Anomaly

Sentences must start with a capital letter.

Current

consider

Suggest

Consider

Apply
Neural Audit
spelling
Spelling Anomaly

Technical character noise detected inside word structure.

Current

parameters—such

Suggest

parameterssuch

Apply
Neural Audit
spelling
Spelling Anomaly

Fuzzy logic detected a similarity to "hereout".

Current

here.our

Suggest

hereout

Apply
Neural Audit
grammar
Grammar Anomaly

Sentences must start with a capital letter.

Current

our

Suggest

Our

Apply
Neural Audit
spelling
Spelling Anomaly

Technical character noise detected inside word structure.

Current

this—degrades

Suggest

thisdegrades

Apply
\_\_
The implementation of modern information networks requires massive engineering overhead.our initial assessment confirms this reality. Academic writing must prioritize structural cohesion; however, manual editing frequently overlooks subtle formatting discrepancies.consider the following guidelines:
a. Sentences must remain concise and direct.
b. Terminology should align with the academic lexicon.
c. Delimiters should be managed properly across all draft versions.
Extensive testing shows that omitting whitespace parameters—such as the one right here.our parsing engine should flag this—degrades baseline syntax metrics significantly. Fortunately, the updated framework addresses this exact vulnerability seamlessly.



```

```python
with open('01-paragraphs.md', 'r') as f:
    print(f.read())


```

```text
Neural Analytics
Gram
85%
Spell
90%
Syntx
100%
Dictn
91%
Acad
86%
Flow
91%
Linguistic Rigor
Cohesion
91%
Rhythm
91%
Rigor Index
IELTS Band Estimate

7.4
Band Est.

Detected Flags
8
Anomaly Map
8 Flagged
Neural Audit
diction
Specialized Term

This word is not recognized by the system.

Manual Fix Required
Neural Audit
grammar
Grammar Anomaly

Sentences must start with a capital letter.

Current

our

Suggest

Our

Apply
Neural Audit
diction
Specialized Term

This word is not recognized by the system.

Manual Fix Required
Neural Audit
grammar
Grammar Anomaly

Sentences must start with a capital letter.

Current

consider

Suggest

Consider

Apply
Neural Audit
spelling
Spelling Anomaly

Technical character noise detected inside word structure.

Current

parameters—such

Suggest

parameterssuch

Apply
Neural Audit
spelling
Spelling Anomaly

Fuzzy logic detected a similarity to "hereout".

Current

here.our

Suggest

hereout

Apply
Neural Audit
grammar
Grammar Anomaly

Sentences must start with a capital letter.

Current

our

Suggest

Our

Apply
Neural Audit
spelling
Spelling Anomaly

Technical character noise detected inside word structure.

Current

this—degrades

Suggest

thisdegrades

Apply
\_\_
The implementation of modern information networks requires massive engineering overhead.our initial assessment confirms this reality. Academic writing must prioritize structural cohesion; however, manual editing frequently overlooks subtle formatting discrepancies.consider the following guidelines:
a. Sentences must remain concise and direct.
b. Terminology should align with the academic lexicon.
c. Delimiters should be managed properly across all draft versions.
Extensive testing shows that omitting whitespace parameters—such as the one right here.our parsing engine should flag this—degrades baseline syntax metrics significantly. Fortunately, the updated framework addresses this exact vulnerability seamlessly.



```

```python
with open('forensicRules.js', 'r') as f:
    text = f.read()
print(text[:400])


```

```text
export const forensicRules = [
  // Grammar: Capitalization & Sentence Structure (BLUE)
  {
    regex: /(?<=^|[.!?]\s*)([a-z]\w*)(?![.)\]])/g,
    type: "grammar",
    suggestion: (match) => {
      const word = match[0];
      return word.charAt(0).toUpperCase() + word.slice(1);
    },
    exp: "Sentences must start with a capital letter.",
  },

  // Spelling & Phonetics (RED)
  {
    regex: /\b


```

### Update `useRigor.js`

```javascript
// 1. At the beginning of the analyze method, clean em-dashes and en-dashes:
const text = content.replace(/’/g, "'").replace(/[—–]/g, " ");

// 2. Inside the "3. NEURAL FUZZY LOOP" block, add the period-splitting clearance right below the hyphen check:
let isKnown = truthTrie.has(cleanWord);
if (!isKnown && cleanWord.includes("-")) {
  const parts = cleanWord.split("-").filter((p) => p.length > 0);
  if (parts.length > 0 && parts.every((p) => truthTrie.has(p))) {
    isKnown = true;
  }
}

// Zero-space punctuation fallback
if (!isKnown && trimmed.includes(".") && !isAcronymOrTech) {
  const parts = trimmed
    .toLowerCase()
    .replace(/[^a-z.]/g, "")
    .split(".");
  if (
    parts.length > 0 &&
    parts.every((p) => p.length === 0 || truthTrie.has(p))
  ) {
    isKnown = true;
  }
}
```

### Update `forensicRules.js`

```javascript
// Replace the capitalization rule at the top of the array with this complete-word pattern:
{
  regex: /(?<=^|[.!?]\s*)([a-z]\w*)\b(?![.)\]]|\s*\d)/g,
  type: "grammar",
  suggestion: (match) => {
    const word = match[0];
    return word.charAt(0).toUpperCase() + word.slice(1);
  },
  exp: "Sentences must start with a capital letter.",
}

```
