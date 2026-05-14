# Writella: Master System Context

> [!IMPORTANT]
> This is the **Primary Knowledge Hub** for Writella. Any AI agent acting on this codebase MUST first reference this file and the linked sub-documents to understand the system architecture, feature status, and industrial constraints.

---

## Core Documentation Map

To understand specific domains of the system, navigate into the following folders:

### 1. [Context: Documentation](file:///b:/study-tube/context/docs)

Contains technical deep-dives into the core infrastructure.

- **[documentation.md](file:///b:/study-tube/context/docs/documentation.md)**: The "Source of Truth" for the architecture and mission. Covers:
  - **Project Goals**: Vision for English learners, AI detection, and academic rigor.
  - The pivot from JSON to **PostgreSQL**.
  - **pg_trgm Neural Search** engine logic.
  - **Neural Forensic Suite** linguistic audit engine.
  - **IPC Bridge** (Inter-Process Communication) protocols.

### 2. [Context: Features & Roadmap](file:///b:/study-tube/context/features)

Contains the strategic roadmap and detailed feature specifications.

- **[01-design-system-completed.md](file:///b:/study-tube/context/features/01-design-system-completed.md)**: Commercial strategy, licensing, and design pillars.
- **[02-future-details-suggestions.md](file:///b:/study-tube/context/features/02-future-details-suggestions.md)**: Phase 2 roadmap for the **Neural Feedback Hub** (Contextual Synthesis, Variant Toggling).
- **[handle-error-systems.md](file:///b:/study-tube/context/features/handle-error-systems.md)**: Critical maintenance guide, Port 8000 constraints, and cross-platform (Electron vs Web) architecture.

---

## System Constraints & "The Golden Rules"

1.  **Architecture**: Hybrid (Electron Desktop + Web Cloud) with a PostgreSQL backend.
2.  **Port 8000**: Exclusively reserved for the FastAPI/Uvicorn bridge.
3.  **Linguistic Forensic Suite**: Powered by the `useRigor` hook and a 450k-word dictionary (`legitimateDoubles.js`).
4.  **UI Consistency**: Maintain the **"Industrial Neural Dashboard"** aesthetic at all times. Do NOT reflow paragraphs during forensic audits.

---

_Last Updated: 2026-05-14_
