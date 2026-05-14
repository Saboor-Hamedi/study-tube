import React from "react";
import { motion } from "framer-motion";
import ReportBody from "./ReportBody";

const ReportView = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full bg-background overflow-hidden relative"
    >
      <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        <ReportBody />
      </div>
    </motion.div>
  );
};

export default ReportView;
