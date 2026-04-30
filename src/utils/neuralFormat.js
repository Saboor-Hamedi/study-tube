export const formatNeuralText = (text) => {
  if (!text) return "";
  
  // 1. Scrub ALL industrial bars/dividers (━━━, ---, ***, ===, ———)
  // We use a wide-spectrum regex for all box-drawing and dash characters
  let scrubbed = text.split('\n').map(line => {
    // Strips box-drawing, dashes, equals, and asterisks from the boundaries of the line
    const clean = line.replace(/^[━\-\*\=\s\u2500-\u257F\u2010-\u2015]+|[━\-\*\=\s\u2500-\u257F\u2010-\u2015]+$/g, '').trim();
    return clean || line; 
  }).join('\n');

  let formatted = scrubbed
    // 2. Tables (PRIORITY)
    .replace(/((?:.*\|.*(?:\r?\n)?)+)/g, (match) => {
      const rows = match.trim().split('\n').filter(r => r.includes('|'));
      if (rows.length < 2) return match;
      
      const formattedRows = rows.map((row, i) => {
        if (row.includes('---')) return ''; // Skip separator row
        const cells = row.split('|').map(c => c.trim()).filter((c, idx, arr) => {
          if ((idx === 0 || idx === arr.length - 1) && c === "") return false;
          return true;
        });
        const tag = (i === 0) ? 'th' : 'td';
        return `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
      }).filter(Boolean).join('');
      
      return `<table class="neural-table"><tbody>${formattedRows}</tbody></table>`;
    })

    // 3. Markers & Headers
    .replace(/^🧠\s*(.*$)/gm, '<span class="marker-header">🧠 $1</span>')
    .replace(/^✅\s*(.*$)/gm, '<span class="marker-success">✅ $1</span>')
    .replace(/^❌\s*(.*$)/gm, '<span class="marker-error">❌ $1</span>')
    .replace(/^(#{1,6})\s*(.*$)/gm, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level}>${content}</h${level}>`;
    })

    // 4. Clean Dividers (Stays left-aligned)
    .replace(/^[🔍📌📊📝🚀📐⚠️]\s*.*$/gm, (match) => {
       // Only trigger if it's a known header marker or all caps
       return `<div class="neural-divider">${match.trim()}</div>`;
    })
    
    // 5. Bold & Italics
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    
    // 6. Lists
    .replace(/^\- (.*$)/gm, '<div class="neural-list-item"><span>•</span><span>$1</span></div>')
    .replace(/^(\d+)\.\s*(.*$)/gm, '<div class="neural-list-item"><span class="neural-list-num">$1.</span><span>$2</span></div>');

    // 7. Final Pass - Paragraphs & Line Breaks
    const blocks = formatted.split('\n\n').map(p => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith('<table') || trimmed.startsWith('<div') || trimmed.startsWith('<h') || trimmed.startsWith('<hr') || trimmed.startsWith('<span')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    });

    return blocks.filter(Boolean).join('\n');
};
