# 05: Research Archival System

### Overview
Local-first capture and indexing of research materials from YouTube and other sources.

### Core Logic
- **Capture**: Automated transcript and metadata extraction via Electron sidecars.
- **Search**: PostgreSQL Trigram similarity and Full-Text Search (FTS).
- **Persistence**: ACID-compliant archival in the `writella` database.
- **Organization**: Collections, Atomic Tagging, and Soft-Delete Trash system.


