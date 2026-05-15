# 04: Neural Forensic Suite

### Overview
Surgical auditing of academic manuscripts for linguistic anomalies and AI-generated signatures.

### Core Logic
- **Engine**: `useRigor.js` utilizing a memoized Trie (450k+ words).
- **UI Interaction**: "Zero-Shift" grid stacking in `WritingBody.jsx`.
- **Animations**: Ghost Preview transitions (Old moves up, New moves in).
- **Feedback**: 4-section diagnostic cards (Action, Category, Message, Suggestion).
- **Constraint**: Must never reflow paragraphs during an active audit.


