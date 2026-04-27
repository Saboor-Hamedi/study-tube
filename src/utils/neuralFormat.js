export const formatNeuralText = (text) => {
  if (!text) return "";
  
  return text
    // Markers & Headers (Full Spectrum H1-H6) - PRIORITIZED
    .replace(/^🧠\s*(.*$)/gm, '<span class="marker-header">🧠 $1</span>')
    .replace(/^✅\s*(.*$)/gm, '<span class="marker-success">✅ $1</span>')
    .replace(/^❌\s*(.*$)/gm, '<span class="marker-error">❌ $1</span>')
    .replace(/^(#{1,6})\s*(.*$)/gm, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level}>${content}</h${level}>`;
    })

    // Horizontal Lines (Surgically Tight)
    .replace(/\n\s*[\-\*]{3,}\s*\n/g, '<hr class="neural-hr" />')
    .replace(/^[\-\*]{3,}$/gm, '<hr class="neural-hr" />')
    
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    
    // Simple Lists
    .replace(/^\- (.*$)/gm, '<div style="display: flex; gap: 8px; margin-bottom: 4px;"><span style="opacity: 0.3">•</span><span>$1</span></div>')
    
    // Tables (Flexible Markdown Parsing)
    .replace(/((?:.*\|.*(?:\r?\n)?)+)/g, (match) => {
      const rows = match.trim().split('\n').filter(r => !r.includes('---') && r.includes('|'));
      if (rows.length < 2) return match;
      
      const formattedRows = rows.map((row, i) => {
        const cells = row.split('|').map(c => c.trim()).filter((c, idx, arr) => {
          // Filter out empty cells at the ends caused by outer pipes
          if ((idx === 0 || idx === arr.length - 1) && c === "") return false;
          return true;
        });
        const tag = (i === 0) ? 'th' : 'td';
        return `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
      }).join('');
      
      return `<table class="neural-table"><tbody>${formattedRows}</tbody></table>`;
    });
};
