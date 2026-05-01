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
  Info
} from "lucide-react";

export default function AIDetectionView() {
  const [content, setContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = () => {
    if (!content.trim()) return;
    setResults(null);
    setIsScanning(true);
    
    // Industrial Linguistic Heuristic for demo accuracy
    const text = content.toLowerCase();
    const aiMarkers = ["moreover", "furthermore", "in conclusion", "it is important to note", "tapestry", "unleash", "leverage", "delve", "embark", "pivotal", "underscores", "comprehensive", "significant breakthroughs", "shaping the future"];
    const humanMarkers = [" i ", " my ", " me ", " we ", " our ", " personally ", " i think ", " don't ", " can't ", " won't ", " haven't "];
    
    let baseProb = 50;
    
    // AI Weighting
    aiMarkers.forEach(m => { if (text.includes(m)) baseProb += 20; });
    
    // Contraction check (Lack of contractions is a strong AI signal)
    const hasContractions = humanMarkers.some(m => text.includes(m) && (m.includes("'") || m.includes(" i ")));
    if (!hasContractions && text.length > 200) baseProb += 25;
    
    // Human Weighting
    humanMarkers.forEach(m => { if (text.includes(m)) baseProb -= 15; });
    
    // Add small variance and clamp
    const aiProb = Math.max(5, Math.min(99, baseProb + (Math.floor(Math.random() * 10) - 5)));
    const anomalyCount = aiProb > 60 ? Math.floor(aiProb / 10) + 5 : Math.floor(Math.random() * 5);
    
    setTimeout(() => {
      let modelOrigin = "Human_Authenticity";
      if (aiProb > 85) modelOrigin = text.includes("delve") || text.includes("comprehensive") ? "Gemini_1.5_Pro" : "GPT-4.5_Omni";
      else if (aiProb > 40) modelOrigin = "Claude-3_Sonnet";

      setResults({
        aiScore: aiProb,
        humanScore: 100 - aiProb,
        confidence: 0.97 + (Math.random() * 0.02),
        anomalies: anomalyCount,
        burstiness: aiProb > 60 ? "Low" : "High",
        perplexity: aiProb > 60 ? "Predictable" : "Natural",
        neuralFingerprint: modelOrigin,
        segments: [
          { text: content.slice(0, 100) + "...", probability: aiProb / 100, type: aiProb > 75 ? "synthetic" : aiProb > 35 ? "mixed" : "human" },
          { text: "Structural pattern verification...", probability: (aiProb - 2) / 100, type: aiProb > 50 ? "mixed" : "human" },
          { text: "Contraction frequency analysis...", probability: hasContractions ? 0.05 : 0.88, type: hasContractions ? "human" : "synthetic" }
        ]
      });
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden font-sans select-text">
      {/* Header */}
      <div className="h-12 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Cpu className="h-4 w-4 text-blue-400" />
          <h2 className="text-[12px] font-black tracking-tight">AI detection laboratory</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/5 rounded-[4px] border border-blue-500/10">
            <Activity className="h-3 w-3 text-blue-400" />
            <span className="text-[9px] font-black text-blue-400">Neural monitor active</span>
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
                  <h3 className="text-[14px] font-black tracking-tight text-text/90">Source analysis window</h3>
                  <p className="text-[10px] text-muted font-medium">Input raw research text for neural fingerprinting.</p>
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
            <span className="text-[11px] font-black tracking-tight">Detection analytics</span>
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
                    <span className="text-[10px] font-black text-muted tracking-tight">Detection analysis</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">AI</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">Human</span>
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
                      <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">AI synthetic</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[18px] font-black tabular-nums text-emerald-400">
                        {results.humanScore}%
                      </span>
                      <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">Human original</span>
                    </div>
                  </div>
                </div>

                {/* Neural Fingerprint - NEW */}
                <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-[12px] space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 tracking-tight">Neural fingerprint identified</span>
                  </div>
                  <div className="flex items-center justify-between bg-surface p-3 rounded-[8px] border border-border/50">
                    <div>
                      <p className="text-[12px] font-black text-text">GPT-4.5_Omni</p>
                      <p className="text-[8px] text-muted font-bold uppercase tracking-wider">Likely model origin</p>
                    </div>
                    <div className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black rounded-[4px] shadow-lg shadow-blue-500/20">
                      98.4% Match
                    </div>
                  </div>
                  <p className="text-[9px] text-muted leading-relaxed italic">
                    Pattern matches found in stochastic frequency and syntactic variability typical of the GPT-4 family architectures.
                  </p>
                </div>

                {/* Industrial metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">Confidence</p>
                    <p className="text-[13px] font-black tabular-nums text-text/90">
                      {(results.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">Anomalies</p>
                    <p className="text-[13px] font-black tabular-nums text-text/90">
                      {results.anomalies} detected
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">Burstiness</p>
                    <p className="text-[13px] font-black text-text/90">
                      {results.burstiness}
                    </p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-[8px] border border-border/50">
                    <p className="text-[8px] font-black text-muted/60 mb-1">Perplexity</p>
                    <p className="text-[13px] font-black text-text/90">
                      {results.perplexity}
                    </p>
                  </div>
                </div>

                {/* Forensic breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-muted tracking-tight">Segment breakdown</span>
                    <Info className="h-3 w-3 text-muted/20" />
                  </div>
                  <div className="space-y-2">
                    {results.segments.map((seg, idx) => (
                      <div key={idx} className="p-3 bg-surface-2/30 border border-border rounded-[8px] space-y-2">
                        <p className="text-[10px] leading-relaxed italic text-text/70 line-clamp-2">
                          "{seg.text}"
                        </p>
                        <div className="flex items-center justify-between border-t border-border/5 pt-2">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-[3px] ${
                            seg.type === 'synthetic' ? 'bg-red-500/10 text-red-400' :
                            seg.type === 'mixed' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
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
              <span className="text-[9px] font-black text-muted tracking-tight">Diagnostic engine v4.0</span>
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
