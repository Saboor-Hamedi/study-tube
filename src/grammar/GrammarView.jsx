import React, { memo, useState, useMemo } from "react";
import { motion } from "framer-motion";
import GrammarSidebar from "./GrammarSidebar";
import GrammarBody from "./GrammarBody";
import PulseLoader from "../features/research-vault/PulseLoader";

const GrammarView = ({ grammars = [], setView }) => {
  const [index, setIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Force Introduction to be first
  const sortedGrammars = useMemo(() => {
    if (!Array.isArray(grammars) || grammars.length === 0) return [];
    return [...grammars].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      if (nameA === "introduction.md") return -1;
      if (nameB === "introduction.md") return 1;
      return nameA.localeCompare(nameB);
    });
  }, [grammars]);

  const handleNavigate = (fileName) => {
    const targetIndex = sortedGrammars.findIndex(
      (g) => g.name?.toLowerCase() === fileName.toLowerCase(),
    );
    if (targetIndex !== -1) {
      setIndex(targetIndex);
    }
  };

  const filteredGrammars = useMemo(() => {
    return sortedGrammars.filter(
      (g) =>
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.content?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sortedGrammars, searchQuery]);

  // Use PulseLoader without a message as requested
  if (!grammars || grammars.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full w-full absolute inset-0 z-50">
        <PulseLoader />
      </div>
    );
  }

  const current = filteredGrammars[index] || filteredGrammars[0] || sortedGrammars[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full bg-background overflow-hidden relative select-text cursor-text"
    >
      {/* Body on the Left (Seamless) */}
      <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        <GrammarBody 
          content={current?.content || "# Content Unavailable"}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Sidebar on the Right (Seamless) */}
      <GrammarSidebar 
        grammars={filteredGrammars.length > 0 ? filteredGrammars : sortedGrammars}
        currentIndex={index}
        onSelect={setIndex}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </motion.div>
  );
};

export default memo(GrammarView);
