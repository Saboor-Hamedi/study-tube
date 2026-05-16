# 07: Format Synchronization Fix (Finalized)

### The Problem
In "Read Mode," forensic highlights would cause layout shifts where characters (like a trailing 't') would "drop" to the next line, or text segments would "move up" and collapse manual line breaks. Additionally, ghost previews (hover replacements) were occasionally misaligned, appearing "half-way" above the original word.

### The Root Cause
- **Box Model Conflicts**: Standard `inline` wrappers don't provide a stable anchor for absolute-positioned ghost previews.
- **Baseline Drift**: Using separate positioning for old and new words caused vertical discrepancies when the font or line-height was high-density.

### The Solution: Zero-Shift Grid Stack
We implemented a refined **`inline-grid`** stacking architecture. By using a single-cell grid, we force both the "Old Word" and the "New Word" to occupy the exact same physical coordinates.

```jsx
<span
  // Zero-Shift Grid: Stacking words in a shared box to lock the baseline
  className="relative inline-grid grid-cols-1 grid-rows-1 align-baseline rounded-sm transition-colors duration-200"
  style={{ display: "inline-grid" }}
>
  {/* Old Word: Occupies the grid cell and determines the box width */}
  <motion.span
    className="grid-area-1-1 font-light tracking-wide px-[1px]"
    style={{
      gridArea: "1/1",
      background: `linear-gradient(...)`,
    }}
    animate={{
      y: ghostPreview?.start === hl.start ? -15 : 0,
      opacity: ghostPreview?.start === hl.start ? 0 : 1,
    }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    {content.substring(hl.start, hl.end)}
  </motion.span>

  {/* Ghost Preview: Occupies the SAME grid cell, ensuring perfect vertical alignment */}
  {ghostPreview?.start === hl.start && (
    <motion.span
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="grid-area-1-1 font-light tracking-wide whitespace-nowrap"
      style={{ gridArea: "1/1" }}
    >
      {ghostPreview.suggestion}
    </motion.span>
  )}
</span>
```

### Why this works:
1.  **Atomic Box**: The `inline-grid` behaves as a single atomic unit in the text flow, preventing the browser from breaking punctuation away from the word.
2.  **Shared Coordinates**: Using `grid-area: 1/1` means the "New Word" doesn't need absolute coordinates; it automatically lands exactly where the "Old Word" was.
3.  **Baseline Lock**: The `align-baseline` property on the grid container ensures that the entire forensic stack sits perfectly on the line of text, regardless of the height of the replacement suggestion.
