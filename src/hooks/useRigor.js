import { useState, useCallback, useEffect, useMemo } from "react";
import {
  commonMistakes,
  academicLexicon,
  forensicRules,
  commonWords,
  legitimateDoubles,
} from "./rigor";
import { Trie } from "./rigor/Trie";

// INDUSTRIAL OPTIMIZATION: Cache the static base trie outside the hook
// This prevents rebuilding the 450k+ word trie on every render or sync.
let cachedStaticTrie = null;

export const useRigor = () => {
  const [isNeuralScanning, setIsNeuralScanning] = useState(false);
  const [dbWhitelist, setDbWhitelist] = useState([]);
  const [whitelistMeta, setWhitelistMeta] = useState({ count: 0, lastUpdated: 0 });

  // --- Neural Forensic Trie (Memoized for O(L) Lookups) ---
  const truthTrie = useMemo(() => {
    // 1. Build or Retrieve the Static Base (450k+ words)
    if (!cachedStaticTrie) {
      console.log("[FORENSIC] Initializing Master Base Trie (450k+ words)...");
      cachedStaticTrie = new Trie([
        ...academicLexicon,
        ...commonWords,
        ...legitimateDoubles,
      ]);
      console.log("[FORENSIC] Master Base Ready.");
    }

    // 2. Create a surgical layer for the Dynamic Whitelist
    // We shallow-copy the root children to inherit the 450k words instantly (O(1))
    const trie = new Trie();
    trie.root.children = { ...cachedStaticTrie.root.children };
    
    // 3. Batch insert the user's specific database words
    if (dbWhitelist.length > 0) {
      trie.batchInsert(dbWhitelist);
    }

    return trie;
  }, [dbWhitelist]);

  // Load persistence layer on mount
  useEffect(() => {
    const loadWhitelist = async (retries = 10) => {
      try {
        if (!window.youtubeAPI && retries > 0) {
          setTimeout(() => loadWhitelist(retries - 1), 300);
          return;
        }

        if (window.youtubeAPI?.getForensicWhitelist) {
          const list = await window.youtubeAPI.getForensicWhitelist();
          if (Array.isArray(list)) {
            setDbWhitelist(list);
            console.log("[FORENSIC] Sync OK. Density:", list.length);
          }
        } else {
          const res = await fetch("http://127.0.0.1:8000/forensic/whitelist");
          if (res.ok) {
            const list = await res.json();
            setDbWhitelist(list);
          }
        }
      } catch (e) {
        console.error("[FORENSIC] Handshake Blocked:", e.message);
        if (window.youtubeAPI) {
          window.alert(`Forensic Handshake Failure: ${e.message}\n\nPlease verify PostgreSQL service status.`);
        }
      }
    };
    loadWhitelist();
  }, []);

  // --- Smart Background Sync ---
  // Periodically re-sync the whitelist to keep multiple tabs/windows consistent.
  // Performance: Only polls when the window is active (visible).
  useEffect(() => {
    let syncInterval;

    const performSync = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        if (window.youtubeAPI?.getForensicWhitelistMetadata) {
          // OPTIMIZATION: Check metadata first to avoid downloading huge datasets (50k+ words)
          const meta = await window.youtubeAPI.getForensicWhitelistMetadata();
          
          if (meta && (meta.count !== whitelistMeta.count || meta.lastUpdated !== whitelistMeta.lastUpdated)) {
            console.log("[FORENSIC] Industrial Dataset Change Detected.");
            const list = await window.youtubeAPI.getForensicWhitelist();
            if (Array.isArray(list)) {
              setDbWhitelist(list);
              setWhitelistMeta({ count: meta.count, lastUpdated: meta.lastUpdated });
              console.log("[FORENSIC] Industrial Sync Complete. New Count:", list.length);
            }
          }
        } else {
          // Legacy/Fallback Sync (Direct Fetch)
          const res = await fetch("http://127.0.0.1:8000/forensic/whitelist");
          if (res.ok) {
            const list = await res.json();
            setDbWhitelist(list);
          }
        }
      } catch (e) {
        console.warn("[FORENSIC] Sync Paused:", e.message);
      }
    };

    // Poll every 3 seconds for near-real-time synchronization
    syncInterval = setInterval(performSync, 3000);

    // Also sync immediately when the user returns to the tab
    document.addEventListener("visibilitychange", performSync);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener("visibilitychange", performSync);
    };
  }, []);

  const addToDictionary = useCallback(async (word) => {
    if (!word) return;
    const cleanWord = word
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-z'-]/g, "");

    // Attempt Electron Bridge first
    if (window.youtubeAPI?.addForensicWord) {
      try {
        const result = await window.youtubeAPI.addForensicWord(cleanWord);
        if (result && (result.status === "success" || result.ok)) {
          // Immediate Neural Re-Sync
          const updatedList = await window.youtubeAPI.getForensicWhitelist();
          if (Array.isArray(updatedList)) {
            setDbWhitelist(updatedList);
            console.log("[FORENSIC] Neural Sync Complete. New Whitelist Density:", updatedList.length);
          }
          return { success: true };
        }
      } catch (err) {
        console.error("[FORENSIC] Electron Bridge Error:", err);
      }
    }

    // Web Fallback: Direct FastAPI Call
    try {
      const res = await fetch("http://127.0.0.1:8000/forensic/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord }),
      });
      if (res.ok) {
        setDbWhitelist((prev) => [...new Set([...prev, cleanWord])]);
        return { success: true };
      }
      return { success: false, message: "Cloud Bridge Connectivity Error" };
    } catch (err) {
      return {
        success: false,
        message: "Cloud Bridge Offline (Verify Port 8000)",
      };
    }
  }, []);

  const analyze = useCallback(
    async (content) => {
      if (!content) return null;

      setIsNeuralScanning(true);
      await new Promise((r) => setTimeout(r, 1200));

      const text = content.replace(/’/g, "'");
      const highlights = [];

      // 1. COMPREHENSIVE FORENSIC DATABASE
      const activeRules = [...forensicRules];

      // Integrate Common Mistakes Dataset
      commonMistakes.forEach((item) => {
        activeRules.push({
          regex: new RegExp(`\\b${item.m}\\b`, "gi"),
          type: "spelling",
          suggestion: item.c,
          exp: "Common linguistic anomaly detected.",
        });
      });

      activeRules.forEach((rule) => {
        let match;
        const regex = new RegExp(rule.regex);
        while ((match = regex.exec(text)) !== null) {
          if (!highlights.find((h) => h.start === match.index)) {
            // Process regex placeholders like $1, $2 in the suggestion string
            let processedSuggestion = rule.suggestion;
            if (processedSuggestion && processedSuggestion.includes("$")) {
              processedSuggestion = processedSuggestion.replace(
                /\$(\d+)/g,
                (m, g) => {
                  return match[parseInt(g)] || m;
                },
              );
            }

            // Smart Capitalization: Detect if match is at start of sentence or text
            let finalSuggestion = processedSuggestion;
            const isStartOfSentence =
              match.index === 0 ||
              /[.!?]\s*$/.test(text.substring(0, match.index));
            
            if (isStartOfSentence && finalSuggestion && finalSuggestion !== "Omit") {
              finalSuggestion =
                finalSuggestion.charAt(0).toUpperCase() +
                finalSuggestion.slice(1);
            }

            // --- Neural Whitelist Check ---
            const matchText = match[0].toLowerCase().replace(/[^a-z']/g, "");
            if (truthTrie.has(matchText)) continue;

            highlights.push({
              start: match.index,
              end: match.index + match[0].length,
              type: rule.type,
              reason:
                rule.type.charAt(0).toUpperCase() +
                rule.type.slice(1) +
                " Anomaly",
              suggestion: finalSuggestion,
              explanation: rule.exp,
            });
          }
        }
      });

      // 2. REDUNDANCY DETECTION (Robust Phrase/Word Duplicates)
      const redundancyRules = [
        {
          regex: /\b(\w+)\s+\1\b/gi,
          reason: "Duplicate Word",
          exp: "Consecutive repetition detected.",
        },
        {
          regex: /\b(\w+\s+\w+)\s+\1\b/gi,
          reason: "Duplicate Phrase",
          exp: "Repeating linguistic structure detected.",
        },
      ];

      const legitimatePairs = new Set([
        "had had",
        "that that",
        "can can",
        "is is", // Sometimes used in specific emphasis
        "it it",
      ]);

      const dictionarySet = new Set([...dbWhitelist]);

      redundancyRules.forEach((rule) => {
        let match;
        const regex = new RegExp(rule.regex);
        while ((match = regex.exec(text)) !== null) {
          const matchText = match[0].toLowerCase();

          // Neural Clearance: Check common defaults OR user's personal dictionary
          const isWhitelisted =
            legitimatePairs.has(matchText) ||
            dictionarySet.has(matchText) ||
            dictionarySet.has(match[1].toLowerCase());

          if (!isWhitelisted) {
            // Check if already highlighted
            if (!highlights.find((h) => h.start === match.index)) {
              let finalSuggestion = match[1];
              
              // Smart Capitalization
              const isStartOfSentence =
                match.index === 0 ||
                /[.!?]\s*$/.test(text.substring(0, match.index));
              
              if (isStartOfSentence && finalSuggestion) {
                finalSuggestion =
                  finalSuggestion.charAt(0).toUpperCase() +
                  finalSuggestion.slice(1);
              }

              highlights.push({
                start: match.index,
                end: match.index + match[0].length,
                type: "syntax",
                reason: rule.reason,
                suggestion: finalSuggestion,
                explanation: rule.exp,
              });
            }
          }
        }
      });

      // 3. NEURAL FUZZY LOOP (Similarity Scoring)
      const words = text.split(/(\s+)/);
      let currentIndex = 0;
      words.forEach((word) => {
        const cleanWord = word
          .toLowerCase()
          .replace(/’/g, "'")
          .replace(/[^a-z'-]/g, ""); // Industrial: Allow hyphens and apostrophes

        if (cleanWord.length >= 3 && !truthTrie.has(cleanWord)) {
          // Only check if not already highlighted by forensic rules
          const isAlreadyFlagged = highlights.some(
            (h) => currentIndex >= h.start && currentIndex < h.end,
          );

          if (!isAlreadyFlagged) {
            // Find the BEST legitimate match using Trie Fuzzy Logic (O(L) vs O(N))
            const bestMatch = truthTrie.findFuzzy(cleanWord, 1);
            const minDistance = bestMatch ? 1 : 99; // Currently optimized for distance 1

            // Only flag if it's a very close match AND it's not a common short word
            const commonShorts = [
              "is",
              "the",
              "a",
              "an",
              "at",
              "by",
              "for",
              "in",
              "of",
              "on",
              "to",
              "up",
              "and",
              "but",
              "or",
              "so",
              "as",
              "if",
              "not",
              "it",
              "be",
              "do",
              "we",
              "my",
              "me",
              "he",
              "she",
            ];

            // --- Universal Sentence-Awareness Protocol ---
            let finalSuggestion = bestMatch;
            if (finalSuggestion) {
              const isStartOfSentence =
                currentIndex === 0 ||
                /[.!?]\s*$/.test(text.substring(0, currentIndex).trimEnd() + " ");
              
              if (isStartOfSentence) {
                finalSuggestion =
                  finalSuggestion.charAt(0).toUpperCase() + finalSuggestion.slice(1);
              }
            }

            if (
              bestMatch &&
              minDistance <= 1 &&
              !commonShorts.includes(cleanWord)
            ) {
              highlights.push({
                start: currentIndex,
                end: currentIndex + word.length,
                type: "spelling",
                reason: "Spelling Anomaly",
                suggestion: finalSuggestion,
                explanation: `Fuzzy logic detected a similarity to "${bestMatch}".`,
              });
            } else if (cleanWord.length > 3) {
              // NEURAL OUTLIER DETECTION: Only flag long unknown words as outliers
              highlights.push({
                start: currentIndex,
                end: currentIndex + word.length,
                type: "diction",
                reason: "Specialized Term",
                suggestion: null,
                explanation: "This word is not recognized by the system.",
              });
            }
          }
        }
        currentIndex += word.length;
      });

      const totalAnomalies = highlights.length;
      const gramCount = highlights.filter((h) => h.type === "grammar").length;
      const spellCount = highlights.filter((h) => h.type === "spelling").length;
      const syntaxCount = highlights.filter((h) => h.type === "syntax").length;
      const dictionCount = highlights.filter(
        (h) => h.type === "diction",
      ).length;
      const toneCount = highlights.filter((h) => h.type === "tone").length;

      // Neural Scoring Algorithm: Deduct for specific types + General Anomaly Penalty
      // This ensures that even if an error is miscategorized, it still hurts the relevant score
      const gramScore = Math.max(
        0,
        100 - gramCount * 8 - dictionCount * 1.5 - totalAnomalies * 0.5,
      );
      const spellScore = Math.max(
        0,
        100 - spellCount * 6 - totalAnomalies * 0.5,
      );
      const syntaxScore = Math.max(
        0,
        100 - syntaxCount * 8 - toneCount * 2 - totalAnomalies * 0.5,
      );
      const dictionScore = Math.max(0, 100 - dictionCount * 5 - spellCount * 1);
      const academicScore = Math.max(
        0,
        100 - totalAnomalies * 2 - toneCount * 5,
      );

      const writingScore = Math.round(
        gramScore * 0.3 +
          spellScore * 0.1 +
          syntaxScore * 0.25 +
          dictionScore * 0.15 +
          academicScore * 0.2,
      );

      setIsNeuralScanning(false);

      return {
        diagnostics: {
          grammar: Math.round(gramScore),
          spelling: Math.round(spellScore),
          syntax: Math.round(syntaxScore),
          diction: Math.round(dictionScore),
          academic: Math.round(academicScore),
          writing: Math.max(0, Math.round(writingScore)),
          ielts: Math.max(1.0, 9 - highlights.length * 0.15).toFixed(1),
          ieltsLabel:
            highlights.length < 5
              ? "Expert"
              : highlights.length < 12
                ? "Advanced"
                : highlights.length < 25
                  ? "Competent"
                  : "Limited",
          highlights: highlights.sort((a, b) => a.start - b.start),
        },
      };
    },
    [dbWhitelist, truthTrie]
  );

  return {
    analyze,
    isNeuralScanning,
    getCategoryColor,
    getCategoryBg,
    addToDictionary,
    dbWhitelist,
  };
};

export const getCategoryColor = (type) => {
  switch (type) {
    case "grammar":
      return "text-blue-500";
    case "syntax":
      return "text-emerald-500";
    case "diction":
      return "text-orange-500";
    case "tone":
      return "text-purple-500";
    case "spelling":
      return "text-red-500";
    default:
      return "text-accent";
  }
};

export const getCategoryBg = (type) => {
  switch (type) {
    case "grammar":
      return "rgba(59, 130, 246, 0.1)";
    case "syntax":
      return "rgba(16, 185, 129, 0.1)";
    case "diction":
      return "rgba(249, 115, 22, 0.1)";
    case "tone":
      return "rgba(168, 85, 247, 0.1)";
    case "spelling":
      return "rgba(239, 68, 68, 0.1)";
    default:
      return "rgba(255, 107, 0, 0.1)";
  }
};
