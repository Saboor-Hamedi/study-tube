const fs = require('fs');
const path = require('path');
const os = require('os');

// Standard Electron paths on Windows
const userData = path.join(os.homedir(), 'AppData', 'Roaming', 'StudyTube');
console.log('Scanning Industrial Directory:', userData);

try {
    const files = fs.readdirSync(userData);
    console.log('Files found:', files.length);
    
    const candidates = files.filter(f => f.endsWith('.json'));
    candidates.forEach(f => {
        const stats = fs.statSync(path.join(userData, f));
        console.log(` - ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        // Peek inside if it's large (potentially the 30k archive)
        if (stats.size > 100 * 1024) {
             const content = fs.readFileSync(path.join(userData, f), 'utf-8');
             try {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    console.log(`   [!] Industrial Match: ${f} contains an array of ${data.length} items.`);
                } else if (data.vocab && Array.isArray(data.vocab)) {
                    console.log(`   [!] Industrial Match: ${f} contains 'vocab' array of ${data.vocab.length} items.`);
                }
             } catch(e) {}
        }
    });
    
} catch (err) {
    console.error('Scan Failure:', err.message);
}
