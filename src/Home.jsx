import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Profile from "./features/users/Profile";

const Home = ({ 
  setView, 
  onOpenCapture, 
  api, 
  vocab, 
  setVocab, 
  onExpand, 
  showToast, 
  displayLimit, 
  setDisplayLimit 
}) => {
  const [version, setVersion] = useState("1.0.0");

  // Show version
  useEffect(() => {
    api?.getVersion().then((res) => res && setVersion(res));
  }, [api]);

  return (
    <div className="h-full flex flex-col bg-surface-1 overflow-hidden relative select-text">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Content: Profile Integration */}
      <div className="flex-1 overflow-hidden relative">
        <Profile
          vocab={vocab}
          setVocab={setVocab}
          onExpand={onExpand}
          api={api}
          showToast={showToast}
          displayLimit={displayLimit}
          setDisplayLimit={setDisplayLimit}
          onOpenCapture={onOpenCapture}
        />
      </div>

    </div>
  );
};

export default Home;
