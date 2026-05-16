import { useState, useCallback } from "react";
import {
  legitimateDoubles,
  commonMistakes,
  academicLexicon,
} from "./rigorData";

export const useRigor = () => {
  const [isNeuralScanning, setIsNeuralScanning] = useState(false);

  const getCategoryColor = (type) => {
    switch (type) {
      case "grammar":
        return "bg-blue-500";
      case "diction":
        return "bg-orange-500";
      case "tone":
        return "bg-purple-500";
      case "spelling":
        return "bg-red-500";
      default:
        return "bg-accent";
    }
  };

  const getCategoryBg = (type) => {
    switch (type) {
      case "grammar":
        return "bg-blue-500/10";
      case "diction":
        return "bg-orange-500/10";
      case "tone":
        return "bg-purple-500/10";
      case "spelling":
        return "bg-red-500/10";
      default:
        return "bg-accent/10";
    }
  };

  const analyze = useCallback(async (content) => {
    if (!content) return null;

    setIsNeuralScanning(true);
    // Industrial latency simulation
    await new Promise((r) => setTimeout(r, 1500));

    const text = content.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = text.length;
    const highlights = [];

    // 1. SPELLING & PUNCTUATION (Industrial Repetition Filter)
    // Only flags triple characters or more (e.g., "helllo") to avoid standard double-letter false positives.
    const patternRegex = /\b[a-z]*([a-z])\1{2,}[a-z]*\b/gi;
    let patternMatch;
    while ((patternMatch = patternRegex.exec(text)) !== null) {
      const word = patternMatch[0].toLowerCase();
      // Even for triples, we check against a small "legitimate" list for technical terms if needed.
      if (!legitimateDoubles.includes(word)) {
        highlights.push({
          start: patternMatch.index,
          end: patternMatch.index + patternMatch[0].length,
          type: "spelling",
          reason: "Neural Anomaly",
          suggestion: word.replace(/([a-z])\1{2,}/gi, "$1$1"), // Reduces to a double as most likely intent
          explanation: "Excessive character repetition detected (Keyboard/Neural Artifact).",
        });
      }
    }

    commonMistakes.forEach((pair) => {
      const regex = new RegExp(`\\b${pair.m}\\b`, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + pair.m.length,
          type: "spelling",
          reason: "Spelling Anomaly",
          suggestion: pair.c,
          explanation: "Standard academic spelling mismatch.",
        });
      }
    });



    // 2. GRAMMAR & VERB AGREEMENT
    const grammarChecks = [
      {
        regex: /\b(i)\b/g,
        reason: "Capitalization",
        suggestion: "I",
        explanation: 'Personal pronoun "I" must be capitalized.',
      },
      {
        regex: /\b(i|you|we|they)\s+([a-z]+es|[a-z]+s)\b/gi,
        reason: "Verb Agreement",
        suggestion: "Verb Fix",
        explanation: "Subject-verb agreement mismatch for plural pronoun.",
      },
      {
        regex: /\b(he|she|it)\s+([a-z]{3,})(?<!s|es)\b/gi,
        reason: "Verb Agreement",
        suggestion: "Verb Fix",
        explanation: "Singular subject requires third-person verb form.",
      },
      {
        regex: /(?:^|[.!?]\s+)([a-z])\b/g,
        reason: "Capitalization",
        suggestion: "Uppercase",
        explanation: "Sentence must start with a capital letter.",
      },
      {
        regex: /\b(are|is)\b\s+not\b\s+\w+ing\b/gi,
        reason: "Verb Form",
        suggestion: "Verb Fix",
        explanation: "Check verb tense consistency.",
      },
    ];

    grammarChecks.forEach((check) => {
      let match;
      while ((match = check.regex.exec(text)) !== null) {
        if (!highlights.find((h) => h.start === match.index)) {
          highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: "grammar",
            reason: check.reason,
            suggestion: check.suggestion,
            explanation: check.explanation,
          });
        }
      }
    });

    // 3. DICTION & TONE (Rigor Layer)
    const dictionChecks = [
      {
        regex: /\b(very|extremely|really|quite)\b/gi,
        type: "diction",
        reason: "Weak Adverb",
        suggestion: "Omit",
        explanation: "Weak adverbs reduce academic impact.",
      },
      {
        regex: /\b(things|stuff|nice|good|bad)\b/gi,
        type: "diction",
        reason: "Vague Diction",
        suggestion: "Specific Term",
        explanation: "Replace vague terms with precise academic vocabulary.",
      },
      {
        regex: /\b(is|am|are|was|were|be|been|being)\b\s+\w+ed\b/gi,
        type: "tone",
        reason: "Passive Voice",
        suggestion: "Active Voice",
        explanation: "Active voice is preferred for academic clarity.",
      },
      {
        regex: /\b(maybe|probably|possibly|think|believe|guess|suppose|seem|seems|suggests|appears)\b/gi,
        type: "tone",
        reason: "Hedge Word",
        suggestion: "Assert Phrasing",
        explanation: "Hedge words reduce academic authority. Use assertive terminology.",
      },
      {
        regex: /\b(I feel|I think|in my opinion|I believe|personally)\b/gi,
        type: "tone",
        reason: "Subjective Tone",
        suggestion: "Objective Phrasing",
        explanation: "Maintain an objective, third-person perspective for academic rigor.",
      },
      {
        regex: /\b(get|got|make|made|do|did|take|took)\b/gi,
        type: "diction",
        reason: "Weak Verb",
        suggestion: "Dynamic Verb",
        explanation: "Replace common verbs with precise academic alternatives.",
      },
    ];

    dictionChecks.forEach((check) => {
      let match;
      while ((match = check.regex.exec(text)) !== null) {
        if (!highlights.find((h) => h.start === match.index)) {
          highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: check.type,
            reason: check.reason,
            suggestion: check.suggestion,
            explanation: check.explanation,
          });
        }
      }
    });

    const spellCount = highlights.filter((h) => h.type === "spelling").length;
    const gramCount = highlights.filter((h) => h.type === "grammar").length;
    const dictionCount = highlights.filter((h) => h.type === "diction").length;
    const toneCount = highlights.filter((h) => h.type === "tone").length;

    const academicHits = words.filter((w) =>
      academicLexicon.includes(w.toLowerCase().replace(/[.,;]/g, ""))
    ).length;

    const rigorPenalties = highlights.filter(
      (h) => h.reason === "Hedge Word" || h.reason === "Subjective Tone"
    ).length;

    const gramScore = Math.max(0, 100 - (gramCount + spellCount) * 5);
    const academicScore = Math.max(
      0,
      Math.min(
        100,
        academicHits * 12 + Math.min(20, wordCount / 5) - rigorPenalties * 10
      )
    );
    const readabilityIndex = Math.min(100, (charCount / (wordCount || 1)) * 8);
    const writingScore = Math.round(
      gramScore * 0.35 + academicScore * 0.45 + readabilityIndex * 0.2
    );

    // ── IELTS BAND MAPPING ───────────────────────────────────────────
    const calculateBand = (score) => {
      if (score >= 90) return "9.0";
      if (score >= 80) return "8.5";
      if (score >= 70) return "8.0";
      if (score >= 60) return "7.5";
      if (score >= 50) return "7.0";
      if (score >= 40) return "6.5";
      if (score >= 30) return "6.0";
      if (score >= 20) return "5.5";
      if (score >= 10) return "5.0";
      return "4.5";
    };

    const ieltsBand = calculateBand(writingScore);
    const getBandLabel = (band) => {
      const b = parseFloat(band);
      if (b >= 8.5) return "Expert";
      if (b >= 7.5) return "Very Good";
      if (b >= 6.5) return "Competent";
      if (b >= 5.5) return "Modest";
      return "Limited";
    };

    setIsNeuralScanning(false);

    return {
      diagnostics: {
        grammar: Math.round(gramScore),
        spelling: spellCount,
        diction: dictionCount,
        tone: toneCount,
        academic: Math.round(academicScore),
        index: Math.round(readabilityIndex),
        writing: Math.max(0, Math.round(writingScore)),
        ielts: ieltsBand,
        ieltsLabel: getBandLabel(ieltsBand),
        highlights,
        marketTrends: words
          .filter((w) => w.length > 7 && !academicLexicon.includes(w.toLowerCase()))
          .sort((a, b) => b.length - a.length)
          .slice(0, 4)
          .map((w) => {
            const word = w.toLowerCase().replace(/[.,;]/g, "");
            if (["data", "analysis", "empirical", "results"].includes(word)) return "Quantitative Precision";
            if (["theory", "framework", "perspective", "discourse"].includes(word)) return "Theoretical Depth";
            if (["significant", "impact", "substantial", "primary"].includes(word)) return "Scholarly Authority";
            return `${word.charAt(0).toUpperCase() + word.slice(1)} Domain Identified`;
          }),
      },
      highlights,
    };
  }, []);

  return { analyze, isNeuralScanning, getCategoryColor, getCategoryBg };
};
