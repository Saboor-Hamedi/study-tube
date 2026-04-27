import { useEffect } from 'react';
import { useStore } from '../store/useStore';

/**
 * Global Keyboard Shortcut Hook
 * Centralizes all workspace commands:
 * - Ctrl + P: Focus Search
 * - Ctrl + B: Toggle Sidebar
 * - Escape: Blur Focus
 */
export const useShortcuts = (librarySearch) => {
  const { 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    isCopilotOpen,
    setIsCopilotOpen
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl + P: Focus Search
      if (isCmd && key === 'p') {
        e.preventDefault();
        librarySearch?.searchInputRef?.current?.focus();
      }

      // Ctrl + B: Toggle Sidebar
      if (isCmd && key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(!isSidebarCollapsed);
      }

      // Ctrl + I: Toggle Copilot
      if (isCmd && key === 'i') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }

      // Escape: Neural Reset (Blur all inputs)
      if (e.key === 'Escape') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          document.activeElement.blur();
        }
      }
    };

    // Use capture phase to ensure we override browser defaults (like Print dialog)
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [librarySearch, isSidebarCollapsed, setIsSidebarCollapsed, isCopilotOpen, setIsCopilotOpen]);
};
