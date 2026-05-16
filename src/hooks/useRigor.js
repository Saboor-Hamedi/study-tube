import { useState, useCallback, useEffect, useMemo } from "react";
import { useStore } from "../store/useStore";
import {
  commonMistakes,
  academicLexicon,
  forensicRules,
  commonWords,
  legitimateDoubles,
  legitimateExceptions,
} from "./rigor";
import { Trie } from "./rigor/Trie";

// INDUSTRIAL OPTIMIZATION: Cache the static base trie outside the hook
// This prevents rebuilding the 450k+ word trie on every render or sync.
let cachedStaticTrie = null;

export const useRigor = () => {
  const [isNeuralScanning, setIsNeuralScanning] = useState(false);
  const [dbWhitelist, setDbWhitelist] = useState([]);
  const [whitelistMeta, setWhitelistMeta] = useState({
    count: 0,
    lastUpdated: 0,
  });

  // --- Neural Forensic Trie (Memoized for O(L) Lookups) ---
  const truthTrie = useMemo(() => {
    // 1. Build or Retrieve the Static Base (450k+ words)
    if (!cachedStaticTrie) {
      // console.log("[FORENSIC] Initializing Master Base Trie (450k+ words)...");
      cachedStaticTrie = new Trie([
        ...academicLexicon,
        ...commonWords,
        ...legitimateDoubles,
      ]);
      // console.log("[FORENSIC] Master Base Ready.");
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

        // Check Neural Engine Health & Model Download Status
        try {
          const healthRes = await fetch("http://127.0.0.1:8000/health");
          if (healthRes.ok) {
            const health = await healthRes.json();
            if (health.engine === "blind" || health.minilm === "blind") {
              useStore
                .getState()
                .showToast(
                  "Neural Models downloading... Please wait.",
                  "error",
                );
            }
          }
        } catch (err) {
          useStore
            .getState()
            .showToast(
              "Connecting to Neural Engine... (Downloading models)",
              "error",
            );
        }

        if (window.youtubeAPI?.getForensicWhitelist) {
          const list = await window.youtubeAPI.getForensicWhitelist();
          if (Array.isArray(list)) {
            setDbWhitelist(list);
            // console.log("[FORENSIC] Sync OK. Density:", list.length);
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
          window.alert(
            `Forensic Handshake Failure: ${e.message}\n\nPlease verify PostgreSQL service status.`,
          );
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

          if (
            meta &&
            (meta.count !== whitelistMeta.count ||
              meta.lastUpdated !== whitelistMeta.lastUpdated)
          ) {
            // console.log("[FORENSIC] Industrial Dataset Change Detected.");
            const list = await window.youtubeAPI.getForensicWhitelist();
            if (Array.isArray(list)) {
              setDbWhitelist(list);
              setWhitelistMeta({
                count: meta.count,
                lastUpdated: meta.lastUpdated,
              });
              // console.log("[FORENSIC] Industrial Sync Complete. New Count:", list.length);
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
            // console.log("[FORENSIC] Neural Sync Complete. New Whitelist Density:", updatedList.length);
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

      const text = content.replace(/’/g, "'").replace(/[—–]/g, " ");
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const wordsArray = text.split(/\s+/).filter((w) => w.trim().length > 0);
      let highlights = [];

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
            // Handle functional suggestions or static strings
            let processedSuggestion =
              typeof rule.suggestion === "function"
                ? rule.suggestion(match)
                : rule.suggestion;

            // Process regex placeholders like $1, $2 if it's a string
            if (
              typeof processedSuggestion === "string" &&
              processedSuggestion.includes("$")
            ) {
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

            if (
              isStartOfSentence &&
              finalSuggestion &&
              finalSuggestion !== "Omit"
            ) {
              finalSuggestion =
                finalSuggestion.charAt(0).toUpperCase() +
                finalSuggestion.slice(1);
            }

            // --- Neural Whitelist Check (Pattern Exceptions Only) ---
            const matchText = match[0].toLowerCase();

            // Check Static Pattern Exceptions (legitimateExceptions)
            const isExcepted = legitimateExceptions.some((ex) => {
              const exRegex = new RegExp(ex.pattern);
              return exRegex.test(
                text.substring(match.index, match.index + match[0].length),
              );
            });
            if (isExcepted) continue;

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

      const dictionarySet = new Set([...dbWhitelist]);

      redundancyRules.forEach((rule) => {
        let match;
        const regex = new RegExp(rule.regex);
        while ((match = regex.exec(text)) !== null) {
          const matchText = match[0].toLowerCase();

          // Neural Clearance: Check common defaults OR user's personal dictionary
          const isWhitelisted =
            legitimateExceptions.some((ex) => {
              const exRegex = new RegExp(ex.pattern);
              return exRegex.test(matchText);
            }) ||
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

      // 2.5 LINGUISTIC & NEURAL LOGIC AUDIT
      // We hit the port 8000 (spaCy) and port 8008 (BERT/GPT-2) engines
      let semanticIntegrity = 1.0; // multiplier (1.0 = perfect, 0.0 = nonsense)
      let neuralData = null;

      try {
        // Dispatch both requests in parallel for industrial performance
        const [forensicResponse, neuralResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/forensic/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          }),
          fetch("http://127.0.0.1:8008/detect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          }).catch(() => null), // Neural engine might be offline
        ]);

        if (neuralResponse && neuralResponse.ok) {
          neuralData = await neuralResponse.json();
          const ppl = neuralData.perplexity;

          // NEURAL ANCHORING LOGIC:
          // 1. If Perplexity is EXTREME (> 500), it's likely nonsensical word salad.
          // 2. If Perplexity is TOO LOW (< 15), it's robotic/monotonous.
          if (ppl > 500) {
            semanticIntegrity = Math.max(0.1, 1 - (ppl - 500) / 1000);
          } else if (ppl < 15) {
            semanticIntegrity = Math.max(0.4, ppl / 15);
          }
        }

        if (forensicResponse.ok) {
          const forensicData = await forensicResponse.json();
          if (Array.isArray(forensicData.highlights)) {
            // console.log(`[FORENSIC] Sidecar returned ${forensicData.highlights.length} structural anomalies.`);
            forensicData.highlights.forEach((highlight) => {
              // AUTHORITY OVERRIDE: Sidecar highlights replace overlapping Regex/Local highlights unless the local highlight is a fundamental Grammar Capitalization error
              highlights = highlights.filter((h) => {
                const overlaps =
                  (highlight.start >= h.start && highlight.start < h.end) ||
                  (h.start >= highlight.start && h.start < highlight.end);
                // If it overlaps, but the local highlight is a Grammar error (Capitalization), KEEP the Grammar error and ignore the Sidecar tone highlight!
                if (overlaps && h.type === "grammar") {
                  highlight.ignore = true; // Mark sidecar highlight to be skipped
                  return true; // Keep local grammar highlight
                }
                return !overlaps;
              });

              if (highlight.ignore) return;

              // Smart Capitalization for Sidecar Suggestions
              let finalSuggestion = highlight.suggestion;
              const isStartOfSentence =
                highlight.start === 0 ||
                /[.!?]\n?\s*$/.test(text.substring(0, highlight.start));

              if (
                isStartOfSentence &&
                finalSuggestion &&
                finalSuggestion !== "Active Voice" &&
                finalSuggestion !== "Omit"
              ) {
                finalSuggestion =
                  finalSuggestion.charAt(0).toUpperCase() +
                  finalSuggestion.slice(1);
              }

              highlights.push({
                start: highlight.start,
                end: highlight.end,
                type: highlight.type || "grammar",
                reason: highlight.reason || "Linguistic Anomaly",
                suggestion: finalSuggestion,
                explanation:
                  highlight.explanation ||
                  "Deterministic NLP analysis detected a structural grammatical error.",
              });
            });
          }
        }
      } catch (e) {
        console.warn(
          "[FORENSIC] Linguistic Sidecar Connection FAILURE:",
          e.message,
        );
        // console.log("[FORENSIC] Falling back to local heuristics.");
      }

      // 3. NEURAL FUZZY LOOP (Similarity Scoring)
      // Replace em-dashes and en-dashes with an explicit space before splitting text into word tokens
      const sanitizedText = text.replace(/[—–]/g, " ");
      const words = sanitizedText.split(/(\s+)/);
      let currentIndex = 0;
      words.forEach((word) => {
        const trimmed = word.trim();

        // SUGGESTION 1 & 3: Bypass spelling triage for Academic Citations, Proper Nouns, Acronyms, and Tech Tokens
        const isCitationOrProper = /^[\(\[]?[A-Z][a-z]{2,}[,\)\}\]]?$/.test(
          trimmed,
        );
        const isAcronymOrTech =
          /^[\(\[]?[A-Z0-9._\/&@-]{2,}[,\)\}\]]?$/.test(trimmed) ||
          /^[a-z]+[A-Z]+/.test(trimmed) ||
          trimmed.includes("cs.AI");

        if (trimmed.length > 0 && !isCitationOrProper && !isAcronymOrTech) {
          const cleanWord = word
            .toLowerCase()
            .replace(/’/g, "'")
            .replace(/[^a-z'-]/g, ""); // Industrial: Allow hyphens and apostrophes

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

          if (cleanWord.length >= 3 && !isKnown) {
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
                  /[.!?]\s*$/.test(
                    text.substring(0, currentIndex).trimEnd() + " ",
                  );

                if (isStartOfSentence) {
                  finalSuggestion =
                    finalSuggestion.charAt(0).toUpperCase() +
                    finalSuggestion.slice(1);
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
        }
        currentIndex += word.length;
      });

      const totalWords = Math.max(1, wordsArray.length);
      const totalAnomalies = highlights.length;
      const gramCount = highlights.filter((h) => h.type === "grammar").length;
      const spellCount = highlights.filter((h) => h.type === "spelling").length;
      const syntaxCount = highlights.filter((h) => h.type === "syntax").length;
      const dictionCount = highlights.filter(
        (h) => h.type === "diction",
      ).length;
      const toneCount = highlights.filter((h) => h.type === "tone").length;

      // Length-Normalized Component Metrics (Errors per 100 words)
      const gramScore = Math.max(
        0,
        100 - (gramCount / totalWords) * 400 - (dictionCount / totalWords) * 50,
      );
      const spellScore = Math.max(0, 100 - (spellCount / totalWords) * 300);
      const syntaxScore = Math.max(
        0,
        100 - (syntaxCount / totalWords) * 400 - (toneCount / totalWords) * 100,
      );
      const dictionScore = Math.max(
        0,
        100 -
          (dictionCount / totalWords) * 300 -
          (spellCount / totalWords) * 50,
      );
      const academicScore = Math.max(
        0,
        100 -
          (totalAnomalies / totalWords) * 150 -
          (toneCount / totalWords) * 200,
      );

      // --- INDUSTRIAL ANCHORING (Safety Protocol) ---
      const healthIndex =
        (gramScore * 0.4 + syntaxScore * 0.4 + academicScore * 0.2) / 100;

      // Anomaly Density Check: Only penalize extreme density (> 30% errors)
      const anomalyDensity = totalAnomalies / totalWords;
      const densityPenalty =
        anomalyDensity > 0.35 ? 0.5 : anomalyDensity > 0.25 ? 0.8 : 1.0;

      // Combine Neural Integrity with Linguistic Health
      const effectiveIntegrity =
        semanticIntegrity * healthIndex * densityPenalty;

      // FLOW & RHYTHM CALCULATIONS
      const flowCount = highlights.filter(
        (h) => h.reason === "Low Transition Density",
      ).length;
      const rhythmCount = highlights.filter(
        (h) => h.reason === "Rhythmic Monotony",
      ).length;

      const baseFlow = Math.max(
        0,
        100 - (flowCount / Math.max(1, sentences.length)) * 200,
      );
      const baseRhythm = Math.max(
        0,
        100 - (rhythmCount / Math.max(1, sentences.length)) * 250,
      );

      // Final Anchored Scores
      const finalFlow = Math.round(baseFlow * effectiveIntegrity);
      const finalRhythm = Math.round(baseRhythm * effectiveIntegrity);

      const writingScore = Math.round(
        gramScore * 0.25 +
          spellScore * 0.1 +
          syntaxScore * 0.2 +
          dictionScore * 0.1 +
          academicScore * 0.15 +
          finalFlow * 0.2,
      );

      setIsNeuralScanning(false);

      // --- Industrial Complexity Guard ---
      const avgLen = wordsArray.length / Math.max(1, sentences.length);
      const academicMatches = wordsArray.filter((w) =>
        academicLexicon.includes(w.toLowerCase().replace(/[^a-z]/g, "")),
      ).length;

      // Length-Normalized Deductive Score (Errors per 100 words)
      const errorDeduction = anomalyDensity * 8.0;

      // Complexity Reward/Penalty
      let baseBand = 9.0;
      if (avgLen < 10) baseBand -= 0.5;
      if (academicMatches < 2 && wordsArray.length > 20) baseBand -= 1.0;

      // Integrity Penalty
      const integrityPenalty = (1 - effectiveIntegrity) * 4.0;

      const ieltsFinal = Math.max(
        1.0,
        Math.min(9.0, baseBand - errorDeduction - integrityPenalty),
      );

      return {
        diagnostics: {
          grammar: Math.round(gramScore),
          spelling: Math.round(spellScore),
          syntax: Math.round(syntaxScore),
          diction: Math.round(dictionScore),
          academic: Math.round(academicScore),
          flow: finalFlow,
          rhythm: finalRhythm,
          writing: Math.max(0, Math.round(writingScore)),
          ielts: ieltsFinal.toFixed(1),
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
    [dbWhitelist, truthTrie],
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
    case "acad":
      return "text-indigo-400";
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
    case "acad":
      return "rgba(129, 140, 248, 0.1)";
    default:
      return "rgba(255, 107, 0, 0.1)";
  }
};
