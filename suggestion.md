# Neural Research Studio: Industrial Roadmap

This document outlines the architectural and engineering enhancements proposed for the next phase of the Neural Research Studio. The focus is on **Industrialization, Optimization, and DX (Developer Experience)** rather than adding new UI features.

---

## 🧠 Phase 1: Neural State De-coupling (Zustand)
Transition away from the centralized React state in `App.jsx` towards a high-performance, atomic state management system.

- **Objective**: Move all `vocab`, `collections`, `messages`, and `theme` states into dedicated external stores.
- **Architectural Shift**:
  - `src/store/useResearchStore.js`: Persistent SQL-mirrored state.
  - `src/store/useChatStore.js`: Ephemeral neural dialogue history.
- **Benefits**:
  - Eliminates excessive prop-drilling.
  - Improves component re-render performance by 30-40%.
  - Enables true feature independence where components "tap in" only to the data they need.

## 🛠️ Phase 2: Encapsulated "Neural Hooks" Library
Abstract complex AI and data-bridge logic into a reusable collection of custom React hooks.

- **Proposed Hooks**:
  - `useNeuralChat()`: Abstract logic for AI streaming, chunking, and stop-mechanisms.
  - `useTranscriptRefiner()`: Logic for synthesis and reconstruction of raw video data.
  - `useResearchArchive()`: High-level API for SQLite pagination and searching.
- **Benefits**:
  - Standardizes AI interactions across different components (`VideoView`, `LibraryView`, `EditorView`).
  - Simplifies component files significantly (move ~200 lines of logic into hooks).
  - High portability for future research-focused projects.

## 🛡️ Phase 3: Neural Stabilizers & Error Boundaries
Implement a robust fault-tolerance layer to ensure the application remains stable during AI failures or network interruptions.

- **Objective**: Wrap feature domains in custom Error Boundaries that offer professional "Link Interrupted" fallback states.
- **Key Enhancements**:
  - **Graceful Failbacks**: If an AI stream fails, provide a specialized "Retry Synthesis" UI instead of a silent failure.
  - **Network Guards**: Advanced request timeouts and background retry logic for SQLite syncs.
- **Benefits**:
  - Professional, industrial-grade reliability.
  - Prevents "White Screen" crashes during research sessions.
  - Improved user confidence in the "Neural Link."

---

## ⚡ Build & Bundle Optimization
Ensure the application remains lean and performant as it scales.

- **Code Splitting**: Dynamically import larger features like `EditorView` (EditorJS) only when needed.
- **Bundle Analysis**: Prune unused icons and libraries to minimize the initial load time.
- **Dependency Audit**: Review and upgrade core dependencies to the latest 2025/2026 stable versions.
