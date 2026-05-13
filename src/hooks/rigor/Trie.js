/**
 * Trie (Prefix Tree) optimized for Forensic Linguistic Analysis.
 * Provides O(L) lookups and efficient fuzzy matching for academic terminology.
 */
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

export class Trie {
  constructor(words = []) {
    this.root = new TrieNode();
    if (words.length > 0) {
      this.batchInsert(words);
    }
  }

  insert(word) {
    if (!word) return;
    let node = this.root;
    const lowerWord = word.toLowerCase();
    for (const char of lowerWord) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  batchInsert(words) {
    for (const word of words) {
      this.insert(word);
    }
  }

  has(word) {
    if (!word) return false;
    let node = this.root;
    const lowerWord = word.toLowerCase();
    for (const char of lowerWord) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return node.isEndOfWord;
  }

  /**
   * Efficient Fuzzy Search using Trie Traversal + Levenshtein Pruning.
   * Significantly faster than linear array iteration for large lexicons.
   */
  findFuzzy(word, maxDistance = 2) {
    const lowerWord = word.toLowerCase();
    const currentPath = [];
    let bestMatch = null;
    let minDistance = maxDistance + 1;

    // Initialize the first row of the Levenshtein matrix
    const firstRow = Array.from({ length: lowerWord.length + 1 }, (_, i) => i);

    const searchRecursive = (node, char, previousRow) => {
      const columns = lowerWord.length + 1;
      const currentRow = [previousRow[0] + 1];

      for (let i = 1; i < columns; i++) {
        const insertCost = currentRow[i - 1] + 1;
        const deleteCost = previousRow[i] + 1;
        const replaceCost =
          char === lowerWord[i - 1]
            ? previousRow[i - 1]
            : previousRow[i - 1] + 1;

        currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
      }

      // If the last entry in the row is within maxDistance, and it's a word, we found a candidate
      if (currentRow[currentRow.length - 1] < minDistance && node.isEndOfWord) {
        minDistance = currentRow[currentRow.length - 1];
        bestMatch = currentPath.join("");
      }

      // If any element in the row is less than minDistance, continue searching children
      if (Math.min(...currentRow) < minDistance) {
        for (const nextChar in node.children) {
          currentPath.push(nextChar);
          searchRecursive(node.children[nextChar], nextChar, currentRow);
          currentPath.pop();
        }
      }
    };

    for (const char in this.root.children) {
      currentPath.push(char);
      searchRecursive(this.root.children[char], char, firstRow);
      currentPath.pop();
    }

    return bestMatch;
  }
}
