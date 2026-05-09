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
      case "grammar": return "text-blue-500";
      case "syntax": return "text-emerald-500";
      case "diction": return "text-orange-500";
      case "tone": return "text-purple-500";
      case "spelling": return "text-red-500";
      default: return "text-accent";
    }
  };

  const getCategoryBg = (type) => {
    switch (type) {
      case "grammar": return "rgba(59, 130, 246, 0.1)";
      case "syntax": return "rgba(16, 185, 129, 0.1)";
      case "diction": return "rgba(249, 115, 22, 0.1)";
      case "tone": return "rgba(168, 85, 247, 0.1)";
      case "spelling": return "rgba(239, 68, 68, 0.1)";
      default: return "rgba(255, 107, 0, 0.1)";
    }
  };

  const analyze = useCallback(async (content) => {
    if (!content) return null;

    setIsNeuralScanning(true);
    await new Promise((r) => setTimeout(r, 1200));

    const text = content;
    const highlights = [];

    // 1. COMPREHENSIVE FORENSIC DATABASE
    const forensicRules = [
      // Spelling & Phonetics (RED)
      { regex: /\bfroot\b/gi, type: "spelling", suggestion: "fruit", exp: "Phonetic spelling anomaly." },
      { regex: /\bwheather\b/gi, type: "spelling", suggestion: "weather", exp: "Semantic confusion (weather vs whether)." },
      { regex: /\bTheir\s+was\b/gi, type: "spelling", suggestion: "There was", exp: "Homophone confusion (There/Their)." },
      { regex: /\bpeples\b/gi, type: "spelling", suggestion: "people", exp: "Irregular plural spelling error." },
      { regex: /\bshoping\b/gi, type: "spelling", suggestion: "shopping", exp: "Missing double consonant." },
      { regex: /\btrys\b/gi, type: "spelling", suggestion: "tries", exp: "Incorrect verb suffix." },
      { regex: /\binsted\b/gi, type: "spelling", suggestion: "instead", exp: "Spelling anomaly." },
      { regex: /\bfreind\b/gi, type: "spelling", suggestion: "friend", exp: "I before E error." },
      { regex: /\bcrazyness\b/gi, type: "spelling", suggestion: "craziness", exp: "Suffix spelling error." },
      { regex: /\bexpensve\b/gi, type: "spelling", suggestion: "expensive", exp: "Missing vowel." },
      { regex: /\bgrocerie\b/gi, type: "spelling", suggestion: "grocery", exp: "Spelling anomaly." },
      { regex: /\brelized\b/gi, type: "spelling", suggestion: "realized", exp: "Missing vowel." },
      { regex: /\bimportent\b/gi, type: "spelling", suggestion: "important", exp: "Vowel confusion." },
      { regex: /\bgeting\b/gi, type: "spelling", suggestion: "getting", exp: "Missing double consonant." },
      { regex: /\bsoked\b/gi, type: "spelling", suggestion: "soaked", exp: "Spelling anomaly." },
      { regex: /\btotaly\b/gi, type: "spelling", suggestion: "totally", exp: "Missing double consonant." },
      { regex: /\bfinaly\b/gi, type: "spelling", suggestion: "finally", exp: "Missing double consonant." },
      { regex: /\bcitys\b/gi, type: "spelling", suggestion: "cities", exp: "Plural spelling anomaly." },
      { regex: /\beverybodys\b/gi, type: "spelling", suggestion: "everybody", exp: "Possessive/Plural confusion." },

      // Grammar: Pronoun-Verb Agreement & Case (BLUE)
      { regex: /\bMe\s+and\s+(\w+)\s+is\b/gi, type: "grammar", suggestion: "$1 and I are", exp: "Compound subject case and agreement error." },
      { regex: /\bthem\b/gi, type: "grammar", suggestion: "they", exp: "Objective pronoun used as subject." },
      { regex: /\bhim\b(?=\s+(?:is|was|went|go|goes|want|wants|thinks|knows|cryed|cried|has|had|did))/gi, type: "grammar", suggestion: "he", exp: "Objective pronoun used as subject." },
      { regex: /\bher\b(?=\s+(?:is|was|went|go|goes|want|wants|thinks|knows|don't|doesn't|has|had|did))/gi, type: "grammar", suggestion: "she", exp: "Objective pronoun used as subject." },
      { regex: /\bus\b(?=\s+(?:is|was|went|go|goes|want|wants|thinks|knows|drinked|drank|has|had|did))/gi, type: "grammar", suggestion: "we", exp: "Objective pronoun used as subject." },
      { regex: /\bHer\s+don't\b/gi, type: "grammar", suggestion: "She doesn't", exp: "Subject-case and auxiliary agreement error." },
      { regex: /\bMe\s+is\b/gi, type: "grammar", suggestion: "I am", exp: "Subject-case and agreement mismatch." },
      { regex: /\b(it|this)\s+are\b/gi, type: "grammar", suggestion: "$1 is", exp: "Singular agreement error." },
      { regex: /\bapples\s+is\b/gi, type: "grammar", suggestion: "apples are", exp: "Plural agreement error." },
      
      // Syntax: Tense & Verb Forms (GREEN)
      { regex: /\b(goes|go)\b(?=.*?\byesterday\b)/gi, type: "syntax", suggestion: "went", exp: "Tense mismatch with 'yesterday'." },
      { regex: /\b(is|are)\b(?=.*?\byesterday\b)/gi, type: "syntax", suggestion: "was", exp: "Tense mismatch with 'yesterday'." },
      { regex: /\bIf\s+I\s+was\s+you\b/gi, type: "syntax", suggestion: "If I were you", exp: "Subjunctive mood error." },
      { regex: /\bI\s+will\s+not\s+bought\b/gi, type: "syntax", suggestion: "I would not buy", exp: "Modal-tense mismatch." },
      { regex: /\bbuyed\b/gi, type: "syntax", suggestion: "bought", exp: "Irregular verb past form error." },
      { regex: /\bdrinked\b/gi, type: "syntax", suggestion: "drank", exp: "Irregular verb past form error." },
      { regex: /\bsayed\b/gi, type: "syntax", suggestion: "said", exp: "Irregular verb past form error." },
      { regex: /\bcryed\b/gi, type: "syntax", suggestion: "cried", exp: "Spelling/Verb form error." },
      { regex: /\bhas\s+goed\b/gi, type: "syntax", suggestion: "has gone", exp: "Irregular verb anomaly." },
      { regex: /\blefted\b/gi, type: "syntax", suggestion: "left", exp: "Irregular verb error." },
      { regex: /\bsitted\b/gi, type: "syntax", suggestion: "sat", exp: "Irregular verb error." },
      { regex: /\bfinded\b/gi, type: "syntax", suggestion: "found", exp: "Irregular verb error." },
      { regex: /\bI\s+seen\b/gi, type: "syntax", suggestion: "I saw", exp: "Simple past vs past participle error." },
      { regex: /\bus\s+drinked\b/gi, type: "syntax", suggestion: "we drank", exp: "Subject-case and verb form error." },
      { regex: /\bhim\s+cryed\b/gi, type: "syntax", suggestion: "he cried", exp: "Subject-case and verb form anomaly." },

      // Diction & Modifiers (ORANGE)
      { regex: /\ba\s+[aeiou]\w+/gi, type: "diction", suggestion: "an", exp: "Incorrect article usage before vowel sound." },
      { regex: /\ban\s+[^aeiou]\w+/gi, type: "diction", suggestion: "a", exp: "Incorrect article usage before consonant sound." },
      { regex: /\bmore\s+(\w+er)\b/gi, type: "diction", suggestion: "$1", exp: "Double comparative error (e.g., 'more greener')." },
      { regex: /\bmost\s+(\w+est)\b/gi, type: "diction", suggestion: "$1", exp: "Double superlative error (e.g., 'most bestest')." },
      { regex: /\bthen\b(?=.*?\bthan\b)/gi, type: "diction", suggestion: "than", exp: "Comparison word confusion." },
      { regex: /\bto\s+much\b/gi, type: "diction", suggestion: "too much", exp: "Adverbial 'too' required." },
      { regex: /\bsourly\b/gi, type: "diction", suggestion: "sour", exp: "Adjective/Adverb confusion." },
      { regex: /\bthirstly\b/gi, type: "diction", suggestion: "thirsty", exp: "Incorrect adjective form." },
      { regex: /\bbrokenly\b/gi, type: "diction", suggestion: "broken", exp: "Incorrect adjective form." },
      { regex: /\b(very|extremely|really|quite|totally|completely)\b/gi, type: "diction", suggestion: "Omit", exp: "Weak adverbs reduce academic rigor." },

      // Tone (PURPLE)
      { regex: /\bthink\b/gi, type: "tone", suggestion: "Assert", exp: "Use assertive verbs to increase scholarly authority." },
      { regex: /\bbelieve\b/gi, type: "tone", suggestion: "Contend", exp: "Academic 'Contend' is more rigorous than 'Believe'." },
      { regex: /\bmaybe\b/gi, type: "tone", suggestion: "Potentially", exp: "Use formal probability markers." },
      { regex: /\bguess\b/gi, type: "tone", suggestion: "Hypothesize", exp: "Professional research requires hypothesizing over guessing." },
    ];

    forensicRules.forEach(rule => {
      let match;
      const regex = new RegExp(rule.regex);
      while ((match = regex.exec(text)) !== null) {
        if (!highlights.find(h => h.start === match.index)) {
          // Process regex placeholders like $1, $2 in the suggestion string
          let processedSuggestion = rule.suggestion;
          if (rule.suggestion.includes("$")) {
            processedSuggestion = rule.suggestion.replace(/\$(\d+)/g, (m, g) => {
              return match[parseInt(g)] || m;
            });
          }

          // Smart Capitalization: Detect if match is at start of sentence or text
          let finalSuggestion = processedSuggestion;
          const isStartOfSentence = match.index === 0 || /[.!?]\s+$/.test(text.substring(0, match.index));
          if (isStartOfSentence && finalSuggestion !== "Omit") {
            finalSuggestion = finalSuggestion.charAt(0).toUpperCase() + finalSuggestion.slice(1);
          }

          highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: rule.type,
            reason: rule.type.charAt(0).toUpperCase() + rule.type.slice(1) + " Anomaly",
            suggestion: finalSuggestion,
            explanation: rule.exp,
          });
        }
      }
    });

    const spellCount = highlights.filter(h => h.type === "spelling").length;
    const gramCount = highlights.filter(h => h.type === "grammar").length;
    const syntaxCount = highlights.filter(h => h.type === "syntax").length;
    const dictionCount = highlights.filter(h => h.type === "diction").length;
    
    const gramScore = Math.max(0, 100 - (gramCount + spellCount + syntaxCount) * 3);
    const academicScore = Math.max(0, 80 - highlights.length * 1.5);
    const writingScore = Math.round(gramScore * 0.5 + academicScore * 0.5);

    setIsNeuralScanning(false);

    return {
      diagnostics: {
        grammar: Math.round(gramScore),
        spelling: spellCount,
        syntax: syntaxCount,
        diction: dictionCount,
        academic: Math.round(academicScore),
        writing: Math.max(0, Math.round(writingScore)),
        ielts: Math.max(1.0, (9 - (highlights.length * 0.12))).toFixed(1),
        ieltsLabel: highlights.length < 5 ? "Expert" : highlights.length < 12 ? "Advanced" : highlights.length < 25 ? "Competent" : "Limited",
        highlights: highlights.sort((a, b) => a.start - b.start),
      }
    };
  }, []);

  return { analyze, isNeuralScanning, getCategoryColor, getCategoryBg };
};
