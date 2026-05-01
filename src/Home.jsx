import React from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  Search, 
  Shield, 
  Library, 
  User, 
  ChevronRight,
  ClipboardCheck,
  Activity,
  Cpu
} from "lucide-react";

const Home = ({ setView, vocabCount = 0, onOpenCapture }) => {
  const launchPoints = [
    {
      id: "profile",
      title: "Research Forge",
      subtitle: "Forensic Lab",
      description: "Structural auditing and neural origin detection for academic drafts.",
      icon: Cpu,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
      accent: "from-accent/20 to-orange-500/5"
    },
    {
      id: "search",
      title: "Video Intel",
      subtitle: "Knowledge Retrieval",
      description: "Extract scholarly insights and neural transcripts from global video.",
      icon: Search,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      accent: "from-red-500/20 to-rose-500/5"
    },
    {
      id: "ai-detection",
      title: "Neural Sentry",
      subtitle: "AI Detection",
      description: "Audit documents for synthetic predictability and algorithmic patterns.",
      icon: Shield,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      accent: "from-purple-500/20 to-indigo-500/5"
    },
    {
      id: "vocab",
      title: "Research Vault",
      subtitle: "Library Archive",
      description: "Manage your persistent library of neural nodes and archived audits.",
      icon: Library,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      accent: "from-emerald-500/20 to-teal-500/5"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-full flex flex-col bg-surface-1 overflow-hidden relative select-text">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-12 py-12 flex flex-col items-center relative">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 mb-12 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full mb-2">
            <Zap className="h-2.5 w-2.5 text-accent fill-accent" />
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Neural Studio v1.0.5</span>
          </div>
          <h1 className="text-[42px] font-black text-text tracking-tighter leading-[0.95] uppercase">
            Industrial <br />
            <span className="text-accent text-[38px]">Research Forge</span>
          </h1>
          <p className="text-[12px] text-muted font-medium leading-relaxed max-w-md mx-auto opacity-70">
            High-density environment for neural linguistic auditing and structural origin detection.
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 w-full max-w-4xl"
        >
          {launchPoints.map((point) => (
            <motion.div
              key={point.id}
              variants={item}
              whileHover={{ scale: 1.01 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${point.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-[12px] blur-[2px]`} />
              <div 
                onClick={() => setView(point.id)}
                className="relative bg-surface-2 border border-border/10 rounded-[12px] p-5 h-full flex flex-col justify-between hover:border-accent/30 transition-all shadow-lg group-hover:shadow-xl cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-[10px] ${point.bg} group-hover:scale-105 transition-transform`}>
                      <point.icon className={`h-5 w-5 ${point.color}`} />
                    </div>
                    <div className={`p-1.5 rounded-full ${point.bg} opacity-0 group-hover:opacity-100 group-hover:bg-accent group-hover:text-white transition-all`}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${point.color} opacity-80`}>{point.subtitle}</p>
                    <h3 className="text-[18px] font-black text-text uppercase tracking-tight">{point.title}</h3>
                  </div>
                  <p className="mt-3 text-[11px] text-muted leading-relaxed font-medium opacity-80 line-clamp-2">
                    {point.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/5 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-5 w-5 rounded-full border border-surface-2 bg-surface-3 flex items-center justify-center overflow-hidden">
                          <User className="h-2.5 w-2.5 text-muted/40" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[8px] font-bold text-muted/40 uppercase tracking-widest">Studio Access</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Global Statistics Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 w-full max-w-4xl grid grid-cols-4 gap-6 border-t border-border/5 pt-10"
        >
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-muted uppercase tracking-widest">Neural Density</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-black text-text tracking-tighter">{vocabCount}</span>
              <span className="text-[9px] font-bold text-accent uppercase">Nodes</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-muted uppercase tracking-widest">Audit Latency</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-black text-text tracking-tighter">1.2s</span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase">Optimal</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-muted uppercase tracking-widest">Intelligence</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-black text-text tracking-tighter">GPT-2L</span>
              <span className="text-[9px] font-bold text-purple-500 uppercase">Active</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-muted uppercase tracking-widest">Security</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-black text-text tracking-tighter">AES-256</span>
              <span className="text-[9px] font-bold text-blue-500 uppercase">Secure</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global Bottom Horizon Alignment (72px Baseline) */}
      <div className="h-[72px] border-t border-border/5 px-8 flex items-center justify-between bg-surface-2/30 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-text/60 uppercase tracking-widest">Neural Network: Connected</span>
          </div>
          <div className="h-3 w-px bg-border/10" />
          <span className="text-[8px] font-black text-text/40 uppercase tracking-widest leading-none">System Load: 12%</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-surface-3 hover:bg-surface-4 text-[8px] font-black uppercase tracking-widest rounded-[4px] border border-border/10 transition-all">
            Terminal
          </button>
          <button 
            onClick={onOpenCapture}
            className="px-3 py-1.5 bg-accent hover:brightness-110 text-white text-[8px] font-black uppercase tracking-widest rounded-[4px] flex items-center gap-2 transition-all shadow-lg shadow-accent/20 border border-white/10"
          >
            <Zap className="h-2.5 w-2.5 fill-white" />
            Forge Insight
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
