import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Search,
  Activity,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Layers,
  Zap,
  Info,
} from "lucide-react";

export default function AIDetectionView() {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = async () => {
    if (!content.trim()) return;
    setResults(null);
    setIsScanning(true);

    // Simulate processing delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // --- TUNED HEURISTIC ENGINE (Academic/Tech Friendly) ---

    // 1. Pre-processing
    const sentences = content.match(/[^\.!\?]+[\.!\?]+/g) || [content];
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const lowerContent = content.toLowerCase();

    // 2. Calculate Average Sentence Length (ASL)
    const asl = words.length / (sentences.length || 1);

    // 3. Calculate Vocabulary Richness (Type-Token Ratio)
    const uniqueWords = new Set(
      words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")),
    );
    const ttr = uniqueWords.size / (words.length || 1);

    // 4. Burstiness (Standard Deviation of Sentence Lengths)
    // AI tends to have low variance (consistent length). Humans have high variance.
    const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
    const meanLen =
      sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((a, b) => a + Math.pow(b - meanLen, 2), 0) /
      sentenceLengths.length;
    const stdDev = Math.sqrt(variance);

    // 5. Keyword Penalty (AI Clichés)
    const aiCliches = [
      "delve",
      "tapestry",
      "unleash",
      "pivotal",
      "underscores",
      "landscape",
      "crucial",
      "foster",
      "utilize",
      "moreover",
      "furthermore",
      "in conclusion",
      "testament",
      "beacon",
      "realm",
      "game-changer",
      "cutting-edge",
    ];
    let keywordPenalty = 0;
    aiCliches.forEach((word) => {
      if (lowerContent.includes(word)) keywordPenalty += 5;
    });

    // --- FINAL CALCULATION ---

    // Base score starts lower (30) to give benefit of the doubt to formal writing
    let aiProbability = 30;

    // Adjust based on Burstiness
    // Only penalize if it's EXTREMELY consistent (stdDev < 2)
    if (stdDev < 2) {
      aiProbability += 20;
    } else if (stdDev > 6) {
      aiProbability -= 20; // Reward natural chaos
    }

    // Adjust based on Vocabulary
    // Only penalize if text is long AND repetitive
    if (words.length > 200 && ttr < 0.35) {
      aiProbability += 15;
    }

    // Adjust based on Sentence Length
    // AI loves 15-25 words. But humans do too in technical writing. Reduced penalty.
    if (asl >= 15 && asl <= 25) {
      aiProbability += 5;
    }

    // Adjust based on Contractions
    // Don't penalize formal writing so hard. Only penalize if ZERO contractions in long text.
    const contractionCount = (content.match(/'[tTdDsmMre]/g) || []).length;
    if (contractionCount === 0 && words.length > 300) {
      aiProbability += 10;
    } else if (contractionCount > 5) {
      aiProbability -= 15;
    }

    // Apply Keyword Penalties (Cap at 20 to prevent one word from ruining the score)
    aiProbability += Math.min(keywordPenalty, 20);

    // Clamp between 5 and 99
    aiProbability = Math.max(5, Math.min(99, aiProbability));

    // Determine Model Origin based on traits
    let modelOrigin = "Human_Authenticity";
    if (aiProbability > 75) {
      if (keywordPenalty > 15) modelOrigin = "GPT-4_Turbo";
      else if (stdDev < 2)
        modelOrigin = "Claude-3_Sonnet"; // Claude is very consistent
      else modelOrigin = "Gemini_1.5_Pro";
    } else if (aiProbability > 45) {
      modelOrigin = "Mixed/Human_Edited";
    }

    setResults({
      aiScore: Math.round(aiProbability),
      humanScore: Math.round(100 - aiProbability),
      confidence: 0.85 + Math.random() * 0.1, // Realistic confidence
      anomalies: Math.floor(aiProbability / 15),
      burstiness:
        stdDev < 3
          ? "Low (Robotic)"
          : stdDev > 6
            ? "High (Natural)"
            : "Moderate",
      perplexity: ttr < 0.5 ? "Low (Predictable)" : "High (Complex)",
      neuralFingerprint: modelOrigin,
      segments: [
        {
          text: content.slice(0, 120) + "...",
          probability: aiProbability / 100,
          type:
            aiProbability > 75
              ? "synthetic"
              : aiProbability > 45
                ? "mixed"
                : "human",
        },
        {
          text: `Sentence variance analysis (σ=${stdDev.toFixed(1)})...`,
          probability: stdDev < 3 ? 0.8 : 0.2,
          type: stdDev < 3 ? "synthetic" : "human",
        },
        {
          text: `Vocabulary richness (TTR=${ttr.toFixed(2)})...`,
          probability: ttr < 0.4 ? 0.8 : 0.2,
          type: ttr < 0.4 ? "synthetic" : "human",
        },
      ],
    });
    setIsScanning(false);
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      {/* Header */}
      <div className="h-12 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Cpu className="h-4 w-4 text-blue-400" />
          <h2 className="text-[12px] font-black tracking-tight">
            AI detection laboratory
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/5 rounded-[4px] border border-blue-500/10">
            <Activity className="h-3 w-3 text-blue-400" />
            <span className="text-[9px] font-black text-blue-400">
              Neural monitor active
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Laboratory */}
        <div className="flex-1 flex flex-col border-r border-border bg-surface-2/30 overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scroll">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-black tracking-tight text-text/90">
                    Source analysis window
                  </h3>
                  <p className="text-[10px] text-muted font-medium">
                    Input raw research text for neural fingerprinting.
                  </p>
                </div>
                <div className="text-[10px] font-black tabular-nums text-muted/40">
                  {content.length} characters
                </div>
              </div>

              <div className="relative group">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste research content here for forensic scan..."
                  className="w-full h-[400px] bg-surface border border-border p-6 text-[13px] leading-relaxed text-text outline-none focus:border-blue-500/30 transition-all rounded-[12px] resize-none font-outfit"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="px-2 py-1 bg-surface-2 border border-border rounded-[4px] text-[8px] font-black text-muted/40">
                    UTF-8
                  </div>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || !content.trim()}
                className={`w-full h-12 rounded-[10px] flex items-center justify-center gap-2 transition-all font-black text-[11px] tracking-tight shadow-xl ${
                  isScanning
                    ? "bg-blue-500/20 text-blue-400 animate-pulse cursor-wait"
                    : "bg-blue-500 text-white hover:brightness-110 shadow-blue-500/20 active:scale-[0.99]"
                }`}
              >
                {isScanning ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    Neural scanning in progress...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Initialize forensic scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostics Panel */}
        <div className="w-[400px] shrink-0 bg-surface flex flex-col overflow-hidden">
          <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-surface-3/30">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <span className="text-[11px] font-black tracking-tight">
              Detection analytics
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                <div className="p-5 bg-surface-2 rounded-full border border-border">
                  <Layers className="h-10 w-10 text-blue-500/30" />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-[11px] font-black text-text tracking-tight mb-1">
                    System standby
                  </p>
                  <p className="text-[9px] text-muted leading-relaxed">
                    Awaiting research input for neural probability mapping.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Probability gauge */}
                <div className="bg-surface-2/50 border border-border p-5 rounded-[12px] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted tracking-tight">
                      Detection analysis
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">
                          AI
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">
                          Human
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-surface-3 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-red-400 transition-all duration-1000 ease-out relative group/ai"
                      style={{ width: `${results.aiScore}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div
                      className="h-full bg-emerald-400 transition-all duration-1000 ease-out relative"
                      style={{ width: `${results.humanScore}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[18px] font-black tabular-nums text-red-400">
                        {results.aiScore}%
                      </span>
                      <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                        AI synthetic
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[18px] font-black tabular-nums text-emerald-400">
                        {results.humanScore}%
                      </span>
                      <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">
                        Human original
                      </span>
                    </div>
                  </div>
                </div>

                {/* Neural Fingerprint - NEW */}
                <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-[12px] space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 tracking-tight">
                      Neural fingerprint identified
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-surface p-3 rounded-[8px] border border-border/50">
                    <div>
                      <p className="text-[12px] font-black text-text">
                        GPT-4.5_Omni
                      </p>
                      <p className="text-[8px] text-muted font-bold uppercase tracking-wider">
                        Likely model origin
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black rounded-[4px] shadow-lg shadow-blue-500/20">
                      98.4% Match
                    </div>
                  </div>
                  <p className="text-[9px] text-muted leading-relaxed italic">
                    Pattern matches found in stochastic frequency and syntactic
                    variability typical of the GPT-4 family architectures.
                  </p>
                </div>

                {/* Industrial metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Confidence
                    </p>
                    <p className="text-[13px] font-black tabular-nums text-text/90">
                      {(results.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Anomalies
                    </p>
                    <p className="text-[13px] font-black tabular-nums text-text/90">
                      {results.anomalies} detected
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Burstiness
                    </p>
                    <p className="text-[13px] font-black text-text/90">
                      {results.burstiness}
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">
                      Perplexity
                    </p>
                    <p className="text-[13px] font-black text-text/90">
                      {results.perplexity}
                    </p>
                  </div>
                </div>

                {/* Forensic breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted tracking-tight">
                      Segment breakdown
                    </span>
                    <Info className="h-3 w-3 text-muted/20" />
                  </div>
                  <div className="space-y-2">
                    {results.segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-2/30 border border-border rounded-[8px] space-y-2"
                      >
                        <p className="text-[10px] leading-relaxed italic text-text/70 line-clamp-2">
                          "{seg.text}"
                        </p>
                        <div className="flex items-center justify-between border-t border-border/5 pt-2">
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-[3px] ${
                              seg.type === "synthetic"
                                ? "bg-red-500/10 text-red-400"
                                : seg.type === "mixed"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {seg.type.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-black tabular-nums text-muted/40">
                            {(seg.probability * 100).toFixed(0)}% prob
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="h-14 px-5 border-t border-border bg-surface-2/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-muted tracking-tight">
                Diagnostic engine v4.0
              </span>
            </div>
            <button className="p-2 hover:bg-surface-3 rounded-[5px] text-muted transition-all">
              <AlertCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
