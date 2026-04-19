# StudyTube Technical Documentation: The SQLite Transformation

## Architectural Pivot: JSON to SQLite3

As of version 1.0.3, StudyTube has successfully migrated its entire data persistence layer from legacy JSON files (`library.json`, `notes.json`, `collections.json`) to a high-performance, ACID-compliant **SQLite3** database engine.

### Why the Migration?

- **Speed**: Atomic writes and indexed reads now allow for near-instant data operations, even as the neural archive grows to thousands of entries.
- **Reliability**: SQLite’s ACID (Atomicity, Consistency, Isolation, Durability) properties prevent data corruption during power failures or unexpected crashes.
- **Advanced Search**: Implementation of **FTS5 (Full-Text Search)** provides "Neural-grade" indexing across all research definitions and titles.

## Backend Architecture

### 1. The Core Engine (`better-sqlite3`)

We utilize the `better-sqlite3` native driver for Node.js. It is the fastest SQLite library available, offering synchronous-like performance on a multi-threaded asynchronous architecture.

- **WAL Mode (Write-Ahead Logging)**: Enabled by default to allow simultaneous reading and writing without blocking the UI thread.
- **Automatic Migration**: The system features a "Neural Bridge" that detected legacy JSON data and safely imported **317+ entries** into the SQL schema on first launch.

### 2. Database Schema

StudyTube utilizes three primary tables designed for relational research:

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
