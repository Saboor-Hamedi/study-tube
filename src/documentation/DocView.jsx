import React, { memo, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import DocSidebar from "./DocSidebar";
import DocBody from "./DocBody";
import PulseLoader from "../features/research-vault/PulseLoader";
import { api } from "../utils/api-bridge";
import { Library } from "lucide-react";

const DocView = () => {
  const [docs, setDocs] = useState([]);
  const [index, setIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const data = await api.checkDocs();
        console.log("[DOCS] Data received:", data);
        setDocs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[DOCS] Initialization failed:", err);
        setDocs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Force specific sort (Introduction first)
  const sortedDocs = useMemo(() => {
    if (!Array.isArray(docs) || docs.length === 0) return [];
    return [...docs].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      if (nameA === "documentation.md") return -1;
      if (nameB === "documentation.md") return 1;
      return nameA.localeCompare(nameB);
    });
  }, [docs]);

  const handleNavigate = (fileName) => {
    const targetIndex = sortedDocs.findIndex(
      (d) => d.name?.toLowerCase() === fileName.toLowerCase(),
    );
    if (targetIndex !== -1) {
      setIndex(targetIndex);
    }
  };

  const filteredDocs = useMemo(() => {
    if (!Array.isArray(sortedDocs)) return [];
    return sortedDocs.filter(
      (d) =>
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sortedDocs, searchQuery]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full w-full absolute inset-0 z-50">
        <PulseLoader />
      </div>
    );
  }

  const current = filteredDocs[index] || filteredDocs[0] || sortedDocs[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full bg-surface-3 overflow-hidden relative select-text cursor-text"
    >
      {/* Body on the Left */}
      <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative bg-white">
        {current ? (
          <DocBody 
            content={current?.content || "# Documentation Unavailable"}
            onNavigate={handleNavigate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-20 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Library className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">System Archive Empty</h2>
              <p className="text-sm text-muted/60 leading-relaxed">
                No documentation nodes were found in the archival repository. Please verify the <code className="bg-surface-3 px-1 rounded text-accent">electron/docs</code> directory.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar on the Right */}
      <DocSidebar 
        docs={filteredDocs.length > 0 ? filteredDocs : sortedDocs}
        currentIndex={index}
        onSelect={setIndex}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </motion.div>
  );
};

export default memo(DocView);
