import React from "react";
import PlagiarismDiagnosticHub from "./PlagiarismDiagnosticHub";

const PlagiarismSidebar = ({ results, isScanning, content, api }) => {
  return (
    <div className="shrink-0 z-[60] relative border-l border-border/10 bg-surface-2 flex flex-col h-full">
      <PlagiarismDiagnosticHub
        results={results}
        isScanning={isScanning}
        content={content}
        api={api}
      />
    </div>
  );
};

export default PlagiarismSidebar;
