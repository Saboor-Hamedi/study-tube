/**
 * legitimateExceptions.js
 *
 * Whitelist for valid linguistic repetitions and phonetic exceptions
 * that typically trigger false positives in simple regex engines.
 */

export const legitimateExceptions = [
  // 1. Valid Word Repetitions (Double Words)
  { pattern: /\bhad\s+had\b/gi, reason: "Past perfect" },
  { pattern: /\bthat\s+that\b/gi, reason: "Demonstrative clause" },
  { pattern: /\bcan\s+can\b/gi, reason: "Modal emphasis" },
  { pattern: /\bis\s+is\b/gi, reason: "Focus construction" },
  { pattern: /\bit\s+it\b/gi, reason: "Reflexive emphasis" },
  { pattern: /\bin\s+in\b/gi, reason: "Prepositional boundary" },

  // 2. Phonetic Article Exceptions (a vs an)
  // Catching /ju:/ sound (Consonant sound starting with a vowel)
  { pattern: /\ba\s+unique\b/gi, reason: "Phonetic consonant" },
  { pattern: /\ba\s+university\b/gi, reason: "Phonetic consonant" },
  { pattern: /\ba\s+one\-\w+/gi, reason: "Phonetic consonant" },
  { pattern: /\ba\s+European\b/gi, reason: "Phonetic consonant" },
  { pattern: /\ba\s+user\b/gi, reason: "Phonetic consonant" },
  { pattern: /\ba\s+euphemism\b/gi, reason: "Phonetic consonant" },
  { pattern: /\ba\s+unit\b/gi, reason: "Phonetic consonant" },

  // 3. Valid Object Pronoun Patterns (Prevention of false Subject-Case flags)
  {
    pattern: /\b(?:gave|sent|showed|told|asked|helped)\s+them\b/gi,
    reason: "Valid object",
  },
  {
    pattern: /\b(?:with|to|for|by|of)\s+them\b/gi,
    reason: "Valid prepositional object",
  },
  {
    pattern: /\b(?:gave|sent|showed|told|asked|helped)\s+us\b/gi,
    reason: "Valid object",
  },
  {
    pattern: /\b(?:with|to|for|by|of)\s+us\b/gi,
    reason: "Valid prepositional object",
  },
  {
    pattern: /\b(?:saw|met|called|joined|found)\s+him\b/gi,
    reason: "Valid object",
  },
  {
    pattern: /\b(?:saw|met|called|joined|found)\s+her\b/gi,
    reason: "Valid object",
  },
];
