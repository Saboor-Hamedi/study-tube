# Writella Technical Documentation: The SQLite Transformation

## Architectural Pivot: JSON to SQLite3

As of version 1.0.3, Writella has successfully migrated its entire data persistence layer from legacy JSON files (`library.json`, `notes.json`, `collections.json`) to a high-performance, ACID-compliant **SQLite3** database engine.

### Why the Migration?

- **Speed**: Atomic writes and indexed reads now allow for near-instant data operations, even as the neural archive grows to thousands of entries.
- **Reliability**: SQLite’s ACID (Atomicity, Consistency, Isolation, Durability) properties prevent data corruption during power failures or unexpected crashes.
- **Advanced Search**: Implementation of **FTS5 (Full-Text Search)** provides "Neural-grade" indexing across all research definitions and titles.

## The Research Studio Hardening

### 1. Neural FTS Discovery Engine

Writella has evolved its search capabilities into a dual-intelligence system:

- **Linguistically Intelligent Search**: Integrated the **Porter Stemmer** and **Unicode 61** tokenization. The search engine now understands word roots (e.g., "lets" matches "let's" and "let"), ensuring that punctuation or grammatical variations do not stop your research.
- **Context-Aware Highlights**: Leverages SQLite's `snippet()` function to generate real-time "Research Snippets" in the search dropdown, highlighting exact query matches within definitions and source sentences.
- **Search Discovery Log**: Implemented a persistent, SQLite-backed history system. Previous research vectors are stored and can be instantly recalled with keyboard navigation.

### 2. High-Performance Indexing Architecture

To maintain instantaneous responsiveness, the following B-Tree indexes have been deployed on the primary `library` table:

- **`idx_library_collection`**: Accelerates folder/collection switching.
- **`idx_library_date`**: Ensures chronologically perfect sorting for the research archive.
- **`idx_library_archived`**: Optimizes the filtering logic for the Trash and active views.

### 3. Industrial UI Refinements

- **Kinetic Keyboard Navigation**: Fully keyboard-first search experience with Arrow-Key cycling through history and FTS results.
- **Bit-Perfect Parallel Alignment**: Redesigned the search dropdown for seamless, parallel integration with the search input, using industrial `bg-accent/20` floods and vertical "Active Indicators."
- **Tactical Silence**: Purged all diagnostic probes and alerts for a professional production release.

## Backend Architecture

### 1. The Core Engine (`better-sqlite3`)

We utilize the `better-sqlite3` native driver for Node.js. It is the fastest SQLite library available, offering synchronous-like performance on a multi-threaded asynchronous architecture.

- **WAL Mode (Write-Ahead Logging)**: Enabled by default to allow simultaneous reading and writing without blocking the UI thread.
- **Automatic Migration**: The system features a "Neural Bridge" that detected legacy JSON data and safely imported **317+ entries** into the SQL schema on first launch.

### 2. Database Schema

Writella utilizes three primary tables designed for relational research:

- **`library`**: Stores captured vocabulary, definitions, and AI metadata.
- **`notes`**: A high-performance singleton table storing the primary Research Editor state.
- **`collections`**: Manages the folder hierarchy and research organization.

### 3. FTS5 Neural Indexing

Every research entry is indexed in an **FTS5 Virtual Table**. This allows for:

- Prefix matching (find "Quant" to get "Quantum").
- Phrase ranking (the most relevant research surfaces first).
- Near-instant global search across the entire archive.

## IPC Bridge (Inter-Process Communication)

The frontend communicates with the SQLite service through a hardened **IPC Bridge**:

- **`vocab:save`**: Serializes the research stack to the relational table.
- **`notes:save`**: Auto-saves the Editor.js state every 3 seconds (Debounced Auto-Save Engine).
- **`collections:save`**: Persists the folder structure.

## Industrial Build Pipeline

Because the backend utilizes Native C++ modules, the build system (`electron-builder`) has been hardened with an **Automated Rebuild Cycle**. This ensures that the binary is perfectly optimized for the target OS (Windows/Linux) during the GitHub Release phase.

## Phase 2: The Neural Feedback Hub Industrialization

As of version 1.0.5, the **Neural Feedback Hub** has been transformed into a professional-grade academic auditing and research synthesis suite.

### 1. Neural Co-Pilot (Intelligent Sidebar)

The intelligence layer has been redesigned for a high-density industrial workflow:

- **Peek-State Architecture**: Implemented a **55px persistent peek-bar** that ensures the Co-Pilot is always accessible without occupying significant workspace.
- **Vertical Alignment Sync**: The peek-bar and collapsed headers are bit-perfectly aligned at **h-14 (56px)** to match the primary Profile and Sidebar headers.
- **Industrial Stacking**: Optimized the **Global Neural Menu** with a dynamic 70px offset and z-index hardening to prevent UI collisions with the Co-Pilot trigger zone.

### 2. Forensic Engine: Academic Rigor

The diagnostic pipeline has evolved from simple pattern-matching into a sophisticated forensic linguistic engine:

- **Academic Rigor Scoring**: A new weighted metric (45% total weight) that evaluates the authority of the draft based on linguistic markers.
- **Hedge Word Detection**: Flags "escape hatch" terminology (*maybe, probably, suggests*) that reduces research certainty.
- **Subjectivity Guard**: Identifies first-person subjective phrasing (*I think, in my opinion*) and prompts for objective, third-person alternatives.
- **Weak Verb Analysis**: Detects low-precision common verbs (*get, make, do*) and suggests high-impact academic replacements.

### 3. Modular Architecture: `useRigor` Hook

To prevent component bloating (God Component anti-pattern), the entire linguistic logic has been decoupled from the UI:

- **Atomic Logic**: All regex, scoring algorithms, and diagnostic rules are centralized in the **`useRigor.js`** hook.
- **Universal Portability**: The forensic engine can now be imported into any component (Forge, Library, or Sidebar) to provide consistent diagnostic feedback.

### 4. Contextual Anomaly Navigation

Bridged the gap between the draft text and the feedback sidebar:

- **Neural Anomaly IDs**: Every linguistic issue is assigned a unique ID (e.g., "5") rendered as a high-density interactive bubble.
- **Click-to-Sync**: In-text bubbles are now navigational elements. Clicking an ID instantly scrolls the Feedback Hub to the corresponding explainable card.
- **Forensic Tooltips**: Hovering over in-text highlights provides immediate context (e.g., "Hedge Word") via the browser's native title system, enriched with industrial styling.
