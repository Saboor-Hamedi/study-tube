import { useState, useCallback, useEffect } from "react";
import {
  commonMistakes,
  academicLexicon,
  forensicRules,
  commonWords,
} from "./rigor";

export const useRigor = () => {
  const [isNeuralScanning, setIsNeuralScanning] = useState(false);
  const [dbWhitelist, setDbWhitelist] = useState([]);

  // Load persistence layer on mount
  useEffect(() => {
    const loadWhitelist = async () => {
      try {
        if (window.youtubeAPI?.getForensicWhitelist) {
          const list = await window.youtubeAPI.getForensicWhitelist();
          if (Array.isArray(list)) setDbWhitelist(list);
        } else {
          // Web Fallback: Direct fetch to cloud bridge
          const res = await fetch("http://127.0.0.1:8000/forensic/whitelist");
          const list = await res.json();
          if (Array.isArray(list)) setDbWhitelist(list);
        }
      } catch (e) {
        console.warn("[FORENSIC] Persistence Load Fail:", e.message);
      }
    };
    loadWhitelist();
  }, []);

  const addToDictionary = useCallback(async (word) => {
    if (!word) return;
    const cleanWord = word
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-z']/g, "");

    // Attempt Electron Bridge first
    if (window.youtubeAPI?.addForensicWord) {
      try {
        const result = await window.youtubeAPI.addForensicWord(cleanWord);
        if (result && (result.status === "success" || result.ok)) {
          setDbWhitelist((prev) => [...new Set([...prev, cleanWord])]);
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

  const getCategoryColor = (type) => {
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

  const getCategoryBg = (type) => {
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

  // --- Neural Similarity Algorithm (Levenshtein Distance) ---
  const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const analyze = useCallback(
    async (content) => {
      if (!content) return null;

      setIsNeuralScanning(true);
      await new Promise((r) => setTimeout(r, 1200));

      const text = content;
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
              /[.!?]\s+$/.test(text.substring(0, match.index));
            if (isStartOfSentence && finalSuggestion !== "Omit") {
              finalSuggestion =
                finalSuggestion.charAt(0).toUpperCase() +
                finalSuggestion.slice(1);
            }

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

      // 2. NEURAL FUZZY LOOP (Similarity Scoring)
      const truthSet = new Set([
        ...academicLexicon,
        ...commonWords,
        ...dbWhitelist,
      ]);
      const words = text.split(/(\s+)/);
      let currentIndex = 0;
      words.forEach((word) => {
        const cleanWord = word
          .toLowerCase()
          .replace(/’/g, "'")
          .replace(/[^a-z']/g, "");
        if (cleanWord.length >= 3 && !truthSet.has(cleanWord)) {
          // Only check if not already highlighted by forensic rules
          const isAlreadyFlagged = highlights.some(
            (h) => currentIndex >= h.start && currentIndex < h.end,
          );

          if (!isAlreadyFlagged) {
            // Find the BEST legitimate match (Minimum Distance)
            const isLegit = truthSet.has(cleanWord);

            if (!isLegit) {
              let bestMatch = null;
              let minDistance = 99;

              for (const target of truthSet) {
                if (Math.abs(target.length - cleanWord.length) <= 1) {
                  const distance = getLevenshteinDistance(cleanWord, target);
                  if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = target;
                  }
                  if (minDistance === 1) break;
                }
              }

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
                  suggestion: bestMatch,
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
                  explanation:
                    "This term is not in the primary academic dataset; verify specialized context.",
                });
              }
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
    [dbWhitelist],
  );

  const analyzeAI = useCallback(async (content, api) => {
    if (!content || !api) return [];

    try {
      const prompt = `You are a Surgical Technical Editor. 
Your task is to identify specific word-level improvements in the text below.

CRITICAL RULES:
1. NO STRUCTURAL REWRITES: Do not merge sentences. Do not rewrite whole thoughts.
2. SURGICAL PRECISION: Target the smallest possible phrase (ideally 1-3 words). 
3. NO ADDITIONS: Do not add words like "Recommendation:" or "Note:". 
4. PRESERVE INTENT: Only suggest a change if the original word is informal, technically imprecise, or grammatically incorrect.

Return ONLY a valid JSON array of objects:
{ "text": "the exact small phrase from text", "type": "grammar|syntax|diction|tone", "suggestion": "better 1-3 words", "explanation": "brief reason" }

Text: "${content}"`;

      const response = await api.chatWithAI({
        messages: [{ role: "user", content: prompt }],
        context: "Surgical Academic Forensic Audit",
      });

      // Robust JSON extraction
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const rawAnomalies = JSON.parse(jsonMatch[0]);
      const aiHighlights = [];
      let currentPos = 0;

      rawAnomalies.forEach((anomaly) => {
        // Search for the word starting from the last found position to handle multiple occurrences
        const start = content
          .toLowerCase()
          .indexOf(anomaly.text.toLowerCase(), currentPos);

        if (start !== -1) {
          const end = start + anomaly.text.length;

          // Deduplication: Ensure this AI highlight doesn't overlap with any existing highlight
          const isOverlapping = aiHighlights.some(
            (h) =>
              (start >= h.start && start < h.end) ||
              (end > h.start && end <= h.end) ||
              (start <= h.start && end >= h.end),
          );

          if (!isOverlapping) {
            aiHighlights.push({
              start,
              end,
              type: anomaly.type || "grammar",
              reason: `Neural ${anomaly.type?.charAt(0).toUpperCase() + anomaly.type?.slice(1) || "Audit"}`,
              suggestion: anomaly.suggestion,
              explanation: anomaly.explanation,
              isAI: true,
            });
            // Advance currentPos slightly past the start of this word
            // but not past the end, in case of overlapping suggestions
            // (though we filtered overlaps above)
            currentPos = end;
          }
        }
      });

      return aiHighlights.sort((a, b) => a.start - b.start);
    } catch (err) {
      console.error("Neural Deep Scan Failure:", err);
      return [];
    }
  }, []);

  return {
    analyze,
    analyzeAI,
    isNeuralScanning,
    getCategoryColor,
    getCategoryBg,
    addToDictionary,
  };
};
