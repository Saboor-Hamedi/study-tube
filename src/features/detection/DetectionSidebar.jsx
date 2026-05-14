import React from "react";
import AIDiagnosticHub from "./DetectionDiagnosticHub";

const DetectionSidebar = ({ results, isScanning, content }) => {
  return (
    <div className="shrink-0 z-[60] relative border-l border-border/10 bg-surface-2 flex flex-col h-full">
      {/* 
          Currently wraps the AIDiagnosticHub. 
          Architecture allows for future history lists or settings nodes.
      */}
      <AIDiagnosticHub 
        results={results} 
        isScanning={isScanning} 
        content={content} 
      />
    </div>
  );
};

export default DetectionSidebar;
